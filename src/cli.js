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

// Define grade points mapping
const gradePoints = { O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, P: 4, U: 0 };

async function loginAndGetSession() {
  try {
    const loginData = {
      PuniVMenulist: "211401024@rajalakshmi.edu.in",
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

    const sessionId = sessionCookie.split(";")[0];
    return sessionId;
  } catch (error) {
    console.error("Login failed:", error.message);
    return null;
  }
}

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
      console.error("❌ No valid results found!");
      return;
    }

    const resultJson = JSON.parse(response.data.d);

    if (!Array.isArray(resultJson) || resultJson.length === 0) {
      console.error("❌ Results data is empty or incorrect format!");
      return;
    }

    let totalCredits = 0,
      totalGradePoints = 0;

    console.log("\n📜 Results:\n");

    resultJson.forEach((result) => {
      const subjectCode = result.Code || "Unknown Code";
      const subjectName = result.Subject || "Unknown Subject";
      const grade = result.Grade || "NA";
      const credits = result.CREDITS || 0;
      const status = result.Result || "NA";

      console.log(`\t${grade}\t${status}\t${subjectName}\t${subjectCode}`);

      if (grade in gradePoints && credits > 0) {
        totalCredits += credits;
        totalGradePoints += gradePoints[grade] * credits;
      }
    });

    if (totalCredits > 0) {
      const GPA = (totalGradePoints / totalCredits).toFixed(2);
      console.log(`\n🎯 GPA: ${GPA}`);
    } else {
      console.log("\n⚠️ GPA: Unable to calculate (No valid credits found)");
    }
  } catch (error) {
    console.error("❌ Failed to fetch results:", error.message);
  }
}

(async () => {
  const sessionId = await loginAndGetSession();
  if (sessionId) await fetchResults(sessionId);
})();
