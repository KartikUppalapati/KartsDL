// Import stuff
const port = 3001;
const fs = require('fs');
require('dotenv').config();
const http = require('http');
const path = require('path');
const mysql = require('mysql');
const https = require('https');
const express = require('express');
const { error } = require('console');
var nodemailer = require('nodemailer');
let initalPath = path.join(__dirname, "public");

// App stuff
const app = express();
app.use(express.json());
app.use(express.static(initalPath));
app.use(express.urlencoded({extended: false}));

// Connect to database
var con = mysql.createPool(
{
  connectionLimit: 15,
  host: "database-1.c021kjx8ndry.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "pleasework",
  port: 3306,
  database: "testdb"
});

// Set up emailer
var emailer = nodemailer.createTransport(
{
    service: "gmail",
    auth: {
        user: "mindmantratutoring@gmail.com",
        pass: process.env.GMAILER_PASSWORD,
    }
});


// Sql query stuff
// const tempQuery = mysql.format("select * from Tutors", []);
// con.query(tempQuery, (err, result) =>
// {
//   console.table(result);
//   console.log(err);
// })

// Check functions
const checkLoginCredentials = async (email, password) =>
{
    // Ex1: admin"-- "
    // Ex2: admin" or "1"="1
    // Prevent sql injection by using prepared statement
    const QUERY = mysql.format("SELECT * FROM Tutors WHERE Email = ? and Password = ?", [email, password]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const checkAdminCredentials = async (tutorData) =>
{
    const QUERY = mysql.format("SELECT * FROM Tutors WHERE Id = ? and Email = ? and AuthToken = ? and Admin = 1", [tutorData["Id"], tutorData["Email"], tutorData["AuthToken"]]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const checkStudentExists = async (firstName, lastName) =>
{
    const QUERY = `SELECT * FROM Students WHERE FirstName = "${firstName}" AND LastName = "${lastName}"`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err)
        } 
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const checkClassExists = async (className, classLevel) =>
{
  const QUERY = `SELECT * FROM Classes WHERE Name = "${className}" and Level = "${classLevel}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err)
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const checkTutorExists = async (email) =>
{
  const QUERY = `SELECT * FROM Tutors where Email = "${email}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err)
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const checkStudentHadClass = async (studentId, startDate, endDate) =>
{
    const QUERY = mysql.format("SELECT * FROM Hours WHERE StudentId = ? and Date >= ? and Date <= ? limit 1", [studentId, startDate, endDate]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

// Update functions
const updateUserProfile = async (newProfileData, tutorData) =>
{
  const QUERY = `UPDATE Tutors SET FirstName = "${newProfileData["FirstName"]}", LastName = "${newProfileData["LastName"]}", PhoneNumber = "${newProfileData["Phone"]}" WHERE AuthToken = "${tutorData["AuthToken"]}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err)
    {
        reject(err);
    } 
    else
    {
        resolve(results);
        return results;
    }
  }));
}

const updateUserPassword = async (tutorData, oldPassword, newPassword) =>
{
  const QUERY = `UPDATE Tutors SET Password = "${newPassword}" WHERE AuthToken = "${tutorData["AuthToken"]}" AND Password = "${oldPassword}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err)
    {
        reject(err);
    } 
    else
    {
        resolve(results);
        return results;
    }
  }));
}

const updateUserPasswordReset = async (email, newPassword) =>
{
    const QUERY = `UPDATE Tutors SET Password = "${newPassword}" WHERE Email = "${email}"`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        } 
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const updateStudent = async (studentData) =>
{
    const QUERY = mysql.format("update Students set FirstName = ?, LastName = ?, Email = ?, Price = ?, Birthday = ?, PhoneNumber = ? where Id = ?", [studentData["FirstName"], studentData["LastName"], studentData["Email"], studentData["Price"], studentData["Birthday"], studentData["PhoneNumber"], studentData["studentId"]]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err);
        } 
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const updateTutor = async (tutorData) =>
{
    const QUERY = mysql.format("update Tutors set FirstName = ?, LastName = ?, Email = ?, Percentage = ?, PhoneNumber = ? where Id = ?", [tutorData["FirstName"], tutorData["LastName"], tutorData["Email"], tutorData["Percentage"], tutorData["PhoneNumber"], tutorData["tutorId"]]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err);
        } 
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

// Add functions
const addStudent = async (studentData) =>
{
  const QUERY = `INSERT INTO Students VALUES("NULL", "${studentData.FirstName}", "${studentData.LastName}", "${studentData.Email}", ${studentData.Price}, "${studentData.Birthday}", "${studentData.PhoneNumber}")`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err);
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const addTutor = async (tutorData, tempPassword, newAuthToken) =>
{
  const QUERY = mysql.format(`INSERT INTO Tutors VALUES("NULL", "?", "?", "?", "?", "?", "?", "?", 0`, [tutorData.FirstName, tutorData.LastName, tutorData.Email, tempPassword, tutorData.Percentage, tutorData.Phone, newAuthToken]);
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err);
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const addClass = async (className, classLevel) =>
{
  const QUERY = `INSERT INTO Classes VALUES("NULL", "${className}", "${classLevel}")`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err)
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const addSession = async (tutorData, hoursData, studentData, classData, moneyGenerated) =>
{
    const QUERY = `INSERT INTO Hours VALUES(${tutorData["Id"]}, ${studentData["Id"]}, ${classData["Id"]}, "${hoursData["startTime"]}", "${hoursData["endTime"]}", "${hoursData["Date"]}", "${hoursData["Notes"]}", ${moneyGenerated})`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        } 
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const updateSession = async (tutorData, hoursData, studentData, classData, moneyGenerated) =>
{
    const QUERY = `UPDATE Hours SET TutorId = ${tutorData["Id"]}, StudentId = ${studentData["Id"]}, ClassId = ${classData["Id"]}, StartTime = "${hoursData["startTime"]}", EndTime = "${hoursData["endTime"]}", Date = "${hoursData["Date"]}", Notes = "${hoursData["Notes"]}", MoneyGenerated = ${moneyGenerated} WHERE TutorId = ${tutorData["Id"]} and StudentId = ${hoursData["prevStudentId"]} and ClassId = ${hoursData["prevClassId"]} and StartTime = "${hoursData["prevStartTime"]}" and EndTime = "${hoursData["prevEndTime"]}" and Date = "${hoursData["prevDate"]}" and Notes = "${hoursData["prevNotes"]}"`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err) 
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const deleteSession = async (tutorData, hoursData, moneyGenerated) =>
{
    const QUERY = `DELETE FROM Hours WHERE TutorId = ${tutorData["Id"]} and StudentId = ${hoursData["StudentId"]} and ClassId = ${hoursData["ClassId"]} and StartTime = "${hoursData["startTime"]}" and EndTime = "${hoursData["endTime"]}" and Date = "${hoursData["Date"]}" and Notes = "${hoursData["Notes"]}" and MoneyGenerated = ${moneyGenerated}`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

// Get functions
const getStudents = async () =>
{
    const QUERY = `SELECT * FROM Students`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        }
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const getStudentsWithInvoice = async (startDate, endDate) =>
{
    const QUERY = mysql.format("select distinct StudentId from Students inner join Hours on Students.Id = Hours.StudentId where Date >= ? and Date <= ?", [startDate, endDate]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        }
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const getStudent = async (studentId) =>
{
    const QUERY = mysql.format("select * from Students where Id = ?", [studentId]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        }
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const getClasses = async () =>
{
    const QUERY = "SELECT * FROM Classes";
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const getClass = async (id) =>
{
  const QUERY = `SELECT * FROM Classes where Id = ${id}`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err)
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const getTutors = async () =>
{
  const QUERY = `SELECT * FROM Tutors`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err)
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const getTutorsWithInvoice = async (startDate, endDate) =>
{
    const QUERY = mysql.format("select distinct TutorId from Tutors inner join Hours on Tutors.Id = Hours.TutorId where Date >= ? and Date <= ?", [startDate, endDate]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
        if (err)
        {
            reject(err);
        }
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const getTutor = async (tutorId) =>
{
  const QUERY = mysql.format("select * from Tutors where Id = ?", [tutorId]);
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
  {
    if (err) 
    {
      reject(err)
    } 
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const getTutorTotals = async (id) =>
{
    const QUERY = mysql.format("SELECT COUNT(*) as TotalStudents, SUM(MoneyGenerated) as TotalMoney, SUM(TIMESTAMPDIFF(MINUTE, StartTime, EndTime)/60) as TotalHours from Hours WHERE TutorId = ?", id);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
    if (err) 
    {
        reject(err)
    } 
    else 
    {
        resolve(results);
        return results;
    }
    }));
}

const getCompanyTotals = async () =>
{
    const QUERY = "SELECT COUNT(*) as TotalStudents, SUM(MoneyGenerated) as TotalMoney, SUM(TIMESTAMPDIFF(MINUTE, StartTime, EndTime)/60) as TotalHours from Hours";
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) => 
    {
    if (err) 
    {
        reject(err)
    } 
    else 
    {
        resolve(results);
        return results;
    }
    }));
}

const getAllSessions = async (tutorData, queryLimit) =>
{
    const QUERY = mysql.format("SELECT Date, StudentId, Students.FirstName, Students.LastName, ClassId, Classes.Name as ClassName, Classes.Level, StartTime, EndTime, MoneyGenerated, Notes FROM Hours INNER JOIN Students ON Students.Id = Hours.StudentId INNER JOIN Classes ON Classes.Id = Hours.ClassId WHERE TutorId = ? order by Date desc LIMIT ?", [tutorData["Id"], queryLimit]);
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
    {
        if (err) 
        {
            reject(err);
        }
        else 
        {
            resolve(results);
            return results;
        }
    }));
}

const getHoursWithinDates = async (tutorData, startDate, endDate) =>
{
  const QUERY = mysql.format("SELECT Date, StudentId, Students.FirstName, Students.LastName, ClassId, Classes.Name as ClassName, Classes.Level, StartTime, EndTime, MoneyGenerated, Notes FROM Hours INNER JOIN Students ON Students.Id = Hours.StudentId INNER JOIN Classes ON Classes.Id = Hours.ClassId WHERE TutorId = ? AND Date >= ? AND Date <= ?", [tutorData["Id"], startDate, endDate]);
  return new Promise((resolve, reject) => con.query(QUERY, (err, result) => 
  {
    if (err) 
    {
      reject(err);
    }
    else 
    {
      resolve(result);
      return result;
    }
  }));
}

const getCompanyFinances = async (filterData) =>
{
  const QUERY = `SELECT SUM(MoneyGenerated), SUM((MoneyGenerated * Tutors.Percentage) / 100) AS TutorsCut FROM Hours INNER JOIN Tutors on Tutors.Id = Hours.TutorId WHERE Date >= "${filterData.StartDateRange}" AND Date <= "${filterData.EndDateRange}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
  {
    if (err) 
    {
      reject(err);
    }
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const getTutorFinances = async (tutorData, filterData) =>
{
  const QUERY = `SELECT SUM(MoneyGenerated) FROM Hours WHERE TutorId = ${tutorData["Id"]} AND Date >= "${filterData.StartDateRange}" AND Date <= "${filterData.EndDateRange}"`;
  return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
  {
    if (err) 
    {
      reject(err);
    }
    else 
    {
      resolve(results);
      return results;
    }
  }));
}

const getStudentInvoice = async (studentId, startDate, endDate) =>
{
    const QUERY = `select Date, Tutors.FirstName as TutorFirstName, Tutors.LastName as TutorLastName, Classes.Name as ClassName, Classes.Level, StartTime, EndTime, MoneyGenerated from Hours inner join Classes on Hours.ClassId = Classes.Id inner join Tutors on Hours.TutorId = Tutors.Id where StudentId = ${studentId} and Date >= "${startDate}" and Date <= "${endDate}"`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

const getTutorInvoice = async (tutorId, startDate, endDate) =>
{
    const QUERY = `select Date, Students.FirstName as StudentFirstName, Students.LastName as StudentLastName, Classes.Name as ClassName, Classes.Level, StartTime, EndTime, MoneyGenerated from Hours inner join Classes on Hours.ClassId = Classes.Id inner join Students on Hours.StudentId = Students.Id where TutorId = ${tutorId} and Date >= "${startDate}" and Date <= "${endDate}"`;
    return new Promise((resolve, reject) => con.query(QUERY, (err, results) =>
    {
        if (err)
        {
            reject(err);
        }
        else
        {
            resolve(results);
            return results;
        }
    }));
}

// Helper functions for date
Date.prototype.GetFirstDayOfWeek = function()
{
    return (new Date(this.setDate(this.getDate() - this.getDay()+ (this.getDay() == 0 ? -6:1))));
}
Date.prototype.GetLastDayOfWeek = function()
{
    if (new Date().getDay() == 0)
    {
        return new Date();
    }
    return (new Date(this.setDate(this.getDate() - this.getDay() +7)));
}

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
        res.json("404 file not found");
    }
})

// URL director for post
app.post('/:placeholder', (req, res) => 
{
    if (req.originalUrl == "/login")
    {
        checkLoginCredentials(req.body["Email"], req.body["Password"]).then(result =>
        {
            // If login fail
            if (result.length == 0)
            {
                res.sendFile(path.join(initalPath, "indexLoginError.html"));
            }
        
            // Else redirect
            if (result.length == 1)
            {
                // Dashboard file name as var
                var dashboardFileToUse = "dashboard.html";

                // Create copy of dashboard html and insert tutor user data
                fs.copyFile(path.join(initalPath, dashboardFileToUse), path.join(initalPath, `dashboard${result[0]["Id"]}.html`), (err) =>
                {
                    if (err) 
                    {
                      console.log("Error with dashboard file copy:", err);
                    }
                    // Successful copy
                    else
                    {
                        // Get file as string
                        var data = fs.readFileSync(path.join(initalPath, `dashboard${result[0]["Id"]}.html`), "utf-8");

                        // Add tutor data to string
                        data = data.replace("var tutorData = [];", `var tutorData = ${JSON.stringify(result[0])};`)

                        // If user admin
                        if (result[0]["Admin"] == 1)
                        {
                            // Add admin button
                            data = data.replace("</li putAdminButtonBelowHere>", 
                            `</li>
                            <li
                                id="adminButton"
                            >
                                <a class="sidenav-item-link" style="cursor: pointer;" onclick="menuNav('adminDashboardArea', 'adminButton', 'adminDashboardFunction');">
                                    <i class="mdi mdi-account-multiple-outline"></i>
                                    <span class="nav-text">Admin Settings</span>
                                </a>
                            </li>`, "utf-8");
                        }

                        // Write changes
                        fs.writeFileSync(path.join(initalPath, `dashboard${result[0]["Id"]}.html`), data, "utf-8");

                        // Send back file and delete
                        res.sendFile(path.join(initalPath, `dashboard${result[0]["Id"]}.html`));
                        res.on('finish', function()
                        {
                            try 
                            {
                              fs.unlinkSync(path.join(initalPath, `dashboard${result[0]["Id"]}.html`));
                            }
                            catch(e) 
                            {
                              console.log("error removing ", path.join(initalPath, `dashboard${result[0]["Id"]}.html`)); 
                            }
                        });
                    }
                });
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.sendFile(path.join(initalPath, "indexLoginError.html"));
        })
    }
    else if (req.originalUrl == "/getStudents")
    {
        getStudents().then(result =>
        {
            res.status(200).end(JSON.stringify(result));
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getStudentsWithInvoice")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getStudentsWithInvoice(req.body["startDate"], req.body["endDate"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getStudent")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getStudent(req.body["studentId"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/checkStudentHadClass")
    {
        checkStudentHadClass(req.body["studentId"], req.body["startDate"], req.body["endDate"]).then(result =>
        {
            res.status(200).end(JSON.stringify(result));
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getClasses")
    {
        getClasses().then(result =>
        {
            res.status(200).end(JSON.stringify(result));
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getTutors")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getTutors().then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getTutor")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getTutor(req.body["tutorId"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getTutorsWithInvoice")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getTutorsWithInvoice(req.body["startDate"], req.body["endDate"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getTutorTotals")
    {
        tutorData = JSON.parse(req.body["Tutor"]);
        getTutorTotals(tutorData["Id"]).then(result =>
        {
            if (result.length > 0)
            {
                res.status(200).end(JSON.stringify(result[0]));
            }
            else
            {
                res.status(400).end("ERROR! Unable to fetch tutor totals!")
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getCompanyTotals")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getCompanyTotals().then(result =>
                {
                    if (result.length > 0)
                    {
                        res.status(200).end(JSON.stringify(result[0]));
                    }
                    else
                    {
                        res.status(400).end("ERROR! Unable to fetch company totals!")
                    }
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getDashboard")
    {
        // Things to send back
        var totalMoneyGenerated = 0;
        var totalStudentsTutored = 0;
        var totalHoursTutored = 0;
        const moneyGenerated = [];
        const studentsTutored = [];
        const hoursTutored = [];
        const dates = [];

        // Get start date
        var today = new Date(req.body["StartDate"]);
        today.setDate(today.GetFirstDayOfWeek().getDate());
        var day = String(today.getDate()).padStart(2, '0');
        var month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var year = today.getFullYear();
        var startDate = `${year}-${month}-${day}`;

        // Loop through time period
        for (let i = 0; i < 7; i++)
        {
            // Get current date
            today.setDate(today.GetFirstDayOfWeek().getDate() + i);
            day = String(today.getDate()).padStart(2, '0');
            month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!

            // Put values into lists
            dates.push(`${month}/${day}`);
            moneyGenerated.push(0);
            studentsTutored.push(0);
            hoursTutored.push(0);
        }

        // Get end date
        day = String(today.getDate()).padStart(2, '0');
        month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        year = today.getFullYear();
        var endDate = `${year}-${month}-${day}`;

        getHoursWithinDates(req.body["Tutor"], startDate, endDate).then(result =>
        {
            // Go through all hours logged for date range
            for (let j = 0; j < result.length; j++)
            {
                var currentMoneyGenerated = 0;
                var currentHoursTutored = 0;
                currentMoneyGenerated = (result[j]["MoneyGenerated"] * req.body["Tutor"].Percentage / 100);
                startTime = new Date(0, 0, 0, result[j]["StartTime"].split(":")[0], result[j]["StartTime"].split(":")[1]);
                endTime = new Date(0, 0, 0, result[j]["EndTime"].split(":")[0], result[j]["EndTime"].split(":")[1]);
                currentHoursTutored = (endTime - startTime) / 3600000;

                // Calculate daily and totals
                totalMoneyGenerated += currentMoneyGenerated;
                totalHoursTutored += currentHoursTutored;
                totalStudentsTutored += 1;

                // Get index to add to
                var currentDate = new Date(result[j]["Date"]);
                day = String(currentDate.getDate()).padStart(2, '0');
                month = String(currentDate.getMonth() + 1).padStart(2, '0');
                var indexToUpdate = dates.indexOf(`${month}/${day}`);

                // Update lists
                moneyGenerated[indexToUpdate] = moneyGenerated[indexToUpdate] + currentMoneyGenerated;
                studentsTutored[indexToUpdate] = studentsTutored[indexToUpdate] + 1;
                hoursTutored[indexToUpdate] = hoursTutored[indexToUpdate] + currentHoursTutored;
            }

            // Send back
            var outputsArray = {};
            outputsArray["moneyGeneratedList"] = moneyGenerated;
            outputsArray["studentsTutoredList"] = studentsTutored;
            outputsArray["hoursTutoredList"] = hoursTutored;
            outputsArray["datesList"] = dates;
            outputsArray["totalMoneyGenerated"] = totalMoneyGenerated;
            outputsArray["totalStudentsTutored"] = totalStudentsTutored;
            outputsArray["totalHoursTutored"] = totalHoursTutored;
            outputsArray["calendarHours"] = result;
            res.status(200).end(JSON.stringify(outputsArray));
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getAllSessions")
    {
        getAllSessions(JSON.parse(req.body["Tutor"]), req.body["QueryLimit"]).then(result =>
        {
            if (result.length > 0)
            {
                res.status(200).end(JSON.stringify(result));
            }
            else
            {
                res.status(400).end("Tutor has no hours");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getAllFinances")
    {
        // If tutor specified
        if (req.body["Tutor"] != "All Tutors")
        {
            tutorData = JSON.parse(req.body["Tutor"]);
            getTutorFinances(tutorData, req.body).then(result =>
            {
                if (result[0]["SUM(MoneyGenerated)"] != null)
                {
                    totalMoneyGenerated = result[0]["SUM(MoneyGenerated)"];
                    tutorCut = tutorData["Percentage"];
                    tutorMoneyMade = totalMoneyGenerated * (tutorCut / 100);
                    companyProfit = totalMoneyGenerated - tutorMoneyMade;
                    res.status(200).end(`${tutorData["FirstName"]} generated a total of $${totalMoneyGenerated}. Their cut was ${tutorCut}% and made $${tutorMoneyMade}. The company profitted $${companyProfit}`);
                }
                else
                {
                    res.status(400).end("No money was made during this time frame");
                }
            })
            .catch(errorWithQuery =>
            {
                console.log(errorWithQuery.message);
                res.status(400).end();
            })
        }

        // Else get all company finances
        getCompanyFinances(req.body).then(result =>
        {
            if (result[0]["SUM(MoneyGenerated)"] != null)
            {
                totalMoneyGenerated = result[0]["SUM(MoneyGenerated)"];
                tutorsCut = result[0]["TutorsCut"];
                companyProfit = totalMoneyGenerated - tutorsCut;
                res.status(200).end(`${req.body["Tutor"]} generated a total of $${totalMoneyGenerated}. The tutors earned $${tutorsCut} and the company profitted $${companyProfit}`);
            }
            else
            {
                res.status(400).end("No money was made during this time frame");
            }
        })
    }
    else if (req.originalUrl == "/getStudentInvoice")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getStudentInvoice(req.body["studentId"], req.body["startDate"], req.body["endDate"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/getTutorInvoice")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                getTutorInvoice(req.body["tutorId"], req.body["startDate"], req.body["endDate"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result));
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/sendInvoice")
    {
        // Set up email
        var mailOptions =
        {
            from: "mindmantratutoring@gmail.com",
            to: "kartik0109@gmail.com",
            subject: `Payment Due: Invoice for ${req.body["Name"]}`,
            html:
            `
                <div>
                    Hello,<br><br>
                    Please see below the invoice for tutoring services provided by MMT on
                    ${req.body["StartDate"].replaceAll("-", "/")}-${req.body["EndDate"].replaceAll("-", "/")}.<br><br>
                </div>

                <br><br>
                ${req.body["Html"]}
                <br><br>

                <div>
                    Thank you for your prompt attention to this matter.<br>
                    Please feel free to reach out if you have any questions.
                </div>
            `
        };

        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                // Send email
                emailer.sendMail(mailOptions, function(error, info)
                {
                    if (error)
                    {
                        console.log('Error:', error);
                        res.status(400).end();
                    }
                    else
                    {
                        res.status(200).end();
                    }
                });
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/updateUserProfile")
    {
        updateUserProfile(req.body, req.body["tutor"]).then(result =>
        {
            if (result.affectedRows == 1)
            {
                getTutor(tutorData["Id"]).then(result =>
                {
                    res.status(200).end(JSON.stringify(result[0]));
                })
            }
            else
            {
                res.status(400).end("ERROR! Profile could not be updated. Try again.")
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/updatePassword")
    {
        // If new password not confirmed send back error
        if (req.body["NewPassword"] != req.body["NewPasswordAgain"])
        {
            res.status(400).end("ERROR! New passwords don't match.")
            return;
        }

        // If new password and old password the same send back error
        if (req.body["NewPassword"] == req.body["OldPassword"])
        {
            res.status(400).end("ERROR! New password is same as old password.")
            return;
        }

        updateUserPassword(JSON.parse(req.body["tutor"]), req.body["OldPassword"], req.body["NewPassword"]).then(result =>
        {
            // If no rows changed then error
            if (result.affectedRows == 0)
            {
                res.status(400).end("Old password incorrect.")
            }
            else
            {
                // Else successfully changed password
                res.status(200).end("Password updated.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/updatePasswordReset")
    {
        // Create random temp password
        var updatedPassword = Math.random().toString(36).slice(2).substring(0, 10)

        // Update password
        updateUserPasswordReset(req.body["Email"], updatedPassword).then(result =>
        {
            // If password updated
            if (result.affectedRows == 1)
            {
                // Set email
                var mailOptions =
                {
                    from: "mindmantratutoring@gmail.com",
                    to: req.body["Email"],
                    subject: "Password Reset",
                    text: "Your password has been reset to " + updatedPassword + ". Please log in and update it."
                };

                // Send email
                emailer.sendMail(mailOptions, function(error, info)
                {
                    if (error)
                    {
                        console.log('Error:', error);
                        res.sendFile(path.join(initalPath, "resetPasswordError.html"));
                    }
                    else
                    {
                        // Update page
                        res.sendFile(path.join(initalPath, "resetPasswordSuccess.html"));
                    }
                });
            }
            else
            {
                res.sendFile(path.join(initalPath, "resetPasswordError.html"));
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.sendFile(path.join(initalPath, "resetPasswordError.html"));
        })
    }
    else if (req.originalUrl == "/updateStudent")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                updateStudent(req.body).then(result =>
                {
                    if (result.affectedRows == 1)
                    {
                        res.status(200).end("Student profile updated.");
                    }
                    else
                    {
                        res.status(400).end("Student profile could not be updated.")
                    }
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/updateTutor")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                updateTutor(req.body).then(result =>
                {
                    if (result.affectedRows == 1)
                    {
                        res.status(200).end("Tutor profile updated.");
                    }
                    else
                    {
                        res.status(400).end("Tutor profile could not be updated.")
                    }
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/addTutor")
    {
        if (Number(req.body["Percentage"]) > 100)
        {
            res.status(400).end("Percentage too big: must be within 0 - 100.");
            return;
        }

        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                checkTutorExists(req.body["Email"]).then(result =>
                {
                    if (result.length > 0)
                    {
                        res.status(400).end("Tutor already exists.");
                    }
                    
                    var tempPassword = Math.random().toString(36).slice(2).substring(0, 10);
                    addTutor(req.body, tempPassword, Math.random().toString(36).slice(2).substring(0, 10)).then(result =>
                    {
                        if (result.affectedRows == 1)
                        {
                            res.status(200).end("Tutor added.");
                        }
                        else
                        {
                            res.status(400).end("Unable to add tutor.");
                        }
                    })
                    .catch(errorWithQuery =>
                    {
                        console.log(errorWithQuery.message);
                        res.status(400).end();
                    })
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/addStudent")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                checkStudentExists(req.body["FirstName"], req.body["LastName"]).then(result =>
                {
                    if (result.length > 0)
                    {
                        res.status(400).end("Student already exists.");
                    }
                
                    addStudent(req.body).then(result =>
                    {
                        if (result.affectedRows == 1)
                        {
                            res.status(200).end("Student added.");
                        }
                        else
                        {
                            res.status(400).end("Unable to add student.");
                        }
                    })
                    .catch(errorWithQuery =>
                    {
                        console.log(errorWithQuery.message);
                        res.status(400).end();
                    })
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/addClass")
    {
        // Check if admin
        checkAdminCredentials(req.body["tutor"]).then(result =>
        {
            if (result.length == 1)
            {
                checkClassExists(req.body["Name"], req.body["Level"]).then(result =>
                {
                    if (result.length > 0)
                    {
                        res.status(400).end("Class already exists.");
                    }
                
                    addClass(req.body["Name"], req.body["Level"]).then(result =>
                    {
                        if (result.affectedRows == 1)
                        {
                            res.status(200).end("Class added.");
                        }
                        else
                        {
                            res.status(400).end("Unable to add class.");
                        }
                    })
                    .catch(errorWithQuery =>
                    {
                        console.log(errorWithQuery.message);
                        res.status(400).end();
                    })
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.status(400).end();
                })
            }
            else
            {
                res.status(400).end("Not Admin.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/addSession")
    {
        // Convert data to usuable types
        tutorData = JSON.parse(req.body["Tutor"]);
        classData = JSON.parse(req.body["Class"]);
        studentData = JSON.parse(req.body["Student"]);
        startTime = new Date(0, 0, 0, req.body["startTime"].split(":")[0], req.body["startTime"].split(":")[1]);
        endTime = new Date(0, 0, 0, req.body["endTime"].split(":")[0], req.body["endTime"].split(":")[1]);

        // Check that end time not before start time
        timeElapsed = endTime - startTime;
        if (timeElapsed <= 0)
        {
            res.status(400).end("End time must be after start time.");
            return;
        }

        // Calculate money generated and add hours
        moneyGenerated = studentData["Price"] * (timeElapsed / 3600000);
        addSession(tutorData, req.body, studentData, classData, moneyGenerated).then(result =>
        {
            if (result.affectedRows == 1)
            {
                res.status(200).end("Session added.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/updateSession")
    {
        // Convert data to usuable types
        tutorData = JSON.parse(req.body["Tutor"]);
        classData = JSON.parse(req.body["Class"]);
        studentData = JSON.parse(req.body["Student"]);
        startTime = new Date(0, 0, 0, req.body["startTime"].split(":")[0], req.body["startTime"].split(":")[1]);
        endTime = new Date(0, 0, 0, req.body["endTime"].split(":")[0], req.body["endTime"].split(":")[1]);
        prevStartTime = new Date(0, 0, 0, req.body["prevStartTime"].split(":")[0], req.body["prevStartTime"].split(":")[1]);
        prevEndTime = new Date(0, 0, 0, req.body["prevEndTime"].split(":")[0], req.body["prevEndTime"].split(":")[1]);

        // Check that current end time not before start time
        timeElapsed = endTime - startTime;
        if (timeElapsed <= 0)
        {
            res.status(400).end("End time must be after start time.");
            return;
        }

        // Calculate money generated and add hours
        moneyGenerated = studentData["Price"] * (timeElapsed / 3600000);
        updateSession(tutorData, req.body, studentData, classData, moneyGenerated).then(result =>
        {
            if (result.affectedRows == 1)
            {
                res.status(200).end("Session updated.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
    else if (req.originalUrl == "/deleteSession")
    {
        // Get and convert data to usuable types
        tutorData = JSON.parse(req.body["Tutor"]);
        startTime = new Date(0, 0, 0, req.body["startTime"].split(":")[0], req.body["startTime"].split(":")[1]);
        endTime = new Date(0, 0, 0, req.body["endTime"].split(":")[0], req.body["endTime"].split(":")[1]);
        timeElapsed = endTime - startTime;

        // Delete Hours
        moneyGenerated = req.body["StudentPrice"] * (timeElapsed / 3600000);
        deleteSession(tutorData, req.body, moneyGenerated).then(result =>
        {
            if (result.affectedRows == 1)
            {
                res.status(200).end("Session deleted.");
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        })
    }
})

// Start listening on port
// app.listen(port, () => 
// {
//     console.log("\n");
//     console.log(`Listening on port: ${port}`);
//     console.log(`Network access via: ${ip.address()}:${port}!`);
//     https.get({'host': 'api.ipify.org', 'port': 443, 'path': '/'}, function(resp)
//     {
//         resp.on('data', function(externalIp) 
//         {
//           console.log(`External access if port forwarded: ${externalIp}:${port}`)
//         });
//     });
// })


// const certs =
// {
//     key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
//     cert: fs.readFileSync(__dirname + '/public.cert', 'utf8')
// };

// https.createServer(certs, app).listen(443);
http.createServer(app).listen(80);

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