import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";
import StatsCard from "../../components/StatsCard";
import { useAuth } from "../../context/AuthContext";

function getStatusBadgeClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed" || value === "approved" || value === "active") {
    return "badge bg-success";
  }

  if (value === "in progress" || value === "pending" || value === "reviewed") {
    return "badge bg-warning text-dark";
  }

  if (value === "not started" || value === "submitted") {
    return "badge bg-secondary";
  }

  if (value === "rejected") {
    return "badge bg-danger";
  }

  return "badge bg-danger";
}

function normalizeTest(test) {
  return {
    id: test?.id,
    questionTitle: String(test?.questionTitle || ""),
    description: String(test?.description || ""),
    starterCode: String(test?.starterCode || ""),
    language: String(test?.language || "JavaScript"),
    testCases: Array.isArray(test?.testCases) ? test.testCases : [],
    createdBy: String(test?.createdBy || ""),
    trainerName: String(test?.trainerName || test?.createdBy || ""),
    courseTitle: String(test?.courseTitle || ""),
    moduleId: test?.moduleId ? String(test.moduleId) : "",
    moduleTitle: String(test?.moduleTitle || ""),
  };
}

function getLatestTimestamp(submission) {
  const submittedAt = Date.parse(submission?.submittedAt || "");

  if (!Number.isNaN(submittedAt)) {
    return submittedAt;
  }

  return Number(submission?.id) || 0;
}

function getLatestRecord(records) {
  if (!records.length) {
    return null;
  }

  return [...records].sort((first, second) => {
    return getLatestTimestamp(second) - getLatestTimestamp(first);
  })[0];
}

function getResultLabel(submission) {
  if (submission?.resultStatus) {
    return String(submission.resultStatus);
  }

  if (Number(submission?.score) >= 80) {
    return "Passed";
  }

  if (String(submission?.status || "").toLowerCase() === "pending") {
    return "Pending Review";
  }

  return "Retry Required";
}

function getAnalyticsResult(submission) {
  const result = getResultLabel(submission);

  if (result === "Passed") {
    return "Passed";
  }

  if (result === "Pending Review") {
    return "Pending Review";
  }

  return "Failed";
}

function getResultBadgeClass(result) {
  if (result === "Passed") {
    return "badge bg-success";
  }

  if (result === "Failed" || result === "Retry Required") {
    return "badge bg-danger";
  }

  return "badge bg-secondary";
}

function normalizeSubmission(submission) {
  const normalized = {
    id: submission?.id,
    studentName: String(submission?.studentName || ""),
    studentEmail: String(submission?.studentEmail || ""),
    questionTitle: String(submission?.questionTitle || ""),
    submittedCode: String(submission?.submittedCode || ""),
    language: String(submission?.language || "JavaScript"),
    submittedAt: String(submission?.submittedAt || ""),
    status: String(submission?.status || "Pending"),
    trainerComment: String(submission?.trainerComment || ""),
    score: Number(submission?.score) || 0,
    attemptNumber: Number(submission?.attemptNumber) || 1,
    trainerName: String(submission?.trainerName || ""),
    courseTitle: String(submission?.courseTitle || ""),
    moduleId: submission?.moduleId ? String(submission.moduleId) : "",
    moduleTitle: String(submission?.moduleTitle || ""),
  };

  const resultStatus = getResultLabel({
    ...normalized,
    resultStatus: submission?.resultStatus,
  });

  return {
    ...normalized,
    resultStatus,
    analyticsResult: getAnalyticsResult({
      ...normalized,
      resultStatus,
    }),
    isPassed:
      submission?.isPassed !== undefined ? Boolean(submission.isPassed) : resultStatus === "Passed",
  };
}

