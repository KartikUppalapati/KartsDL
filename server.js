// Import stuff
const fs = require('fs');
require('dotenv').config();
const http = require('http');
const path = require('path');
const https = require('https');
const express = require('express');
const { error } = require('console');
let initalPath = path.join(__dirname, "public");

// Check that env vars available
if (process.env.ENV_VARS_LENGTH != 3)
{
    throw new Error("Missing Environment Variable");
}

// App stuff
const app = express();
app.use(express.json());
app.use(express.static(initalPath));
app.use(express.urlencoded({extended: false}));


// URL director for get
app.get('/:placeholder', (req, res) =>
{
    if (req.originalUrl == "/resetPassword")
    {
        res.status(200).sendFile(path.join(initalPath, "resetPassword.html"));
    }
    // Not found
    else
    {
        res.status(400).sendFile(path.join(initalPath, "error404.html"));
    }
})

// URL director for post
app.post('/:placeholder', (req, res) =>
{
    
})

// Start server
if (process.env.DEVELOPMENT_ENVIRONMENT == "yes")
{
    // Start http server
    http.createServer(app).listen(80);
}
else
{
    // Get keys
    const certs =
    {
        key: fs.readFileSync(path.join(initalPath, "/sslStuff/private.key")),
        cert: fs.readFileSync(path.join(initalPath, "/sslStuff/certificate.crt"))
    };

    // Start https server
    https.createServer(certs, app).listen(443);
}

console.log("\n");
console.log("Server started!");

// Get external ip
https.get({'host': 'api.ipify.org', 'port': 443, 'path': '/'}, function(resp)
{
    resp.on('data', function(externalIp) 
    {
        console.log(`External access if port forwarded: ${externalIp}`)
    });
});