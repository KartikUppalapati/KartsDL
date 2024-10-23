// Import stuff
const fs = require('fs');
require('dotenv').config();
const http = require('http');
const path = require('path');
const mysql = require('mysql');
const https = require('https');
const crypto = require('crypto');
const cron = require('node-cron');
const express = require('express');
const { error } = require('console');
var nodemailer = require('nodemailer');
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

// Schedule weekly things
// cron.schedule('0 5 * * Monday', () =>
// {
//     // Get last monday
//     var today = new Date();
//     today.setDate(today.getDate() - 7);
//     var day = String(today.getDate()).padStart(2, '0');
//     var month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
//     var year = today.getFullYear();
//     var startDate = `${year}-${month}-${day}`;

//     // Get sunday
//     today.setDate(today.getDate() + 6);
//     var day = String(today.getDate()).padStart(2, '0');
//     var month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
//     var year = today.getFullYear();
//     var endDate = `${year}-${month}-${day}`;

//     // Call functions
//     sendStudentsInvoice(startDate, endDate);
//     sendTutorsInvoice(startDate, endDate);
// });

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
    auth:
    {
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
    const QUERY = mysql.format("SELECT Id, FirstName, LastName, Email, PhoneNumber, AuthToken, Admin FROM Tutors WHERE Email = ? and Password = ?", [email, password]);
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

const addTutor = async (tutorData, tempPassword, newAuthToken, newSaltToken) =>
{
  const QUERY = mysql.format(`INSERT INTO Tutors VALUES("NULL", "?", "?", "?", "?", "?", "?", "?", "?", 0`, [tutorData.FirstName, tutorData.LastName, tutorData.Email, tempPassword, tutorData.Percentage, tutorData.Phone, newAuthToken, newSaltToken]);
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
    const QUERY = mysql.format("select distinct StudentId, FirstName, LastName, Email from Students inner join Hours on Students.Id = Hours.StudentId where Date >= ? and Date <= ?", [startDate, endDate]);
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
    const QUERY = mysql.format("select distinct TutorId, FirstName, LastName, Email from Tutors inner join Hours on Tutors.Id = Hours.TutorId where Date >= ? and Date <= ?", [startDate, endDate]);
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

// Weekly functions
function sendStudentsInvoice(startDate, endDate)
{
    // Get list of students with invoice
    getStudentsWithInvoice(startDate, endDate).then(students =>
    {
        // Iterate through student list
        for (var i = 0; i < students.length; i++)
        {
            // Get tutor info
            var studentInfo = students[i];
            
            // Get invoice for id
            getStudentInvoice(studentInfo["StudentId"], startDate, endDate, studentInfo).then(invoice =>
            {
                // If invoice not empty
                if (invoice.length > 0)
                {
                    // Initialize things
                    var total = 0;
                    var invoiceHtml = "";
                    var htmlData = fs.readFileSync(path.join(initalPath, "email.html"), "utf-8");

                    // Iterate through invoice list
                    for (var k = 0; k < invoice.length; k++)
                    {
                        // Update invoice html
                        invoiceHtml +=
                        `<tr>
                            <td align="left" valign="top" style="padding: 8px 0px 16px 16px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                <td>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td valign="top">
                                    <table class="" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                    <th valign="top" style="font-weight: normal; text-align: left;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                        <tr>
                                        <td>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tr>
                                            <td valign="top">
                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tr>
                                                <th align="left" valign="top" style="font-weight: normal; text-align: left; padding: 0px 0px 4px 0px;">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                <tr>
                                                <td valign="top" align="left" style="padding: 9px 0px 0px 0px;">
                                                    <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-26" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; font-variant-ligatures: normal; color: #001942; text-align: left; text-align-last: left;">
                                                    <div>
                                                        <span>${invoice[k]["TutorFirstName"]} ${invoice[k]["TutorLastName"]} ${invoice[k]["ClassName"]} ${invoice[k]["Level"]}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                </table>
                                                </th>
                                            </tr>
                                            <tr>
                                                <th align="left" valign="top" style="font-weight: normal; text-align: left;">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                <tr>
                                                <td valign="top" align="left">
                                                    <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #53627a; text-align: left; text-align-last: left;">
                                                    <div>
                                                        <span>${invoice[k]["StartTime"].substring(0, 5)} - ${invoice[k]["EndTime"].substring(0, 5)}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                </table>
                                                </th>
                                            </tr>
                                            <tr>
                                                <th align="left" valign="top" style="font-weight: normal; text-align: left;">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                <tr>
                                                <td valign="top" align="left">
                                                    <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #53627a; text-align: left; text-align-last: left;">
                                                    <div>
                                                        <span>${invoice[k]["Date"].toISOString().split('T')[0]}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                </table>
                                                </th>
                                            </tr>
                                            </table>
                                            </td>
                                            </tr>
                                        </table>
                                        </td>
                                        </tr>
                                        </table>
                                    </th>
                                    </tr>
                                    </table>
                                    </td>
                                </tr>
                                </table>
                                </td>
                                </tr>
                            </table>
                            </td>
                            <td align="right" valign="top" style="padding: 16px 16px 24px 16px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                <tr>
                                <td valign="top" align="right">
                                <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-20" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: normal; font-variant-ligatures: normal; color: #001942; text-align: right; text-align-last: right;">
                                <div>
                                    <span style="color: #001942;">$${Number(invoice[k]["MoneyGenerated"]).toFixed(2)}</span>
                                </div>
                                </div>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>`;

                        // Update total
                        total += invoice[k]["MoneyGenerated"];
                    }

                    // Update total
                    htmlData = htmlData.replace("Invoice Below", `Invoice ${startDate.replaceAll("-", "/")} - ${endDate.replaceAll("-", "/")}`);
                    htmlData = htmlData.replace("<!-- invoiceGoesHere -->", invoiceHtml);
                    htmlData = htmlData.replace("$0", `$${Number(total).toFixed(2)}`);

                    // Set up email
                    var mailOptions =
                    {
                        from: "mindmantratutoring@gmail.com",
                        to: studentInfo["Email"],
                        subject: `Invoice for ${tutorInfo["FirstName"]} ${tutorInfo["LastName"]}: $${Number(total).toFixed(2)}`,
                        html: htmlData
                    };

                    // Send email
                    emailer.sendMail(mailOptions, function(error, info)
                    {
                        if (error)
                        {
                            console.log(error);
                        }
                    });
                }
            })
            .catch(errorWithQuery =>
            {
                console.log(errorWithQuery.message);
            })
        }
    })
    .catch(errorWithQuery =>
    {
        console.log(errorWithQuery.message);
    })
}

function sendTutorsInvoice(startDate, endDate)
{
    // Get list of tutors with invoice
    getTutorsWithInvoice(startDate, endDate).then(tutors =>
    {
        // Iterate through tutor list
        for (var i = 0; i < tutors.length; i++)
        {
            // Get tutor info
            var tutorInfo = tutors[i];

            // Get invoice for id
            getTutorInvoice(tutorInfo["TutorId"], startDate, endDate, tutorInfo).then(invoice =>
            {
                // If invoice not empty
                if (invoice.length > 0)
                {
                    // Initialize things
                    var total = 0;
                    var invoiceHtml = "";
                    var htmlData = fs.readFileSync(path.join(initalPath, "email.html"), "utf-8");

                    // Iterate through invoice list
                    for (var k = 0; k < invoice.length; k++)
                    {
                        // Update invoice html
                        invoiceHtml +=
                        `<tr>
                            <td align="left" valign="top" style="padding: 8px 0px 16px 16px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                <td>
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td valign="top">
                                    <table class="" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                    <th valign="top" style="font-weight: normal; text-align: left;">
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                        <tr>
                                        <td>
                                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tr>
                                            <td valign="top">
                                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                            <tr>
                                                <th align="left" valign="top" style="font-weight: normal; text-align: left; padding: 0px 0px 4px 0px;">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                <tr>
                                                <td valign="top" align="left" style="padding: 9px 0px 0px 0px;">
                                                    <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-26" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 600; font-variant-ligatures: normal; color: #001942; text-align: left; text-align-last: left;">
                                                    <div>
                                                        <span>${invoice[k]["StudentFirstName"]} ${invoice[k]["StudentLastName"]} ${invoice[k]["ClassName"]} ${invoice[k]["Level"]}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                </table>
                                                </th>
                                            </tr>
                                            <tr>
                                                <th align="left" valign="top" style="font-weight: normal; text-align: left;">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                <tr>
                                                <td valign="top" align="left">
                                                    <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #53627a; text-align: left; text-align-last: left;">
                                                    <div>
                                                        <span>${invoice[k]["StartTime"].substring(0, 5)} - ${invoice[k]["EndTime"].substring(0, 5)}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                </table>
                                                </th>
                                            </tr>
                                            <tr>
                                                <th align="left" valign="top" style="font-weight: normal; text-align: left;">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                                <tr>
                                                <td valign="top" align="left">
                                                    <div class="pc-font-alt" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #53627a; text-align: left; text-align-last: left;">
                                                    <div>
                                                        <span>${invoice[k]["Date"].toISOString().split('T')[0]}</span>
                                                    </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                </table>
                                                </th>
                                            </tr>
                                            </table>
                                            </td>
                                            </tr>
                                        </table>
                                        </td>
                                        </tr>
                                        </table>
                                    </th>
                                    </tr>
                                    </table>
                                    </td>
                                </tr>
                                </table>
                                </td>
                                </tr>
                            </table>
                            </td>
                            <td align="right" valign="top" style="padding: 16px 16px 24px 16px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                                <tr>
                                <td valign="top" align="right">
                                <div class="pc-font-alt pc-w620-fontSize-16 pc-w620-lineHeight-20" style="line-height: 140%; letter-spacing: -0.03em; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: normal; font-variant-ligatures: normal; color: #001942; text-align: right; text-align-last: right;">
                                <div>
                                    <span style="color: #001942;">$${Number(invoice[k]["MoneyGenerated"]).toFixed(2)}</span>
                                </div>
                                </div>
                                </td>
                                </tr>
                            </table>
                            </td>
                        </tr>`;

                        // Update total
                        total += invoice[k]["MoneyGenerated"];
                    }

                    // Update total
                    htmlData = htmlData.replace("Invoice Below", `Invoice ${startDate.replaceAll("-", "/")} - ${endDate.replaceAll("-", "/")}`);
                    htmlData = htmlData.replace("<!-- invoiceGoesHere -->", invoiceHtml);
                    htmlData = htmlData.replace("$0", `$${Number(total).toFixed(2)}`);

                    // Set up email
                    var mailOptions =
                    {
                        from: "mindmantratutoring@gmail.com",
                        to: tutorInfo["Email"],
                        subject: `Invoice for ${tutorInfo["FirstName"]} ${tutorInfo["LastName"]}: $${Number(total).toFixed(2)}`,
                        html: htmlData
                    };

                    // Send email
                    emailer.sendMail(mailOptions, function(error, info)
                    {
                        if (error)
                        {
                            console.log(error);
                        }
                    });
                }
            })
            .catch(errorWithQuery =>
            {
                console.log(errorWithQuery.message);
            })
        }
    })
    .catch(errorWithQuery =>
    {
        console.log(errorWithQuery.message);
    })
}

function sendVenmo()
{

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
        res.status(400).sendFile(path.join(initalPath, "error404.html"));
    }
})