function clampProgress(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function getProgressStatus(progress) {
  if (progress >= 100) {
    return "Completed";
  }

  if (progress > 0) {
    return "In Progress";
  }

  return "Not Started";
}

function normalizeModules(course) {
  if (!Array.isArray(course?.modules)) {
    return [];
  }

  return course.modules
    .map((module, index) => ({
      id: String(module?.id ?? ""),
      moduleTitle: module?.moduleTitle || module?.title || `Module ${index + 1}`,
      moduleOrder: Number(module?.moduleOrder) || index + 1,
    }))
    .filter((module) => module.id)
    .sort((first, second) => first.moduleOrder - second.moduleOrder);
}

function getLinkedModuleId(record, modules, assignedCourse) {
  if (record?.moduleId !== undefined && record?.moduleId !== null && record?.moduleId !== "") {
    return String(record.moduleId);
  }

  if (
    String(record?.courseTitle || "").trim().toLowerCase() ===
      String(assignedCourse || "").trim().toLowerCase() &&
    modules.length === 1
  ) {
    return String(modules[0].id);
  }

  return "";
}

function getMcqPercentage(result) {
  if (!result) {
    return 0;
  }

  if (result.percentage !== undefined && result.percentage !== null && result.percentage !== "") {
    return clampProgress(result.percentage);
  }

  const score = Number(result.score) || 0;
  const totalQuestions = Number(result.totalQuestions) || 0;

  if (totalQuestions <= 0) {
    return 0;
  }

  return clampProgress((score / totalQuestions) * 100);
}

function updateStudentProgress(students, courses, mcqResults, codingSubmissions, studentEmail) {
  return (Array.isArray(students) ? students : []).map((student) => {
    if (
      String(student?.email || "").trim().toLowerCase() !==
      String(studentEmail || "").trim().toLowerCase()
    ) {
      return student;
    }

    const course = (Array.isArray(courses) ? courses : []).find(
      (item) =>
        String(item?.title || "").trim().toLowerCase() ===
          String(student?.assignedCourse || "").trim().toLowerCase() &&
        String(item?.status || "").trim().toLowerCase() === "approved"
    );

    if (!course) {
      return student;
    }

    const modules = normalizeModules(course);
    const progressMap =
      student?.moduleProgress && typeof student.moduleProgress === "object"
        ? student.moduleProgress
        : {};
    const moduleRecords = {};
    let totalProgress = 0;

    modules.forEach((module) => {
      const moduleId = module.id;
      const videoProgress = clampProgress(progressMap[moduleId] || 0);
      const latestMcq = getLatestRecord(
        (Array.isArray(mcqResults) ? mcqResults : []).filter(
          (item) =>
            String(item?.studentEmail || "").trim().toLowerCase() ===
              String(student?.email || "").trim().toLowerCase() &&
            String(item?.courseTitle || "").trim().toLowerCase() ===
              String(student?.assignedCourse || "").trim().toLowerCase() &&
            getLinkedModuleId(item, modules, student?.assignedCourse) === moduleId
        )
      );
      const latestCoding = getLatestRecord(
        (Array.isArray(codingSubmissions) ? codingSubmissions : []).filter(
          (item) =>
            String(item?.studentEmail || "").trim().toLowerCase() ===
              String(student?.email || "").trim().toLowerCase() &&
            String(item?.courseTitle || "").trim().toLowerCase() ===
              String(student?.assignedCourse || "").trim().toLowerCase() &&
            getLinkedModuleId(item, modules, student?.assignedCourse) === moduleId
        )
      );
      const mcqPercentage = getMcqPercentage(latestMcq);
      const codingScore = clampProgress(latestCoding?.score || 0);
      const codingPassed = getResultLabel(latestCoding) === "Passed";
      const moduleProgress = clampProgress(
        (videoProgress * 40) / 100 + (mcqPercentage >= 80 ? 30 : 0) + (codingPassed ? 30 : 0)
      );

      moduleRecords[moduleId] = {
        moduleTitle: module.moduleTitle,
        moduleProgress,
        moduleMarks: clampProgress(
          (videoProgress * 40) / 100 + (mcqPercentage * 30) / 100 + (codingScore * 30) / 100
        ),
        moduleStatus: getProgressStatus(moduleProgress),
      };
      totalProgress += moduleProgress;
    });

    const courseProgress = modules.length ? clampProgress(totalProgress / modules.length) : 0;

    return {
      ...student,
      trainerName: course.trainerName || student.trainerName || "",
      moduleRecords,
      courseProgress,
      courseStatus: getProgressStatus(courseProgress),
    };
  });
}

export default function CodingSubmissionReview() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);
  const [codingTests, setCodingTests] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  function showMessage(text, messageType) {
    setMessage(text);
    setType(messageType);
  }

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setType("info");
    }, 2000);

    return () => clearTimeout(timer);
  }, [message]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [reviewValues, setReviewValues] = useState({
    trainerComment: "",
    score: "0",
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedMcqResults = JSON.parse(localStorage.getItem("lms-mcq-results")) || [];
    const savedCodingTests =
      JSON.parse(localStorage.getItem("lms-coding-tests")) || [];
    const savedCodingSubmissions =
      JSON.parse(localStorage.getItem("lms-coding-submissions")) || [];

    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setMcqResults(Array.isArray(savedMcqResults) ? savedMcqResults : []);
    setCodingTests(Array.isArray(savedCodingTests) ? savedCodingTests : []);
    setCodingSubmissions(
      Array.isArray(savedCodingSubmissions) ? savedCodingSubmissions : []
    );
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem(
      "lms-coding-submissions",
      JSON.stringify(codingSubmissions)
    );
  }, [codingSubmissions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-students", JSON.stringify(students));
  }, [students, isLoaded]);

  const trainerTests = (Array.isArray(codingTests) ? codingTests : [])
    .map(normalizeTest)
    .filter((test) => test.createdBy === (user?.name || "") || test.trainerName === (user?.name || ""));

  const trainerQuestionTitles = new Set(trainerTests.map((test) => test.questionTitle));

  const groupedCounts = {};
  const submissions = (Array.isArray(codingSubmissions) ? codingSubmissions : [])
    .map(normalizeSubmission)
    .filter((submission) => trainerQuestionTitles.has(submission.questionTitle))
    .sort((first, second) => getLatestTimestamp(first) - getLatestTimestamp(second))
    .map((submission) => {
      const groupKey = `${submission.studentEmail}::${submission.questionTitle}`;
      groupedCounts[groupKey] = (groupedCounts[groupKey] || 0) + 1;
      const attemptNumber = Number(submission.attemptNumber) || groupedCounts[groupKey];

      return {
        ...submission,
        attemptNumber,
        retryCount: Math.max(attemptNumber - 1, 0),
      };
    })
    .sort((first, second) => getLatestTimestamp(second) - getLatestTimestamp(first));

  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedSubmissionId) || null;

  const selectedTest = !selectedSubmission
    ? null
    : trainerTests.find((test) => test.questionTitle === selectedSubmission.questionTitle) || null;

  const reviewedSubmissions = submissions.filter(
    (submission) => submission.resultStatus !== "Pending Review"
  );
  const analytics = {
    passedStudents: reviewedSubmissions.filter((submission) => submission.resultStatus === "Passed")
      .length,
    failedStudents: reviewedSubmissions.filter(
      (submission) => submission.resultStatus === "Retry Required"
    ).length,
    averageCodingScore: reviewedSubmissions.length
      ? `${Math.round(
          reviewedSubmissions.reduce((sum, submission) => sum + submission.score, 0) /
            reviewedSubmissions.length
        )}%`
      : "0%",
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmissionId(submission.id);
    setReviewValues({
      trainerComment: submission.trainerComment || "",
      score: String(submission.score ?? 0),
    });
  };

  const handleReviewChange = (key) => (event) => {
    setReviewValues((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const saveReview = () => {
    if (!selectedSubmission) {
      return;
    }

    const score = Math.max(0, Math.min(100, Number(reviewValues.score) || 0));
    const resultStatus = score >= 80 ? "Passed" : "Retry Required";
    const nextStatus = score >= 80 ? "Approved" : "Rejected";

    const updatedSubmissions = (Array.isArray(codingSubmissions) ? codingSubmissions : []).map(
      (submission) =>
        submission.id === selectedSubmission.id
          ? {
              ...submission,
              status: nextStatus,
              resultStatus,
              isPassed: score >= 80,
              trainerComment: reviewValues.trainerComment.trim(),
              score,
              attemptNumber:
                Number(submission?.attemptNumber) || selectedSubmission.attemptNumber || 1,
            }
          : submission
    );
    const updatedStudents = updateStudentProgress(
      students,
      courses,
      mcqResults,
      updatedSubmissions,
      selectedSubmission.studentEmail
    );

    setCodingSubmissions(updatedSubmissions);
    setStudents(updatedStudents);

    showMessage("Review saved successfully.", "success");
  };

  return (
    <div className="container mt-4">
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatsCard title="Passed Students" count={analytics.passedStudents} bgColor="success" />
        </div>
        <div className="col-12 col-md-4">
          <StatsCard title="Failed Students" count={analytics.failedStudents} bgColor="danger" />
        </div>
        <div className="col-12 col-md-4">
          <StatsCard
            title="Average Coding Score"
            count={analytics.averageCodingScore}
            bgColor="primary"
          />
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm p-3">
            <h1 className="h4 mb-3">Coding Submission Review</h1>
            <AlertMessage message={message} type={type} />

            <DataTable
              rowKey="id"
              columns={[
                { key: "studentName", header: "Student" },
                { key: "questionTitle", header: "Question" },
                {
                  key: "score",
                  header: "Score",
                  render: (submission) =>
                    submission.resultStatus === "Pending Review" ? "-" : `${submission.score}%`,
                },
                {
                  key: "result",
                  header: "Result",
                  render: (submission) => (
                    <span className={getResultBadgeClass(submission.analyticsResult)}>
                      {submission.analyticsResult}
                    </span>
                  ),
                },
                { key: "retryCount", header: "Retry Count" },
              ]}
              data={submissions}
              renderActions={(submission) => (
                <CustomButton text="Review" onClick={() => handleSelectSubmission(submission)} />
              )}
            />
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card shadow-sm p-3">
            <h2 className="h5 mb-3">Review Panel</h2>

            {!selectedSubmission ? (
              <div className="alert alert-info mb-0">
                Select a coding submission to review.
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <p className="mb-1">
                    <strong>Student:</strong> {selectedSubmission.studentName}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedSubmission.studentEmail}
                  </p>
                  <p className="mb-1">
                    <strong>Course:</strong> {selectedSubmission.courseTitle || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Module:</strong> {selectedSubmission.moduleTitle || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Question:</strong> {selectedSubmission.questionTitle}
                  </p>
                  <p className="mb-1">
                    <strong>Retry Count:</strong> {selectedSubmission.retryCount}
                  </p>
                  <p className="mb-1">
                    <strong>Language:</strong> {selectedSubmission.language}
                  </p>
                  <p className="mb-0">
                    <strong>Submitted:</strong> {selectedSubmission.submittedAt}
                  </p>
                </div>

                <div className="mb-3">
                  <label className="form-label">Question Description</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    value={selectedTest?.description || "No description available"}
                    readOnly
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Starter Code</label>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={selectedTest?.starterCode || ""}
                    readOnly
                    style={{
                      backgroundColor: "#1e1e1e",
                      color: "#ffffff",
                      fontFamily: "monospace",
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Submitted Code</label>
                  <textarea
                    className="form-control"
                    rows={10}
                    value={selectedSubmission.submittedCode}
                    readOnly
                    style={{
                      backgroundColor: "#1e1e1e",
                      color: "#ffffff",
                      fontFamily: "monospace",
                    }}
                  />
                </div>

                <div className="mb-3">
                  <h3 className="h6">Test Cases</h3>
                  {selectedTest?.testCases?.length ? (
                    <div className="d-flex flex-column gap-2">
                      {selectedTest.testCases.map((testCase, index) => (
                        <div key={`${index}-${testCase.input}`} className="border rounded p-2">
                          <div>
                            <strong>Input:</strong> {testCase.input}
                          </div>
                          <div>
                            <strong>Expected Output:</strong> {testCase.expectedOutput}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted">No test cases available</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Review Comment</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={reviewValues.trainerComment}
                    onChange={handleReviewChange("trainerComment")}
                    placeholder="Add trainer review comments"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={reviewValues.score}
                    onChange={handleReviewChange("score")}
                  />
                </div>

                <div className="mb-3">
                  <span className="me-2 fw-semibold">Result:</span>
                  <span className={getResultBadgeClass((Number(reviewValues.score) || 0) >= 80 ? "Passed" : "Failed")}>
                    {(Number(reviewValues.score) || 0) >= 80 ? "Passed" : "Failed"}
                  </span>
                </div>

                <div className="mb-3">
                  <span className="me-2 fw-semibold">Student Action:</span>
                  <span className={getStatusBadgeClass((Number(reviewValues.score) || 0) >= 80 ? "Completed" : "Pending")}>
                    {(Number(reviewValues.score) || 0) >= 80 ? "Passed" : "Retry Required"}
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <CustomButton text="Save Review" onClick={saveReview} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


