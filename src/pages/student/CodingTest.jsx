import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Code, Terminal, AlertTriangle, CheckCircle, Clock, BookOpen, Monitor, Award, FileCode } from "lucide-react";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getStatusBadge(status) {
  var value = (status || "").toLowerCase();
  if (value === "completed" || value === "approved" || value === "active") return "premium-badge bg-success bg-opacity-25 text-success border-0";
  if (value === "in progress" || value === "pending" || value === "reviewed") return "premium-badge bg-warning bg-opacity-25 text-warning border-0";
  if (value === "not started" || value === "submitted") return "premium-badge bg-secondary bg-opacity-25 text-secondary border-0";
  return "premium-badge bg-danger bg-opacity-25 text-danger border-0";
}

function getResultText(item) {
  if (item?.resultStatus) return item.resultStatus;
  if ((item?.status || "").toLowerCase() === "pending") return "Pending Review";
  if ((parseInt(item?.score, 10) || 0) >= 80) return "Passed";
  return "Retry Required";
}

function getResultBadge(result) {
  if (result === "Passed") return "premium-badge bg-success bg-opacity-25 text-success border-0";
  if (result === "Pending Review") return "premium-badge bg-secondary bg-opacity-25 text-secondary border-0";
  return "premium-badge bg-danger bg-opacity-25 text-danger border-0";
}

function getNextAttempt(list) {
  return list.reduce((max, item) => Math.max(max, parseInt(item.attemptNumber, 10) || 0), 0) + 1;
}

