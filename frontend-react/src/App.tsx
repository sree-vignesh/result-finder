import { useState } from "react";

interface Subject {
  subjectCode: string;
  subjectName: string;
  grade: string;
  credits: number;
  status: string;
}

interface StudentResults {
  rollNumber: string;
  GPA: number;
  results: Subject[];
}

export default function StudentResultsFinder() {
  const [rollNumber, setRollNumber] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<StudentResults | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    setError("");
    setResults(null);
    setLoading(true);

    if (!rollNumber.trim()) {
      setError("Please enter a valid roll number!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/getResults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber }),
      });

      if (!response.ok) throw new Error("Failed to fetch results");

      const data: StudentResults = await response.json();
      setResults(data);
    } catch (error) {
      setError("Error fetching results. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Student Result Finder</h2>
      <div style={styles.inputContainer}>
        <input
          type="text"
          placeholder="Enter Roll Number"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          style={styles.input}
        />
        <button onClick={fetchResults} style={styles.button} disabled={loading}>
          {loading ? "Fetching..." : "Get Results"}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {results && (
        <div style={styles.resultsContainer}>
          <h3 style={styles.resultsTitle}>Results for {results.rollNumber}</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "Subject Code",
                  "Subject Name",
                  "Grade",
                  "Credits",
                  "Status",
                ].map((heading) => (
                  <th key={heading} style={styles.th}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.results.map((subject, index) => (
                <tr key={index}>
                  <td style={styles.td}>{subject.subjectCode}</td>
                  <td style={styles.td}>{subject.subjectName}</td>
                  <td style={styles.td}>{subject.grade}</td>
                  <td style={styles.td}>{subject.credits}</td>
                  <td style={styles.td}>{subject.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={styles.gpa}>GPA: {results.GPA}</h3>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    height: "100vh",
    backgroundColor: "#e0e0e0",
    color: "#333",
  },
  title: {
    marginBottom: "20px",
  },
  inputContainer: {
    display: "flex",
    gap: "10px",
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
    backgroundColor: "#EFEFEFFF",
    color: "black",
  },
  button: {
    padding: "10px 15px",
    border: "none",
    backgroundColor: "#007BFF",
    color: "white",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background 0.3s ease",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
  resultsContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    marginTop: "20px",
    width: "80%",
    textAlign: "center" as const,
  },
  resultsTitle: {
    marginBottom: "10px",
  },
  table: {
    width: "100%",
    // borderCollapse: "collapse" as const,
    marginTop: "10px",
    // color: "white",
    // border: "white",
    // border: "1px solid #007BFF",
  },
  th: {
    border: "0px solid black",
    padding: "10px",
    background: "#0056b3",
    color: "white",
    borderRadius: "5px",
  },
  td: {
    border: "0px solid black",
    padding: "10px",
    backgroundColor: "#F6F6F6FF",
  },
  gpa: {
    marginTop: "10px",
    fontSize: "18px",
    fontWeight: "bold" as const,
  },
};
