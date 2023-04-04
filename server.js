// Import stuff
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

let initalPath = path.join(__dirname, "public");

const app = express();
app.use(express.json());
app.use(express.static(initalPath));

// Configure the app to use bodyParser()
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// URL director for get
app.get('/:placeholder', (req, res) => {
    // If user requests to reset password
    if (req.originalUrl == "/resetPassword")
    {
        console.log("redirecting to password reset");
        res.sendFile(path.join(initalPath, "resetPassword.html"));
    }
    // Else if redirect to dashboard
    else if (req.originalUrl.split("=?")[0] == "/dashboard")
    {
        // If rolling code doesn't match then redirect back to login
        if (req.originalUrl.split("=?")[1] != "12345")
        {
            res.sendFile(path.join(initalPath, "index.html"));
        }
        // Else rolling code matches then redirect to dashboard
        else
        {
            console.log("redirecting to dashboard");
            res.sendFile(path.join(initalPath, "dashboard.html"));
        }
    }
    else
    {
        res.json("404 file not found");
    }
})

// URL director for post
app.post('/:placeholder', (req, res) => {
    // If user tries to login
    if (req.originalUrl == "/formPost")
    {
        console.log("received login attempt");
        console.log(req.body);
        res.status(200).end("12347");
        console.log("Login Successful!");
    }
})

app.listen(3000, () => {
    console.log('\n');
    console.log('listening on port 3000.....');
})