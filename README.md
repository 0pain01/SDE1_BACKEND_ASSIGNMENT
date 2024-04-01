# SDE1_BACKEND_ASSIGNMENT

![image](https://github.com/0pain01/SDE1_BACKEND_ASSIGNMENT/assets/54894929/dc157359-9899-480b-8838-fbd5af59fcb3)

Created the assignemnt using javascript framework - nodeJS,ExpressJS
## Installation 
1.  install packages -> npm install express body-parser cors swagger-jsdoc swagger-ui-express multer
2.  then run the file with -> node server.js
3.  Go to the link "http://localhost:3000/api-docs/" -> to run the swagger UI

## Code Description
1. Installed swagger so that one can access the backend directly without the frontend application for usage.
2. Create-session API through GET uses a generateSessionId function that generates session id in the provided format and create and empty map attached with each session id.
3. Upload-file API through POST takes files in array format if multiple files are provided and takes session id as parameter and add the evaluated files, after removing the duplicate files as unique files need to be used in the assignment and returns the sum in JSON format.It also checks if the file count does not exceed 15 and if exceeding removes the oldest file.
4. Delete session API deletes the session which is passed in the parameter
5. Delete file API deletes file form the session and filename passed in the parameter adn returns the updated sum accordingly. 
