// Import stuff
const port = 3000;
const fs = require('fs');
const ip = require('ip');
const http = require('http');
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
var con = mysql.createConnection(
{
    host: "database-1.c021kjx8ndry.us-east-2.rds.amazonaws.com",
    user: "admin",
    password: "pleasework",
    port: 3306,
    database: "testdb"
});

// Sql query stuff
// const tempQuery = `select * from Hours`;
// con.query(tempQuery, (err, results) =>
// {
//     console.table(results);
// })

// Check functions
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

// Update functions
const updateUserProfile = async (newProfileData, tutorData) =>
{
  const QUERY = `UPDATE Tutors SET FirstName = "${newProfileData["FirstName"]}", LastName = "${newProfileData["LastName"]}", PhoneNumber = "${newProfileData["Phone"]}" WHERE AuthToken = ${tutorData["AuthToken"]}`;
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
  const QUERY = `UPDATE Tutors SET Password = "${newPassword}" WHERE AuthToken = ${tutorData["AuthToken"]} AND Password = "${oldPassword}"`;
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
  const QUERY = `INSERT INTO Tutors VALUES("NULL", "${tutorData.FirstName}", "${tutorData.LastName}", "${tutorData.Email}", "${tempPassword}", ${tutorData.Percentage}, ${newAuthToken}, "${tutorData.Phone}")`;
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

const addHours = async (tutorData, hoursData, studentData, classData, moneyGenerated) =>
{
  const QUERY = `INSERT INTO Hours VALUES(${tutorData["Id"]}, ${studentData["Id"]}, ${classData["Id"]}, "${hoursData["startTime"]}", "${hoursData["endTime"]}", "${hoursData["Date"]}", "${hoursData["Notes"]}", ${moneyGenerated})`;
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

// Get functions
const getStudents = async () =>
{
  const QUERY = `SELECT * FROM Students`;
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

const getStudent = async (id) =>
{
  const QUERY = `SELECT * FROM Students where Id = ${id}`;
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

const getClasses = async () =>
{
  const QUERY = `SELECT * FROM Classes`;
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

const getTutor = async (id) =>
{
  const QUERY = `SELECT * FROM Tutors where Id = ${id}`;
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

const getHours = async (tutorData, date) =>
{
  const QUERY = `SELECT * FROM Hours WHERE TutorId = ${tutorData["Id"]} AND Date = "${date}"`;
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

const getCompanyFinances = async (filterData) =>
{
  const QUERY = `SELECT SUM(MoneyGenerated), SUM((MoneyGenerated * Tutors.Percentage) / 100) AS TutorsCut FROM Hours INNER JOIN Tutors on Tutors.Id = Hours.TutorId WHERE Date >= "${filterData.StartDateRange}" AND Date <= "${filterData.EndDateRange}"`;
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

const getTutorFinances = async (tutorData, filterData) =>
{
  const QUERY = `SELECT SUM(MoneyGenerated) FROM Hours WHERE TutorId = ${tutorData["Id"]} AND Date >= "${filterData.StartDateRange}" AND Date <= "${filterData.EndDateRange}"`;
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

const getNotes = async (studentData, tutorData) =>
{
  const QUERY = `select * from Hours where StudentId = ${studentData["Id"]} and TutorId = ${tutorData["Id"]} order by Date desc limit 1`;
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

const getCost = async (studentData, startDate, endDate) =>
{
  const QUERY = `select SUM(MoneyGenerated) from Hours where StudentId = ${studentData["Id"]} and Date >= "${startDate}" and Date <= "${endDate}"`;
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

// Functions for date
Date.prototype.GetFirstDayOfWeek = function()
{
    return (new Date(this.setDate(this.getDate() - this.getDay()+ (this.getDay() == 0 ? -6:1) )));
}
Date.prototype.GetLastDayOfWeek = function()
{
    if (new Date().getDay() == 0)
    {
        return new Date();
    }
    return (new Date(this.setDate(this.getDate() - this.getDay() +7)));
}

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
                return;
            }
        
            // Else redirect
            if (result.length == 1)
            {
                var dashboardFileToUse = "dashboard.html";
                // If user not admin cut out
                if (result[0]["Id"] <= 2)
                {
                    dashboardFileToUse = "dashboardWithAdmin.html"
                }

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
                        // Add tutor data
                        var data = fs.readFileSync(path.join(initalPath, `dashboard${result[0]["Id"]}.html`), "utf-8");
                        fs.writeFileSync(path.join(initalPath, `dashboard${result[0]["Id"]}.html`),
                        data.replace("var tutorData = [];", `var tutorData = ${JSON.stringify(result[0])};`), "utf-8");

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
            res.status(400).end("ERROR! Could not connect to database.");
        })
    }
    else if (req.originalUrl == "/getStudents")
    {
        getStudents().then(result =>
        {
            if (result.length > 0)
            {
                res.status(200).end(JSON.stringify(result));
            }
        })
    }
    else if (req.originalUrl == "/getClasses")
    {
        getClasses().then(result =>
        {
            if (result.length > 0)
            {
                res.status(200).end(JSON.stringify(result));
            }
        })
    }
    else if (req.originalUrl == "/getTutors")
    {
        getTutors().then(result =>
        {
            if (result.length > 0)
            {
                res.status(200).end(JSON.stringify(result));
            }
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

        // Based req time period adjust
        var maxDaysBack = 7;
        if (req.body["TimePeriod"] == "month")
        {
            maxDaysBack = 31;
        }

        // For each day back from current date get money students and date and add to list
        for (let i = 0; i < maxDaysBack; i++)
        {
            // Get date - i
            var today = new Date();
            today.setDate(today.GetLastDayOfWeek().getDate() - i);
            var day = String(today.getDate()).padStart(2, '0');
            var month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var year = today.getFullYear();
            var currentDate = `${year}-${month}-${day}`;
            dates.push(`${month}/${day}`);

            getHours(req.body["Tutor"], currentDate).then(result =>
            {
                // If result not empty go through all hours logged for day and sum up money generated
                var dailyMoneyGenerated = 0;
                var dailyHoursTutored = 0;
                if (result.length > 0)
                {
                    for (let i = 0; i < result.length; i++)
                    {
                        dailyMoneyGenerated += (result[i]["MoneyGenerated"] * req.body["Tutor"].Percentage / 100);
                        startTime = new Date(0, 0, 0, result[i]["StartTime"].split(":")[0], result[i]["StartTime"].split(":")[1]);
                        endTime = new Date(0, 0, 0, result[i]["EndTime"].split(":")[0], result[i]["EndTime"].split(":")[1]);
                        dailyHoursTutored += (endTime - startTime) / 3600000;
                    }
                }
        
                // Calculate daily and totals and add to lists
                totalMoneyGenerated += dailyMoneyGenerated;
                totalStudentsTutored += result.length;
                totalHoursTutored += dailyHoursTutored;
                moneyGenerated.push(dailyMoneyGenerated);
                studentsTutored.push(result.length);
                hoursTutored.push(dailyHoursTutored);
        
                // On last day send back
                if (i == maxDaysBack - 1)
                {
                    var outputsArray = {};
                    outputsArray["moneyGeneratedList"] = moneyGenerated.reverse();
                    outputsArray["studentsTutoredList"] = studentsTutored.reverse();
                    outputsArray["hoursTutoredList"] = hoursTutored.reverse();
                    outputsArray["datesList"] = dates.reverse();
                    outputsArray["totalMoneyGenerated"] = totalMoneyGenerated;
                    outputsArray["totalStudentsTutored"] = totalStudentsTutored;
                    outputsArray["totalHoursTutored"] = totalHoursTutored;
                    res.status(200).end(JSON.stringify(outputsArray));
                }
            })
        }
    }
    else if (req.originalUrl == "/getNotes")
    {
        getNotes(JSON.parse(req.body["Student"]), JSON.parse(req.body["Tutor"])).then(result =>
        {
            if (result.length > 0)
            {
                const classDate = new Date(result[0]["Date"]);
                res.status(200).end(classDate.toDateString() + " - \n" + result[0]["Notes"]);
            }
            else
            {
                res.status(400).end("Student has no previous class notes.");
            }
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
            return;
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
    else if (req.originalUrl == "/getCost")
    {
        studentData = JSON.parse(req.body["Student"]);
        getCost(studentData, req.body["StartDate"], req.body["EndDate"]).then(result =>
        {
            var moneyGenerated = result[0]["SUM(MoneyGenerated)"];
            if (moneyGenerated != null)
            {
                res.status(200).end(`The cost of tutoring ${studentData["FirstName"]} ${studentData["LastName"]} was $${moneyGenerated}`);
            }
            else
            {
                res.status(400).end("Student has no recorded classes during this time frame.");
            }
        })
    }
    else if (req.originalUrl == "/updateUserInfo")
    {
        tutorData = JSON.parse(req.body["Tutor"]);
        updateUserProfile(req.body, tutorData).then(result =>
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
        });
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

        updateUserPassword(JSON.parse(req.body["Tutor"]), req.body["OldPassword"], req.body["NewPassword"]).then(result =>
        {
            // If no rows changed then error
            if (result.affectedRows == 0)
            {
                res.status(400).end("ERROR! Old password doesn't match!")
                return;
            }
            
            // Else successfully changed password
            res.status(200).end("SUCCESS! Password has been updated.");
        })
    }
    else if (req.originalUrl == "/addTutor")
    {
        if (Number(req.body["Percentage"]) > 100)
        {
            res.status(400).end("ERROR! Percentage too big. Percentage must be within 0 - 100.");
            return;
        }

        checkTutorExists(req.body["Email"]).then(result =>
        {
            if (result.length > 0)
            {
                res.status(400).end("ERROR! Tutor already exists.");
                return;
            }
            
            var newAuthToken = Math.floor(Math.random() * 90000) + 10000;
            addTutor(req.body, "password", newAuthToken).then(result =>
            {
                if (result.affectedRows == 1)
                {
                    getTutor(result.insertId).then(result =>
                    {
                        res.status(200).end(JSON.stringify(result));
                    })
                }
                else
                {
                    res.status(400).end("ERROR! Unable to add tutor. Try again.");
                }
            })
        }) 
    }
    else if (req.originalUrl == "/addStudent")
    {
        checkStudentExists(req.body["FirstName"], req.body["LastName"]).then(result =>
        {
            if (result.length > 0)
            {
                res.status(400).end("ERROR! Student already exists.");
                return;
            }
        
            addStudent(req.body).then(result =>
            {
                if (result.affectedRows == 1)
                {
                    getStudent(result.insertId).then(result =>
                    {
                        res.status(200).end(JSON.stringify(result));
                    })
                }
                else
                {
                    res.status(400).end("ERROR! Unable to add student. Try again.");
                }
            })
        })
    }
    else if (req.originalUrl == "/addClass")
    {
        checkClassExists(req.body["Name"], req.body["Level"]).then(result =>
        {
            if (result.length > 0)
            {
                res.status(400).end("ERROR! Class already exists.");
                return;
            }
        
            addClass(req.body["Name"], req.body["Level"]).then(result =>
            {
                if (result.affectedRows == 1)
                {
                    getClass(result.insertId).then(result =>
                    {
                        res.status(200).end(JSON.stringify(result));
                    })
                }
                else
                {
                    res.status(400).end("ERROR! Unable to add class. Try again.");
                }
            })
        })
    }
    else if (req.originalUrl == "/addHours")
    {
        // Convert data to usuable types
        tutorData = JSON.parse(req.body["Tutor"]);
        classData = JSON.parse(req.body["Class"]);
        studentData = JSON.parse(req.body["Student"]);
        startTime = new Date(0, 0, 0, req.body["startTime"].split(":")[0], req.body["startTime"].split(":")[1]);
        endTime = new Date(0, 0, 0, req.body["endTime"].split(":")[0], req.body["endTime"].split(":")[1]);

        // Check that end time not before start time
        timeElapsed = endTime - startTime;
        if (timeElapsed < 0)
        {
            res.status(400).end("ERROR! End time must be after start time.");
            return;
        }

        // Calculate money generated and add hours
        moneyGenerated = studentData["Price"] * (timeElapsed / 3600000);
        addHours(tutorData, req.body, studentData, classData, moneyGenerated).then(result =>
        {
            if (result.affectedRows == 1)
            {
                res.status(200).end("SUCCESS! Hours have been logged.");
            }
        })
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