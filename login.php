<?php

    $servername = "sql311.epizy.com";
    $username = "epiz_33366408";
    $password = "zPn9bwwz8XITkcH";
    $dbname = "epiz_33366408_mmtDB";

    // Create connection
    $conn = mysqli($servername, $username, $password, $dbname);

    // Check connection
    if (!$conn) 
    {
        echo "Connection failed!";
    }

    // $sql = "SELECT * FROM Tutors";
    // $result = $conn->query($sql);

    // if ($result->num_rows > 0) 
    // {
    // echo $result->num_rows;
    // } 
    // else 
    // {
    // echo "0 results";
    // }

?>