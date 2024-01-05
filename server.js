// Import stuff
const port = 3000;
const ip = require('ip');
var http = require('http');
const express = require('express');
const path = require('path');
const mysql = require('mysql');
const { error } = require('console');
let initalPath = path.join(__dirname, "public");
const app = express();
app.use(express.json());
app.use(express.static(initalPath));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

// Connect to database
var tutorData = [];
var con = mysql.createConnection(
{
    host: "database-1.c021kjx8ndry.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "pleasework",
    port: 3306,
    database: "testdb"
});

// Sql query stuff
// const tempQuery = `select * from Students`;
// con.query(tempQuery, (err, results) =>
// {
//     console.table(results);
// })

// Function to get auth token from database using email and password
const checkLoginCredentials = async (email, password) =>
{
  const QUERY = `SELECT * FROM Tutors WHERE Email = "${email}" and Password = "${password}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
  {
    if (err)
    {
      reject(err);
    }
    else
    {
      resolve(results);
      if (results.length > 0)
      {
        return results[0];
      }
      return 0;
    }
  }));
}

// URL director for get
app.get('/:placeholder', (req, res) => 
{
    if (req.originalUrl == "/resetPassword")
    {
        res.status(200).sendFile(path.join(initalPath, "resetPassword.html"));
    }
    else if (req.originalUrl == "/login")
    {
        res.status(200).sendFile(path.join(initalPath, "index.html"));  
    }
    // Not found
    else
    {
        res.json("404 file not found");
    }
})

// URL director for post
app.post('/:placeholder', (req, res) => 
{
    if (req.originalUrl == "/loginFormPost")
    {
        console.log(req.body);
        checkLoginCredentials(req.body["Email"], req.body["Password"]).then(result =>
        {
            // If auth token is empty then send error
            if (result.length == 0)
            {
                res.status(400).end("Email or password was incorrect. Please try again.");
                return;
            }
        
            // Else redirect
            if (result.length == 1)
            {
                tutorData = result[0];
                res.sendFile(path.join(initalPath, "dashboard.html"));
            }
        })
        .catch(errorWithQuery =>
        {
            res.status(404).end("ERROR! Could not connect to database.");
        })
    }
    else if (req.originalUrl == "/addStudentFormPost")
    {
        // Adding student to database
        console.log("\n\n\nadding student to database");
        addStudent(req.body["FirstName"], req.body["LastName"], req.body["Email"], req.body["PhoneNumber"]).then(results => 
        {
            // If row changed then send successful status
            if (results.affectedRows == 1)
            {
                res.status(200).end();
            }
            else
            {
                res.status(404).end("");
            }
        })
    }
    else if (req.originalUrl == "/addClassFormPost")
    {
        // Adding class to database
        console.log("\n\n\nadding class to database");
        addClass(req.body["Name"], req.body["Price"]).then(results =>
        {
            // If row changed then send successful status
            if (results.affectedRows == 1)
            {
                res.status(200).end();
            }
            else
            {
                res.status(404).end("");
            }
        })
    }
    else if (req.originalUrl == "/updateUserInfo")
    {
        // Get user info from database
        console.log(req.body);
        // getUserInfo(req.body["AuthToken"]).then(userInfo =>
        // {
        //     // If authtoken is empty then send error back else send user info
        //     if (userInfo.length == 0)
        //     {
        //         res.status(404).end("");
        //     }
        //     else
        //     {
        //         res.status(200).end(JSON.stringify(userInfo[0]));
        //     }
        // })
    }
    else if (req.originalUrl == "/resetPasswordFormPost")
    {
        // Get user info from database
        console.log("\n\n\nResetting Password");
        // getUserInfo(req.body["AuthToken"]).then(userInfo =>
        // {
        //     // If old password doesn't match or authtoken not correct then send back error
        //     if (userInfo.length == 0)
        //     {
        //         res.status(404).end("");
        //     }
        //     else
        //     {
        //         res.status(200).end();
        //     }
        // })
    }
})

// Start listening on port
app.listen(port, () => 
{
    console.log("\n");
    console.log(`Listening on port: ${port}`);
    console.log(`Network access via: ${ip.address()}:${port}!`);
    http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp)
    {
        resp.on('data', function(externalIp) 
        {
          console.log(`External access if port forwarded: ${externalIp}:${port}`)
        });
    });
})