export default function CodingTest() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [codingTests, setCodingTests] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [violations, setViolations] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = () => {
    setStudents(JSON.parse(localStorage.getItem("lms-students")) || []);
    setCourses(JSON.parse(localStorage.getItem("lms-courses")) || []);
    setCodingTests(JSON.parse(localStorage.getItem("lms-coding-tests")) || []);
    setSubmissions(JSON.parse(localStorage.getItem("lms-coding-submissions")) || []);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (!e.key || ["lms-students", "lms-courses", "lms-coding-tests", "lms-coding-submissions"].includes(e.key)) loadData();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", loadData);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  const userEmail = user?.email || "";
  const userName = user?.name || "";
  const normalizedUserEmail = normalizeText(userEmail);

  const student = students.find(s => normalizeText(s?.email) === normalizedUserEmail) || {};
  const assignedCourse = student?.assignedCourse || "";
  const normalizedAssignedCourse = normalizeText(assignedCourse);
  const normalizedStudentTrainerName = normalizeText(student?.trainerName);

  const course = courses.find(c => normalizeText(c.title) === normalizedAssignedCourse) || {};
  const modules = course?.modules || [];
  const fallbackModuleId = modules.length === 1 ? "" + modules[0].id : "";

  const availableTests = codingTests.filter(item => {
    if (!item.questionTitle) return false;
    if (item.courseTitle && normalizeText(item.courseTitle) !== normalizedAssignedCourse) return false;
    if (item.trainerName && normalizedStudentTrainerName && normalizeText(item.trainerName) !== normalizedStudentTrainerName) return false;
    if (!item.courseTitle && item.createdBy && normalizedStudentTrainerName && normalizeText(item.createdBy) !== normalizedStudentTrainerName) return false;
    return assignedCourse !== "";
  }).map(item => ({
    ...item,
    description: item.description || "",
    starterCode: item.starterCode || "",
    language: item.language || "JavaScript",
    moduleId: item.moduleId ? "" + item.moduleId : "",
    moduleTitle: item.moduleTitle || "",
  }));

  const selectedTest = availableTests.find(item => "" + item.id === "" + selectedTestId) || null;

  const visibleSubmissions = submissions
    .filter(item => normalizeText(item.studentEmail) === normalizedUserEmail)
    .map(item => ({
      ...item,
      status: item.status || "Pending",
      score: parseInt(item.score, 10) || 0,
      attemptNumber: parseInt(item.attemptNumber, 10) || 1,
      resultStatus: getResultText(item),
    }))
    .sort((a, b) => {
      const first = Date.parse(b.submittedAt || "") || (parseInt(b.id, 10) || 0);
      const second = Date.parse(a.submittedAt || "") || (parseInt(a.id, 10) || 0);
      return first - second;
    });

  const selectedTestSubmissions = selectedTest ? visibleSubmissions.filter(item => item.questionTitle === selectedTest.questionTitle) : [];
  const latestSubmission = selectedTestSubmissions[0];
  const latestResult = latestSubmission?.resultStatus || "";

  const canRetry = latestResult === "Retry Required";
  const hasPassed = latestResult === "Passed";
  const isPendingReview = latestResult === "Pending Review";

  useEffect(() => {
    if (!availableTests.length) {
      setSelectedTestId(""); setSubmittedCode(""); return;
    }
    const currentTest = availableTests.find(item => "" + item.id === "" + selectedTestId);
    const nextTest = currentTest || availableTests[0];
    setSelectedTestId("" + (nextTest.id || ""));
    setSubmittedCode(nextTest.starterCode || "");
  }, [codingTests]);

  useEffect(() => {
    if (selectedTest) setSubmittedCode(selectedTest.starterCode || "");
  }, [selectedTestId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (showEditor && !active) {
        setViolations(v => v + 1);
        setWarningMessage("Do not exit fullscreen");
      }
    };
    const handleVisibilityChange = () => {
      if (showEditor && document.visibilityState === "hidden") {
        setViolations(v => v + 1);
        setWarningMessage("Tab switching detected");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showEditor]);

  useEffect(() => {
    if (violations >= 3 && showEditor && !isAutoSubmitted) {
      handleSubmitTest();
      setWarningMessage("Coding test auto-submitted due to violations");
      setIsAutoSubmitted(true);
    }
  }, [violations, showEditor, isAutoSubmitted]);

  const handleResetEditor = () => {
    if (!selectedTest) return;
    setSubmittedCode(selectedTest.starterCode || "");
    setShowEditor(false); setViolations(0); setWarningMessage(""); setIsAutoSubmitted(false);
  };

  const handleStartTest = async () => {
    if (!selectedTest || hasPassed || isPendingReview) return;
    setShowEditor(true); setViolations(0); setWarningMessage(""); setIsAutoSubmitted(false);
    try { await document.documentElement.requestFullscreen(); } catch (error) {}
    setIsFullscreen(Boolean(document.fullscreenElement));
  };

  const handleSubmitTest = (e) => {
    if (e) e.preventDefault();
    if (!selectedTest) { setMessage("No coding test available."); setType("danger"); return; }
    if (!submittedCode.trim()) { setMessage("Please write code before submitting."); setType("danger"); return; }

    const newSubmission = {
      id: Date.now(),
      studentName: userName, studentEmail: userEmail,
      questionTitle: selectedTest.questionTitle,
      submittedCode, language: selectedTest.language,
      submittedAt: new Date().getTime(),
      status: "Pending", trainerComment: "", score: 0,
      attemptNumber: getNextAttempt(selectedTestSubmissions),
      resultStatus: "Pending Review", isPassed: false,
      courseTitle: assignedCourse,
      trainerName: student?.trainerName || "",
      moduleId: selectedTest.moduleId || fallbackModuleId,
      moduleTitle: selectedTest.moduleTitle || "",
    };

    const updatedSubmissions = [newSubmission, ...submissions];
    setSubmissions(updatedSubmissions);
    localStorage.setItem("lms-coding-submissions", JSON.stringify(updatedSubmissions));
    setSubmittedCode(selectedTest.starterCode || "");
    setShowEditor(false); loadData();

    setMessage(canRetry ? "Coding test resubmitted successfully" : "Coding test submitted successfully");
    setType("success");

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const columns = [
    { key: "attemptNumber", header: "Attempt", render: (item) => <span className="fw-bold">#{item.attemptNumber}</span> },
    { key: "questionTitle", header: "Question", render: (item) => <span className="small">{item.questionTitle}</span> },
    { key: "language", header: "Language", render: (item) => <span className="small text-muted">{item.language}</span> },
    { key: "score", header: "Score", render: (item) => <span className="fw-bold">{item.score}%</span> },
    { key: "result", header: "Result", render: (item) => <span className={getResultBadge(getResultText(item))}>{getResultText(item)}</span> },
    { key: "trainerComment", header: "Feedback", render: (item) => <span className="small">{item.trainerComment || <span className="text-muted">No comments</span>}</span> },
  ];

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-1 text-gradient">Interactive Coding Test</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Complete coding challenges directly in your browser.</p>
      </div>

      {message && <AlertMessage message={message} type={type} />}
      {warningMessage && <AlertMessage message={warningMessage} type="danger" />}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><Code size={20} color="var(--accent-color)" /> Assessment Portal</h5>

            {availableTests.length === 0 ? (
              <div className="text-center p-5 rounded" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <Terminal size={48} color="var(--text-secondary)" className="mb-3 opacity-50" />
                <h6 className="text-muted">No Coding Tests Available</h6>
                <p className="small text-muted mb-0">You're all caught up for the assigned course.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTest} className="d-flex flex-column gap-4">
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {violations > 0 && <span className="premium-badge bg-danger text-white border-0"><AlertTriangle size={12} className="me-1"/> Violations: {violations} / 3</span>}
                  <span className={`premium-badge ${isFullscreen ? "bg-success text-success" : "bg-secondary text-secondary"} bg-opacity-25 border-0`}>
                    <Monitor size={12} className="me-1"/> Fullscreen: {isFullscreen ? "Active" : "Inactive"}
                  </span>
                  {latestResult && <span className={getResultBadge(latestResult)}>{latestResult}</span>}
                </div>

                <div>
                  <label className="form-label small text-muted">Select Question</label>
                  <select className="modern-input" value={selectedTestId} onChange={(e) => setSelectedTestId(e.target.value)}>
                    {availableTests.map(item => <option key={item.id} value={item.id}>{item.questionTitle}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label small text-muted">Description</label>
                  <div className="p-3 rounded small" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    {selectedTest?.description || "Select a test to view description."}
                  </div>
                </div>

                {!showEditor && (
                  <div>
                    <label className="form-label small text-muted">Starter Code</label>
                    <div className="p-3 rounded" style={{ backgroundColor: "#0D0D0D", border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                      <pre className="mb-0" style={{ color: "#E5E5E5", fontFamily: "monospace", fontSize: "0.85rem" }}>
                        <code>{selectedTest?.starterCode || "// No code available"}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {latestSubmission && !showEditor && (
                  <div className="p-3 rounded" style={{ background: 'var(--accent-hover)', border: `1px solid var(--accent-color)` }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Award size={18} color="var(--accent-color)" />
                      <span className="fw-bold">Attempt #{latestSubmission.attemptNumber} Result</span>
                    </div>
                    <div className="small mb-1"><span className="text-muted">Score:</span> {latestResult === "Pending Review" ? "-" : `${latestSubmission.score}%`}</div>
                    <div className="small"><span className="text-muted">Feedback:</span> {latestSubmission.trainerComment || "Pending instructor review"}</div>
                  </div>
                )}

                {!showEditor && !hasPassed && !isPendingReview && (
                  <button type="button" onClick={canRetry ? handleResetEditor : handleStartTest} className="btn btn-danger w-100 py-3 mt-2 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2">
                    <Terminal size={18} /> {canRetry ? "Retry Assessment" : "Start Coding Test"}
                  </button>
                )}

                {showEditor && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <label className="form-label small text-muted d-flex align-items-center gap-2"><FileCode size={16}/> Live Editor ({selectedTest?.language})</label>
                    <textarea
                      className="form-control rounded-3 border-0 p-3"
                      value={submittedCode}
                      onChange={(e) => setSubmittedCode(e.target.value)}
                      placeholder="Write your code here..."
                      required
                      spellCheck="false"
                      style={{
                        backgroundColor: "#0D0D0D", color: "#4CAF50", fontFamily: "'Fira Code', monospace", fontSize: "0.9rem",
                        minHeight: "350px", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)"
                      }}
                    />
                    <div className="d-flex gap-3 mt-4">
                      <button type="button" onClick={handleResetEditor} className="btn glass-panel flex-grow-1 py-3 rounded-3 fw-bold">Cancel</button>
                      <button type="submit" className="btn btn-danger flex-grow-1 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2"><CheckCircle size={18}/> Submit Code</button>
                    </div>
                  </motion.div>
                )}
              </form>
            )}
          </motion.div>
        </div>

        <div className="col-12 col-lg-7">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><Clock size={20} color="var(--accent-color)" /> Submission History</h5>
            {visibleSubmissions.length > 0 ? (
              <div className="table-responsive">
                <DataTable rowKey="id" columns={columns} data={visibleSubmissions} />
              </div>
            ) : (
              <div className="text-center p-5" style={{ background: 'var(--glass-bg)', borderRadius: '1rem' }}>
                <Code size={48} color="var(--text-secondary)" className="mb-3 opacity-50" />
                <h6 className="text-muted">No submissions found</h6>
                <p className="small text-muted mb-0">Take a coding test to see your history and scores.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}


