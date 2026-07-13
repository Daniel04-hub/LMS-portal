import React, { useEffect, useState } from "react";
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

function normalizeAssignment(assignment) {
  return {
    ...assignment,
    title: assignment.title || assignment.assignmentTitle || "",
    courseTitle: assignment.courseTitle || "Not Assigned",
    submittedAt: assignment.submittedAt || assignment.uploadedAt || "",
    status: assignment.status || "Pending",
    fileName: assignment.fileName || "",
    fileType: assignment.fileType || "",
    fileData: assignment.fileData || "",
    reviewComment: assignment.reviewComment || "",
  };
}

function isImageFile(fileType = "") {
  return String(fileType).toLowerCase().startsWith("image/");
}

function isPdfFile(fileType = "", fileName = "") {
  const normalizedType = String(fileType).toLowerCase();
  const normalizedName = String(fileName).toLowerCase();

  return normalizedType === "application/pdf" || normalizedName.endsWith(".pdf");
}

function FilePreview({ item }) {
  if (!item.fileData) {
    return <span className="text-muted">No file</span>;
  }

  if (isImageFile(item.fileType)) {
    return (
      <div className="d-grid gap-2">
        <img
          src={item.fileData}
          alt={item.fileName || "Submission preview"}
          className="img-fluid rounded border"
          style={{ maxHeight: 120, objectFit: "cover" }}
        />
        <span className="small text-muted">{item.fileName || "Image file"}</span>
      </div>
    );
  }

  if (isPdfFile(item.fileType, item.fileName)) {
    return (
      <button
        type="button"
        className="btn btn-outline-primary btn-sm"
        onClick={() => window.open(item.fileData, "_blank", "noopener,noreferrer")}
      >
        Open PDF
      </button>
    );
  }

  return (
    <a href={item.fileData} target="_blank" rel="noreferrer">
      {item.fileName || "Open File"}
    </a>
  );
}

export default function AssignmentMonitoring() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedAssignments =
      JSON.parse(localStorage.getItem("lms-assignments")) || [];

    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setAssignments(Array.isArray(savedAssignments) ? savedAssignments : []);
  }, []);

  const role = String(user?.role || "").toLowerCase();

  const normalizedAssignments = Array.isArray(assignments)
    ? assignments.map(normalizeAssignment)
    : [];
  const trainerStudentEmails = new Set(
    students
      .filter(
        (student) =>
          String(student?.trainerName || "").trim().toLowerCase() ===
          String(user?.name || "").trim().toLowerCase()
      )
      .map((student) => String(student?.email || "").trim().toLowerCase())
  );

  const visibleAssignments =
    role !== "trainer"
      ? normalizedAssignments.sort((first, second) => Number(second.id) - Number(first.id))
      : normalizedAssignments
          .filter((assignment) => {
            const assignmentTrainer = String(assignment.trainerName || "").trim().toLowerCase();

            if (assignmentTrainer && assignmentTrainer === String(user?.name || "").trim().toLowerCase()) {
              return true;
            }

            return trainerStudentEmails.has(
              String(assignment.studentEmail || "").trim().toLowerCase()
            );
          })
          .sort((first, second) => Number(second.id) - Number(first.id));

  const options = new Set();
  visibleAssignments.forEach((assignment) => {
    options.add(assignment.courseTitle || "Not Assigned");
  });
  const courseOptions = [
    "All Courses",
    ...Array.from(options).sort((first, second) => first.localeCompare(second)),
  ];

  const courseFilter = String(selectedCourse || "All Courses").trim().toLowerCase();
  const statusFilter = String(selectedStatus || "All Statuses").trim().toLowerCase();
  const filteredAssignments = visibleAssignments.filter((assignment) => {
    const courseMatches =
      courseFilter === "all courses" ||
      String(assignment.courseTitle || "").trim().toLowerCase() === courseFilter;
    const statusMatches =
      statusFilter === "all statuses" ||
      String(assignment.status || "").trim().toLowerCase() === statusFilter;

    return courseMatches && statusMatches;
  });

  const counts = filteredAssignments.reduce(
    (result, assignment) => {
      const normalizedStatus = String(assignment.status || "").trim().toLowerCase();

      if (normalizedStatus === "approved") {
        result.approved += 1;
      } else if (normalizedStatus === "rejected") {
        result.rejected += 1;
      } else {
        result.pending += 1;
      }

      return result;
    },
    { pending: 0, approved: 0, rejected: 0 }
  );

  const hasData = filteredAssignments.length > 0;

  return (
    <div className="container py-3">
      <div className="card shadow-sm p-3 mb-4 border-0 rounded-3">
        <h1 className="h4 mb-1">Assignment Monitoring</h1>
        <p className="text-muted mb-0">Monitor assignment submissions across students</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatsCard title="Pending" count={counts.pending} bgColor="warning" />
        </div>
        <div className="col-12 col-md-4">
          <StatsCard title="Approved" count={counts.approved} bgColor="success" />
        </div>
        <div className="col-12 col-md-4">
          <StatsCard title="Rejected" count={counts.rejected} bgColor="danger" />
        </div>
      </div>

      <div className="card shadow-sm p-3 mb-4 border-0 rounded-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6">
            <label className="form-label">Course Filter</label>
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

          <div className="col-12 col-md-6">
            <label className="form-label">Status Filter</label>
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-3 border-0 rounded-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 mb-0">Submission Details</h2>
          <span className="text-muted small">Showing {filteredAssignments.length} submission(s)</span>
        </div>

        {hasData ? (
          <DataTable
            rowKey="id"
            columns={[
              { key: "studentName", header: "Student Name" },
              { key: "title", header: "Assignment Title" },
              {
                key: "fileData",
                header: "Uploaded File",
                render: (assignment) => <FilePreview item={assignment} />,
              },
              { key: "submittedAt", header: "Submitted Date" },
              {
                key: "status",
                header: "Status",
                render: (assignment) => (
                  <span className={getStatusBadgeClass(assignment.status)}>{assignment.status}</span>
                ),
              },
            ]}
            data={filteredAssignments}
          />
        ) : (
          <div className="alert alert-info mb-0">No data available</div>
        )}
      </div>
    </div>
  );
}

