// Import stuff
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql');
const { error } = require('console');

let initalPath = path.join(__dirname, "public");

// Configure the app to use bodyParser()
const app = express();
app.use(express.json());
app.use(express.static(initalPath));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Connect to database
var con = mysql.createConnection(
{
    host: "database-1.c021kjx8ndry.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "pleasework",
    port: 3306,
    database: "testdb"
});
con.connect(function(err) 
{
    if (err) throw err;
    console.log("Database Connected!");
});


// Function to get auth token from database using username and password
const getLoginToken = async (username, password) =>
{
    const QUERY = `SELECT LoginToken FROM Tutors WHERE Email = '${username}' and Password = '${password}'`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err)
        } 
        else 
        {
            console.log("Getting login token");
            console.table(results);
            resolve(results);
            if (results.length > 0)
            {
                return results[0]["LoginToken"];
            }
            return 0;
        }
    }))
    .then(function(result) 
    {
        return result
    })
}

// Function to check if tokens exists
const checkToken = async (inputToken) =>
{
    const QUERY = `SELECT * FROM Tutors WHERE LoginToken = '${inputToken}' OR AuthToken = '${inputToken}'`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err)
        } 
        else 
        {
            console.log("Checking token");
            console.table(results);
            resolve(results);
            return results;
        }
    }))
    .then(function(result) 
    {
        return result
    })
}

// Function to check if login token exists
const checkLoginToken = async (inputToken) =>
{
    const QUERY = `SELECT * FROM Tutors WHERE LoginToken = '${inputToken}'`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err)
        } 
        else 
        {
            console.log("Checking login token");
            console.table(results);
            resolve(results);
            return results;
        }
    }))
    .then(function(result) 
    {
        return result
    })
}

// Function to update auth token after login
const updateAuthToken = async (inputToken) =>
{
    // Randomly generate new token
    var randomToken = Math.floor(Math.random() * 1000000);

    // Check that new token doesn't already exist
    checkToken(randomToken).then(dbresult =>
    {
        // If rolling code doesn't match then continue
        if (dbresult.length != 1)
        {
            const QUERY = `UPDATE Tutors SET LoginToken = '${randomToken}', AuthToken = '${inputToken}' WHERE LoginToken = '${inputToken}'`;
            return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
            {
                if (err) 
                {
                    reject(err)
                } 
                else 
                {
                    console.log("Updating auth token");
                    console.table(results);
                    resolve(results);
                    return results;
                }
            }))
            .then(function(result) 
            {
                return result
            })
        }
    })
}

// URL director for get
app.get('/:placeholder', (req, res) => 
{
    // If user requests to reset password
    if (req.originalUrl == "/resetPassword")
    {
        console.log("redirecting to password reset");
        res.sendFile(path.join(initalPath, "resetPassword.html"));
    }
    // Else if dashboard request
    else if (req.originalUrl.split("?ref=")[0] == "/dashboard")
    {
        // Use database function to check if token matches
        var tok = req.originalUrl.split("?ref=")[1];
        checkLoginToken(tok).then(dbresult => 
        {
            // If rolling code doesn't match then redirect back to login
            if (dbresult.length != 1)
            {
                res.sendFile(path.join(initalPath, "index.html"));
            }
            // Else rolling code matches then redirect to dashboard
            else
            {
                // Update token in databse
                updateAuthToken(tok).then(dbresult =>
                {
                    console.log("redirecting to dashboard");
                    res.sendFile(path.join(initalPath, "dashboard.html"));  
                })
            }
        })
    }
    // Else user requested invalid page
    else
    {
        res.json("404 file not found");
    }
})

// URL director for post
app.post('/:placeholder', (req, res) => 
{
    // If user tries to login
    if (req.originalUrl == "/formPost")
    {
        // Get auth token from database
        console.log("\n\n\nreceived login attempt");
        getLoginToken(req.body["Email"], req.body["Password"]).then(authToken => 
        {
            // Check if anything is returned and accordingly send return response
            if (authToken.length == 0)
            {
                res.status(404).end("");
            }
            else
            {
                res.status(200).end((authToken[0]["LoginToken"]).toString());
            }
        })
    }
})

app.listen(3000, () => 
{
    console.log('\n');
    console.log('listening on port 3000.....');
})