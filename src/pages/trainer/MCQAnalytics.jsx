import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import StatsCard from "../../components/StatsCard";
import { useAuth } from "../../context/AuthContext";

function getLatestTimestamp(result) {
  const submittedAt = Date.parse(result?.submittedAt || "");

  if (!Number.isNaN(submittedAt)) {
    return submittedAt;
  }

  return Number(result?.id) || 0;
}

function getPercentage(result) {
  if (result?.percentage !== undefined && result?.percentage !== null && result?.percentage !== "") {
    return Number(result.percentage) || 0;
  }

  const score = Number(result?.score) || 0;
  const totalQuestions = Number(result?.totalQuestions) || 0;

  if (totalQuestions <= 0) {
    return 0;
  }

  return Math.round((score / totalQuestions) * 100);
}

function getResultStatus(result) {
  if (result?.resultStatus) {
    return String(result.resultStatus);
  }

  return getPercentage(result) >= 80 ? "Passed" : "Retry Required";
}

function getAnalyticsStatus(result) {
  return getResultStatus(result) === "Passed" ? "Passed" : "Failed";
}

function getStatusClass(status) {
  if (status === "Passed") {
    return "badge bg-success";
  }

  if (status === "Retry Required") {
    return "badge bg-warning text-dark";
  }

  if (status === "Failed") {
    return "badge bg-danger";
  }

  return "badge bg-secondary";
}

export default function MCQAnalytics() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedResult, setSelectedResult] = useState("All Results");

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedMcqResults = JSON.parse(localStorage.getItem("lms-mcq-results")) || [];

    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setMcqResults(Array.isArray(savedMcqResults) ? savedMcqResults : []);
  }, []);

  const trainerCourses = courses.filter((course) => course.trainerName === user?.name);

  const trainerCourseTitles = trainerCourses.map((course) => course.title);

  const courseOptions = ["All Courses", ...trainerCourseTitles];

  const courseTitleSet = new Set(trainerCourseTitles);
  const trainerResults = (Array.isArray(mcqResults) ? mcqResults : [])
    .filter((result) => courseTitleSet.has(result.courseTitle))
    .map((result) => {
      const score = Number(result.score) || 0;
      const totalQuestions = Number(result.totalQuestions) || 0;
      const percentage = getPercentage(result);
      const finalResult = getResultStatus(result);
      const attemptNumber = Number(result.attemptNumber) || 1;

      return {
        ...result,
        studentName: result.studentName || "Student",
        studentEmail: result.studentEmail || "",
        courseTitle: result.courseTitle || "Not Assigned",
        score,
        totalQuestions,
        percentage,
        finalResult,
        analyticsStatus: getAnalyticsStatus({ ...result, percentage, resultStatus: finalResult }),
        attemptNumber,
        submittedAt: result.submittedAt || "",
      };
    })
    .sort((first, second) => getLatestTimestamp(second) - getLatestTimestamp(first));

  const filteredResults = trainerResults.filter((result) => {
    const courseMatches =
      selectedCourse === "All Courses" || result.courseTitle === selectedCourse;
    const resultMatches =
      selectedResult === "All Results" || result.analyticsStatus === selectedResult;

    return courseMatches && resultMatches;
  });

  const analytics =
    filteredResults.length === 0
      ? {
          averageScore: "0%",
          highestScore: "0%",
          highestScoreLabel: "No data available",
          failedCount: 0,
        }
      : (() => {
          const totalPercentage = filteredResults.reduce(
            (sum, result) => sum + result.percentage,
            0
          );
          const highestResult = filteredResults.reduce((best, result) => {
            if (!best || result.percentage > best.percentage) {
              return result;
            }

            return best;
          }, null);

          return {
            averageScore: `${Math.round(totalPercentage / filteredResults.length)}%`,
            highestScore: `${highestResult?.percentage || 0}%`,
            highestScoreLabel: highestResult
              ? `${highestResult.studentName} - ${highestResult.courseTitle}`
              : "No data available",
            failedCount: filteredResults.filter((result) => result.analyticsStatus === "Failed").length,
          };
        })();

  const topPerformers = !filteredResults.length
    ? []
    : (() => {
        const highestPercentage = Math.max(...filteredResults.map((result) => result.percentage));
        return filteredResults.filter((result) => result.percentage === highestPercentage);
      })();

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h1 className="h4 mb-1">MCQ Analytics</h1>
          <p className="text-muted mb-0">
            Track all student MCQ results, failed attempts, and top performers.
          </p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatsCard title="Average Score" count={analytics.averageScore} bgColor="primary" />
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded bg-success text-white h-100">
            <div className="card-body text-center p-3">
              <h6>Highest Score</h6>
              <h2 className="mb-1">{analytics.highestScore}</h2>
              <small>{analytics.highestScoreLabel}</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <StatsCard title="Failed Count" count={analytics.failedCount} bgColor="danger" />
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-end mb-3">
            <div className="col-12 col-md-6 col-lg-4">
              <label className="form-label">Filter by Course</label>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
              >
                {courseOptions.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-4">
              <label className="form-label">Filter by Result</label>
              <select
                className="form-select"
                value={selectedResult}
                onChange={(event) => setSelectedResult(event.target.value)}
              >
                {["All Results", "Passed", "Failed"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {topPerformers.length > 0 ? (
            <div className="alert alert-success">
              <strong>Top Performer{topPerformers.length > 1 ? "s" : ""}:</strong>{" "}
              {topPerformers
                .map((result) => `${result.studentName} (${result.percentage}%)`)
                .join(", ")}
            </div>
          ) : null}

          <DataTable
            rowKey="id"
            columns={[
              { key: "studentName", header: "Student Name" },
              { key: "courseTitle", header: "Course" },
              {
                key: "score",
                header: "Correct Answers",
                render: (result) => `${result.score}`,
              },
              { key: "totalQuestions", header: "Total Questions" },
              {
                key: "percentage",
                header: "Percentage",
                render: (result) => `${result.percentage}%`,
              },
              { key: "attemptNumber", header: "Attempt" },
              {
                key: "finalResult",
                header: "Final Result",
                render: (result) => (
                  <span className={getStatusClass(result.finalResult)}>{result.finalResult}</span>
                ),
              },
              {
                key: "analyticsStatus",
                header: "Status",
                render: (result) => (
                  <span className={getStatusClass(result.analyticsStatus)}>
                    {result.analyticsStatus}
                  </span>
                ),
              },
            ]}
            data={filteredResults}
          />
        </div>
      </div>
    </div>
  );
}

