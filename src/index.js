const axios = require("axios");
const https = require("https");

// Create an axios instance with necessary headers
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

// Grade points mapping for GPA calculation
const gradePoints = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
};

// Function to login and retrieve session ID
async function loginAndGetSession() {
  try {
    const loginData = {
      PuniVMenulist: "211401052@rajalakshmi.edu.in",
      RoleID: 0,
    };

    const response = await apiClient.post(
      "/UI/Modules/Login/UniLogin.aspx/VlidateUser",
      loginData
    );

    // Extract session ID from Set-Cookie header
    const setCookieHeader = response.headers["set-cookie"];
    if (!setCookieHeader) throw new Error("Failed to retrieve session cookie");

    const sessionCookie = setCookieHeader.find((cookie) =>
      cookie.startsWith("ASP.NET_SessionId")
    );
    if (!sessionCookie) throw new Error("Session ID not found in cookies");

    const sessionId = sessionCookie.split(";")[0];
    console.log("Session ID:", sessionId);
    return sessionId;
  } catch (error) {
    console.error("Login failed:", error.message);
    return null;
  }
}

// Function to fetch results and calculate GPA
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

    const resultJson = JSON.parse(response.data.d);
    let totalCredits = 0,
      totalGradePoints = 0;

    console.log("\nResults:\n");
    console.log(resultJson);

    // Loop through results and display formatted output
    resultJson.forEach(({ SUBJECTCODE, SUBJECTNAME, GRADE, CREDITS }) => {
      const status = gradePoints[GRADE] > 0 ? "Pass" : "Fail";
      console.log(`${SUBJECTCODE}\t${SUBJECTNAME}\t${GRADE}\t${status}`);

      // GPA Calculation
      if (GRADE in gradePoints) {
        totalCredits += CREDITS;
        totalGradePoints += gradePoints[GRADE] * CREDITS;
      }
    });

    // Calculate and print GPA
    if (totalCredits > 0) {
      const GPA = (totalGradePoints / totalCredits).toFixed(2);
      console.log(`\nGPA: ${GPA}`);
    } else {
      console.log("\nGPA: Unable to calculate (No valid credits found)");
    }
  } catch (error) {
    console.error("Failed to fetch results:", error.message);
  }
}

// Execute the process
(async () => {
  const sessionId = await loginAndGetSession();
  if (sessionId) await fetchResults(sessionId);
})();
