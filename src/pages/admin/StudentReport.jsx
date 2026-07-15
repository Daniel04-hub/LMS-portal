import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";

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

function normalizeCourseStatus(status) {
  const value = String(status || "Not Started").trim().toLowerCase();

  if (value === "in progress") {
    return "In Progress";
  }

  if (value === "completed") {
    return "Completed";
  }

  return "Not Started";
}

function normalizeProgress(progress) {
  const value = Number(progress);

  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor(value)));
}

export default function StudentReport() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("All Colleges");
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [selectedTrainer, setSelectedTrainer] = useState("All Trainers");

  const normalizeValue = (value) => String(value || "").trim().toLowerCase();
  const getStudentBatch = (student) =>
    String(student?.batch || student?.batchName || student?.batch_name || "").trim();

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedMcqResults = JSON.parse(localStorage.getItem("lms-mcq-results")) || [];
    const savedCodingSubmissions =
      JSON.parse(localStorage.getItem("lms-coding-submissions")) || [];

    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setMcqResults(Array.isArray(savedMcqResults) ? savedMcqResults : []);
    setCodingSubmissions(
      Array.isArray(savedCodingSubmissions) ? savedCodingSubmissions : []
    );
  }, []);

  function toTitleCase(value) {
    return String(value || "")
      .toLowerCase()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  }

  let trainerOptions = ["All Trainers"];
  const syncedStudents = Array.isArray(students) ? students : [];

  if (Array.isArray(syncedStudents)) {
    const set = new Set();
    syncedStudents.forEach((s) => {
      if (s && s.trainerName) set.add(String(s.trainerName).trim());
    });
    const items = Array.from(set);
    items.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const display = items.map((t) => toTitleCase(t));
    trainerOptions = ["All Trainers", ...display];
  }

  let collegeOptions = ["All Colleges"];
  if (Array.isArray(syncedStudents)) {
    const set = new Set();
    syncedStudents.forEach((s) => {
      if (s && s.college) set.add(String(s.college).trim());
    });
    const items = Array.from(set);
    items.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    collegeOptions = ["All Colleges", ...items];
  }

  let batchOptions = ["All Batches"];
  if (Array.isArray(syncedStudents)) {
    const selCollege = String(selectedCollege || "All Colleges").trim().toLowerCase();
    const selTrainer = String(selectedTrainer || "All Trainers").trim().toLowerCase();
    const set = new Set();
    syncedStudents.forEach((s) => {
      if (!s) return;
      const collegeMatches =
        selCollege === "all colleges" || String(s.college || "").trim().toLowerCase() === selCollege;
      const trainerMatches =
        selTrainer === "all trainers" || String(s.trainerName || "").trim().toLowerCase() === selTrainer;
      const batch = getStudentBatch(s);
      if (collegeMatches && trainerMatches && batch) set.add(batch);
    });
    const items = Array.from(set);
    items.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    batchOptions = ["All Batches", ...items];
  }

  useEffect(() => {
    if (selectedBatch === "All Batches") {
      return;
    }

    const exists = batchOptions.some((option) => normalizeValue(option) === normalizeValue(selectedBatch));
    if (!exists) {
      setSelectedBatch("All Batches");
    }
  }, [batchOptions.join("|"), selectedBatch]);

  const normalizedStudents = Array.isArray(syncedStudents)
    ? syncedStudents.map((student) => ({
        ...student,
        courseProgress: normalizeProgress(student?.courseProgress),
        courseStatus: normalizeCourseStatus(student?.courseStatus),
      }))
    : [];

  const selCollege = String(selectedCollege || "All Colleges").trim().toLowerCase();
  const selBatch = String(selectedBatch || "All Batches").trim().toLowerCase();
  const selTrainer = String(selectedTrainer || "All Trainers").trim().toLowerCase();

  const tableData = normalizedStudents.filter((student) => {
    const collegeMatches =
      selCollege === "all colleges" ||
      String(student?.college || "").trim().toLowerCase() === selCollege;

    const batchMatches =
      selBatch === "all batches" ||
      normalizeValue(getStudentBatch(student)) === selBatch;

    const trainerMatches =
      selTrainer === "all trainers" ||
      String(student?.trainerName || "").trim().toLowerCase() === selTrainer;

    return collegeMatches && batchMatches && trainerMatches;
  });

  return (
    <div className="container py-4">
      <div className="card p-3 shadow-sm border-0 rounded-3">
        <h1 className="h4 mb-3">Student Report</h1>

        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label">Filter by Batch</label>
            <select
              className="form-select"
              value={selectedBatch}
              onChange={(event) => setSelectedBatch(event.target.value)}
            >
              {batchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label">Filter by College</label>
            <select
              className="form-select"
              value={selectedCollege}
              onChange={(event) => setSelectedCollege(event.target.value)}
            >
              {collegeOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4 col-lg-3">
            <label className="form-label">Filter by Trainer</label>
            <select
              className="form-select"
              value={selectedTrainer}
              onChange={(event) => setSelectedTrainer(event.target.value)}
            >
              {trainerOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <DataTable
            rowKey="id"
            columns={[
              { key: "name", header: "Student Name" },
              { key: "email", header: "Email" },
              { key: "college", header: "College" },
              { key: "batch", header: "Batch" },
              { key: "trainerName", header: "Trainer" },
              { key: "assignedCourse", header: "Assigned Course" },
              {
                key: "courseProgress",
                header: "Progress",
                render: (student) => (
                  <div className="min-w-100" style={{ minWidth: "140px" }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold">{student.courseProgress}%</span>
                    </div>
                    <div className="progress" style={{ height: "10px" }}>
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{ width: student.courseProgress + "%" }}
                        aria-valuenow={student.courseProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                ),
              },
              {
                key: "courseStatus",
                header: "Status",
                render: (student) => (
                  <span className={getStatusBadgeClass(student.courseStatus)}>
                    {student.courseStatus}
                  </span>
                ),
              },
            ]}
            data={tableData}
          />
        </div>
      </div>
    </div>
  );
}