// URL director for post
app.post('/:placeholder', (req, res) =>
{
    if (req.originalUrl == "/login")
    {        
        // Get salt from database
        checkTutorExists(req.body["Email"]).then(tutor =>
        {
            // If not found
            if (tutor.length != 1)
            {
                res.status(400).sendFile(path.join(initalPath, "indexLoginError.html"));
            }
            else
            {
                // Salt password
                var saltedPassword = req.body["Password"] + tutor[0]["Salt"];

                // Get hash
                var hashedPassword = crypto.createHash('sha256').update(saltedPassword).digest("hex");

                checkLoginCredentials(req.body["Email"], hashedPassword).then(result =>
                {
                    // If login fail
                    if (result.length == 0)
                    {
                        res.status(400).sendFile(path.join(initalPath, "indexLoginError.html"));
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
                                res.status(200).sendFile(path.join(initalPath, `dashboard${result[0]["Id"]}.html`));
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
                    res.status(400).sendFile(path.join(initalPath, "indexLoginError.html"));
                });
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.sendFile(path.join(initalPath, "indexLoginError.html"));
        });
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
            res.status(400).end("Passwords don't match.")
            return;
        }

        // If new password and old password the same send back error
        if (req.body["NewPassword"] == req.body["OldPassword"])
        {
            res.status(400).end("Previous password used.")
            return;
        }

        // Get salt from database
        checkTutorExists(req.body["tutor"]["Email"]).then(tutor =>
        {
            // If not found
            if (tutor.length != 1)
            {
                res.status(400).end("Can't find user.")
            }
            else
            {
                // Get old password as hash
                var oldPassword = crypto.createHash('sha256').update(req.body["OldPassword"] + tutor[0]["Salt"]).digest("hex");

                // Get new password as hash
                var newPassword = crypto.createHash('sha256').update(req.body["NewPassword"] + tutor[0]["Salt"]).digest("hex");

                updateUserPassword(req.body["tutor"], oldPassword, newPassword).then(result =>
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
                });
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.status(400).end();
        });
    }
    else if (req.originalUrl == "/updatePasswordReset")
    {
        // Get salt from database
        checkTutorExists(req.body["Email"]).then(tutor =>
        {
            // If not found
            if (tutor.length != 1)
            {
                res.status(400).sendFile(path.join(initalPath, "resetPasswordError.html"));
            }
            else
            {
                // Create random temp password
                var updatedPassword = Math.random().toString(36).slice(2).substring(0, 10);

                // Salt password
                var saltedPassword = updatedPassword + tutor[0]["Salt"];

                // Get hash
                var hashedPassword = crypto.createHash('sha256').update(saltedPassword).digest("hex");

                // Update password
                updateUserPasswordReset(req.body["Email"], hashedPassword, updatedPassword).then(result =>
                {
                    // If password updated
                    if (result.affectedRows == 1)
                    {
                        // Read in email html
                        var htmlData = fs.readFileSync(path.join(initalPath, "emailResetPassword.html"), "utf-8");
        
                        // Add tutor data to string
                        htmlData = htmlData.replace("P@ssword123", updatedPassword);
        
                        // Set email
                        var mailOptions =
                        {
                            from: "mindmantratutoring@gmail.com",
                            to: req.body["Email"],
                            subject: "Password Reset",
                            html: htmlData
                        };
        
                        // Send email
                        emailer.sendMail(mailOptions, function(error, info)
                        {
                            if (error)
                            {
                                console.log(error);
                                res.status(400).sendFile(path.join(initalPath, "resetPasswordError.html"));
                            }
                            else
                            {
                                // Update page
                                res.status(200).sendFile(path.join(initalPath, "resetPasswordSuccess.html"));
                            }
                        });
                    }
                    else
                    {
                        res.status(400).sendFile(path.join(initalPath, "resetPasswordError.html"));
                    }
                })
                .catch(errorWithQuery =>
                {
                    console.log(errorWithQuery.message);
                    res.sendFile(path.join(initalPath, "resetPasswordError.html"));
                })
            }
        })
        .catch(errorWithQuery =>
        {
            console.log(errorWithQuery.message);
            res.sendFile(path.join(initalPath, "resetPasswordError.html"));
        });
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
                    // If not empty
                    if (result.length != 0)
                    {
                        res.status(400).end("Tutor already exists.");
                    }
                    
                    // Generate random strings
                    var newAuthToken = Math.random().toString(36).slice(2).substring(0, 10);
                    var tempPassword = Math.random().toString(36).slice(2).substring(0, 10);
                    var newSaltToken = crypto.randomBytes(16).toString("hex").substring(0, 22);

                    addTutor(req.body, tempPassword, newAuthToken, newSaltToken).then(result =>
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