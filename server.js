const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const { evaluate, map } = require('mathjs');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const swaggerDefinition = {
    info: {
        title: 'File Upload API',
        version: '1.0.0',
        description: 'API for uploading files and solving mathematical expressions',
    },
  host: `localhost:${port}`,
  basePath: '/',
};


const options = {
  swaggerDefinition: swaggerDefinition,
  apis: ['./server.js'], // Path to the API routes file
};

const swaggerSpec = swaggerJsdoc(options);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Empty sessions object
let sessions = {};

// function to generate sessionID in provided format
const generateSessionId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let sessionId = '';
    for (let i = 0; i < 20; i++) {
        sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 4 || i === 8 || i === 13) {
            sessionId += '-';
        }
    }
    return sessionId;
};

// function to solve the expression
const solveExpression = (expression) => {
    return eval(expression);
};

/**
 * @swagger
 * /api/v1/create-session:
 *   get:
 *     summary: Create a session
 *     description: Endpoint to create a new session for uploading files
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully created a session
 *         schema:
 *           type: object
 *           properties:
 *             Session_id:
 *               type: string
 */
app.get('/api/v1/create-session', (req, res) => {
    const sessionId = generateSessionId();
    sessions[sessionId] = new Map();
    res.json({ Session_id: sessionId });
    console.log(sessions);
});

//API to upload files
/**
 * @swagger
 * /api/v1/upload-file/{session_id}:
 *   post:
 *     summary: Upload and evaluate mathematical expressions from text files
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: session_id
 *         description: ID of the session to upload the files to
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: files
 *         type: array
 *         items:
 *           type: file
 *     responses:
 *       200:
 *         description: Sum of evaluated expressions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Result:
 *                   type: number
 */
app.post('/api/v1/upload-file/:session_id', upload.array('files'), (req, res) => {
    const sessionId = req.params.session_id;
    const files = req.files;

    //checking the wrong session
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }

    // files mapped to every sessions
    let resultMap = sessions[sessionId];
    
    //looping through multiple files 
    files.forEach(file => {

        const fileContent = file.buffer.toString('utf-8');

        const result = evaluate(fileContent);

        //checking the individuallity of files 
        if (!resultMap.hasOwnProperty(file.originalname)) {
            resultMap[file.originalname] = result;
        }
    });

    const resultMapEntries = Object.entries(resultMap);

    if (resultMapEntries.length > 15) {
        // Remove the oldest files if files greater than 15
        const filesToRemove = resultMapEntries.slice(0, resultMapEntries.length - 15).map(([fileName]) => fileName);
        filesToRemove.forEach(fileName => {
            delete resultMap[fileName];
        });
    }

    //adding the updated resultMap
    sessions[sessionId]=resultMap;

    // Calculate sum from all the files
    let sum = 0;
    Object.values(resultMap).forEach(value => {
        sum += value;
    });

    res.json({ Result: sum });
    
});

// API to delete a session
/**
 * @swagger
 * /api/v1/delete-session/{session_id}:
 *   delete:
 *     summary: Delete a session
 *     parameters:
 *       - in: path
 *         name: session_id
 *         description: ID of the session to delete
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message indicating successful deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
app.delete('/api/v1/delete-session/:session_id', (req, res) => {
    const sessionId = req.params.session_id;
    delete sessions[sessionId];
    res.json({ message: 'Session deleted successfully' });
});

//API to delete a particular file from a session
/**
 * @swagger
 * /api/v1/delete-file/{session_id}/{file_name}:
 *   delete:
 *     summary: Delete a file from the session.
 *     description: Endpoint to delete a specific file from the session.
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         description: The ID of the session.
 *         schema:
 *           type: string
 *       - in: path
 *         name: file_name
 *         required: true
 *         description: The name of the file to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Result:
 *                   type: number
 *                   description: Sum of remaining file results in the session after deletion.
 *       404:
 *         description: Session not found or file not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message indicating the reason for failure.
 */
app.delete('/api/v1/delete-file/:session_id/:file_name', (req, res) => {
    const sessionId = req.params.session_id;
    const fileName = req.params.file_name;

    // checking if session exist or not
    if (!sessions[sessionId]) {
        return res.status(404).json({ error: 'Session not found' });
    }

    let resultMap = sessions[sessionId];

    // checking if file exists or not
    if (!resultMap.hasOwnProperty(fileName)) {
        return res.status(404).json({ error: 'File not found' });
    }
    delete resultMap[fileName];
    sessions[sessionId]=resultMap;

    // Recalculating the  sum after deleting the file
    let sum = 0;
    Object.values(resultMap).forEach(value => {
        sum += value;
    });

    res.json({ Result: sum });
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
