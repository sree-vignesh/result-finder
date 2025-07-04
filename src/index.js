const express = require("express");
const axios = require("axios");
const https = require("https");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(
  cors({
    origin: "*", // Allow all origins (or specify frontend URL)
    methods: "GET,POST",
    allowedHeaders: "Content-Type",
  })
); // Enable CORS for all requests
app.use(bodyParser.json()); // Parse JSON request bodies

// Axios Client
const apiClient = axios.create({
  baseURL: "http://rajalakshmi.in",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Content-Type": "application/json; charset=utf-8",
    "X-Requested-With": "XMLHttpRequest",
    Origin: "http://rajalakshmi.in",
    Referer: "http://rajalakshmi.in/UI/Modules/Login/UniLogin.aspx",
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Bypass SSL issues
});

// Grade Mapping
const gradePoints = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, P: 4, U: 0 };

// Function to Login & Get Session
async function loginAndGetSession(rollNumber) {
  try {
    const loginData = {
      PuniVMenulist: `${rollNumber}@rajalakshmi.edu.in`,
      RoleID: 0,
    };

    const response = await apiClient.post(
      "/UI/Modules/Login/UniLogin.aspx/VlidateUser",
      loginData
    );
    const setCookieHeader = response.headers["set-cookie"];
    if (!setCookieHeader) throw new Error("Failed to retrieve session cookie");

    const sessionCookie = setCookieHeader.find((cookie) =>
      cookie.startsWith("ASP.NET_SessionId")
    );
    if (!sessionCookie) throw new Error("Session ID not found in cookies");

    return sessionCookie.split(";")[0];
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
}

// Function to Fetch Results
async function fetchResults(sessionId) {
  try {
    const resultData = {
      AcademicYearId: 0,
      CourseId: 0,
      SemesterId: 0,
      PersonId: 0,
    };

    const response = await apiClient.post(
      "/UI/Modules/UniCurrentResult.aspx/GetResult",
      resultData,
      {
        headers: {
          Cookie: `G_ENABLED_IDPS=google; ${sessionId}`,
          Referer:
            "http://rajalakshmi.in/UI/Modules/uniCurrentResult.aspx?FormHeading=Examination%20Result",
        },
      }
    );

    if (!response.data || !response.data.d) {
      throw new Error("No valid results found!");
    }

    const resultJson = JSON.parse(response.data.d);

    if (!Array.isArray(resultJson) || resultJson.length === 0) {
      throw new Error("Results data is empty or incorrect format!");
    }

    let totalCredits = 0,
      totalGradePoints = 0;

    const results = resultJson.map((result) => {
      const grade = result.Grade || "NA";
      const credits = result.CREDITS || 0;

      if (grade in gradePoints && credits > 0) {
        totalCredits += credits;
        totalGradePoints += gradePoints[grade] * credits;
      }

      return {
        subjectCode: result.Code || "Unknown Code",
        subjectName: result.Subject || "Unknown Subject",
        grade,
        credits,
        status: result.Result || "NA",
      };
    });

    const GPA =
      totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "N/A";

    return { results, GPA };
  } catch (error) {
    throw new Error(`Failed to fetch results: ${error.message}`);
  }
}

// API Route to Get Results
app.post("/getResults", async (req, res) => {
  const { rollNumber } = req.body;

  if (!rollNumber) {
    return res.status(400).json({ error: "Roll number is required" });
  }

  try {
    const sessionId = await loginAndGetSession(rollNumber);
    const resultData = await fetchResults(sessionId);

    res.json({
      rollNumber,
      ...resultData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
