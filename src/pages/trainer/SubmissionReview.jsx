import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
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
    submittedAt: assignment.submittedAt || assignment.uploadedAt || "",
    status: assignment.status || "Pending",
    reviewComment: assignment.reviewComment || "",
    fileName: assignment.fileName || "",
    fileType: assignment.fileType || "",
    fileData: assignment.fileData || "",
  };
}

function normalizeProject(project) {
  return {
    ...project,
    submittedAt: project.submittedAt || project.uploadedAt || "",
    status: project.status || "Pending",
    reviewComment: project.reviewComment || "",
    fileName: project.fileName || "",
    fileType: project.fileType || "",
    fileData: project.fileData || "",
  };
}

// Simple helpers to check file types
function isImageFile(fileType) {
  var t = String(fileType || "").toLowerCase();
  return t.indexOf("image/") === 0;
}

function isPdfFile(fileType, fileName) {
  var t = String(fileType || "").toLowerCase();
  var n = String(fileName || "").toLowerCase();
  if (t === "application/pdf") {
    return true;
  }
  if (n.length > 4 && n.substr(n.length - 4) === ".pdf") {
    return true;
  }
  return false;
}

// Preview uploaded file: image, pdf or link
function FilePreview(props) {
  var item = props.item || {};

  if (!item.fileData) {
    return <span className="text-muted">No file uploaded</span>;
  }

  if (isImageFile(item.fileType)) {
    return (
      <div className="border rounded p-2 bg-light">
        <img
          src={item.fileData}
          alt={item.fileName || "Submission preview"}
          className="img-fluid rounded"
          style={{ maxHeight: 160, objectFit: "cover" }}
        />
      </div>
    );
  }

  if (isPdfFile(item.fileType, item.fileName)) {
    return (
      <a href={item.fileData} target="_blank" rel="noreferrer">
        Open PDF
      </a>
    );
  }

  return (
    <a href={item.fileData} target="_blank" rel="noreferrer">
      {item.fileName || "Open File"}
    </a>
  );
}

// Actions UI for reviewing a submission
function ReviewActions(props) {
  var item = props.item;
  var draftComment = props.draftComment;
  var onCommentChange = props.onCommentChange;
  var onReview = props.onReview;

  function handleTextChange(event) {
    onCommentChange(item.id, event.target.value);
  }

  function handleApprove() {
    onReview(item.id, "Approved");
  }

  function handleReject() {
    onReview(item.id, "Rejected");
  }

  return (
    <div className="d-flex flex-column gap-2">
      <textarea
        className="form-control"
        rows={3}
        value={draftComment}
        onChange={handleTextChange}
        placeholder="Add review comment"
      />
      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-success btn-sm" onClick={handleApprove}>
          Approve
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={handleReject}>
          Reject
        </button>
      </div>
    </div>
  );
}

export default function SubmissionReview() {
  var auth = useAuth();
  var user = auth.user;
  var [students, setStudents] = useState([]);
  var [assignments, setAssignments] = useState([]);
  var [projects, setProjects] = useState([]);
  var [commentDrafts, setCommentDrafts] = useState({});
  var [isLoaded, setIsLoaded] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(function () {
    var savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    var savedAssignments = JSON.parse(localStorage.getItem("lms-assignments")) || [];
    var savedProjects = JSON.parse(localStorage.getItem("lms-projects")) || [];

    if (Array.isArray(savedStudents)) {
      setStudents(savedStudents);
    } else {
      setStudents([]);
    }

    if (Array.isArray(savedAssignments)) {
      setAssignments(savedAssignments);
    } else {
      setAssignments([]);
    }

    if (Array.isArray(savedProjects)) {
      setProjects(savedProjects);
    } else {
      setProjects([]);
    }

    setIsLoaded(true);
  }, []);

  // Save assignments when they change after initial load
  useEffect(function () {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-assignments", JSON.stringify(assignments));
  }, [assignments, isLoaded]);

  // Save projects when they change after initial load
  useEffect(function () {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-projects", JSON.stringify(projects));
  }, [projects, isLoaded]);

  // Build list of student emails assigned to this trainer
  var trainerName = "";
  if (user && user.name) {
    trainerName = user.name;
  }

  var visibleStudentEmails = [];
  for (var si = 0; si < students.length; si++) {
    var s = students[si];
    if (s && s.trainerName === trainerName) {
      visibleStudentEmails.push(s.email);
    }
  }

  // Check whether a submission (assignment/project) should be visible to this trainer
  function isVisibleSubmission(item) {
    if (item && item.trainerName && item.trainerName === trainerName) {
      return true;
    }

    for (var k = 0; k < visibleStudentEmails.length; k++) {
      if (visibleStudentEmails[k] === item.studentEmail) {
        return true;
      }
    }

    return false;
  }

  // Prepare visible assignments and projects, normalized and sorted
  var visibleAssignments = [];
  for (var ai = 0; ai < assignments.length; ai++) {
    var a = assignments[ai];
    if (isVisibleSubmission(a)) {
      visibleAssignments.push(normalizeAssignment(a));
    }
  }

  visibleAssignments.sort(function (first, second) {
    return Number(second.id) - Number(first.id);
  });

  var visibleProjects = [];
  for (var pi = 0; pi < projects.length; pi++) {
    var p = projects[pi];
    if (isVisibleSubmission(p)) {
      visibleProjects.push(normalizeProject(p));
    }
  }

  visibleProjects.sort(function (first, second) {
    return Number(second.id) - Number(first.id);
  });

  // Update draft comment for a submission
  function updateDraftComment(submissionId, value) {
    setCommentDrafts(function (prev) {
      var next = {};
      for (var key in prev) {
        if (Object.prototype.hasOwnProperty.call(prev, key)) {
          next[key] = prev[key];
        }
      }
      next[submissionId] = value;
      return next;
    });
  }

  // Get the comment to use when saving a review: draft overrides stored comment
  function getReviewComment(item) {
    if (commentDrafts && commentDrafts[item.id] !== undefined) {
      return commentDrafts[item.id];
    }

    if (item && item.reviewComment) {
      return item.reviewComment;
    }

    return "";
  }

  // Update status and comment for an assignment
  function updateAssignmentReview(assignmentId, status) {
    var next = [];
    for (var i = 0; i < assignments.length; i++) {
      var assignment = assignments[i];
      if (assignment.id === assignmentId) {
        var comment = getReviewComment(assignment).trim();
        var updated = {
          id: assignment.id,
          studentName: assignment.studentName,
          studentEmail: assignment.studentEmail,
          courseTitle: assignment.courseTitle,
          title: assignment.title,
          submittedAt: assignment.submittedAt,
          fileName: assignment.fileName,
          fileType: assignment.fileType,
          fileData: assignment.fileData,
          status: status,
          reviewComment: comment,
        };
        next.push(updated);
      } else {
        next.push(assignment);
      }
    }
    setAssignments(next);
  }

  // Update status and comment for a project
  function updateProjectReview(projectId, status) {
    var next = [];
    for (var i = 0; i < projects.length; i++) {
      var project = projects[i];
      if (project.id === projectId) {
        var comment = getReviewComment(project).trim();
        var updated = {
          id: project.id,
          studentName: project.studentName,
          studentEmail: project.studentEmail,
          courseTitle: project.courseTitle,
          projectTitle: project.projectTitle,
          githubLink: project.githubLink,
          submittedAt: project.submittedAt,
          fileName: project.fileName,
          fileType: project.fileType,
          fileData: project.fileData,
          status: status,
          reviewComment: comment,
        };
        next.push(updated);
      } else {
        next.push(project);
      }
    }
    setProjects(next);
  }

  var noSubmissions = false;
  if (visibleAssignments.length === 0 && visibleProjects.length === 0) {
    noSubmissions = true;
  }

  // Render helper: status cell
  function renderStatusCellForAssignment(assignment) {
    return (
      <span className={getStatusBadgeClass(assignment.status)}>
        {assignment.status}
      </span>
    );
  }

  function renderStatusCellForProject(project) {
    return (
      <span className={getStatusBadgeClass(project.status)}>
        {project.status}
      </span>
    );
  }

  // Render helper: comment cell
  function renderCommentCellForAssignment(assignment) {
    if (assignment.reviewComment) {
      return assignment.reviewComment;
    }
    return <span className="text-muted">No comments yet</span>;
  }

  function renderCommentCellForProject(project) {
    if (project.reviewComment) {
      return project.reviewComment;
    }
    return <span className="text-muted">No comments yet</span>;
  }

  // Render helper: github link cell
  function renderGithubCell(project) {
    if (project && project.githubLink) {
      return (
        <a href={project.githubLink} target="_blank" rel="noreferrer">
          View Repository
        </a>
      );
    }
    return <span className="text-muted">No link</span>;
  }

  // No submissions element
  var noSubmissionsElement = null;
  if (noSubmissions) {
    noSubmissionsElement = (
      <div className="card shadow-sm p-4 mt-4 text-center">
        <p className="mb-0 text-muted">No submissions available</p>
      </div>
    );
  }

  // Assignment panel element
  var assignmentPanel = null;
  if (visibleAssignments.length === 0) {
    assignmentPanel = <p className="text-muted mb-0">No submissions available</p>;
  } else {
    assignmentPanel = (
      <DataTable
        rowKey="id"
        columns={[
          { key: "studentName", header: "Student Name" },
          { key: "studentEmail", header: "Email" },
          { key: "courseTitle", header: "Course" },
          { key: "title", header: "Title" },
          { key: "submittedAt", header: "Submitted At" },
          {
            key: "fileData",
            header: "Preview",
            render: function (assignment) {
              return <FilePreview item={assignment} />;
            },
          },
          {
            key: "status",
            header: "Status",
            render: renderStatusCellForAssignment,
          },
          {
            key: "reviewComment",
            header: "Comment",
            render: renderCommentCellForAssignment,
          },
        ]}
        data={visibleAssignments}
        renderActions={function (assignment) {
          return (
            <ReviewActions
              item={assignment}
              draftComment={getReviewComment(assignment)}
              onCommentChange={updateDraftComment}
              onReview={updateAssignmentReview}
            />
          );
        }}
      />
    );
  }

  // Project panel element
  var projectPanel = null;
  if (visibleProjects.length === 0) {
    projectPanel = <p className="text-muted mb-0">No submissions available</p>;
  } else {
    projectPanel = (
      <DataTable
        rowKey="id"
        columns={[
          { key: "studentName", header: "Student Name" },
          { key: "studentEmail", header: "Email" },
          { key: "courseTitle", header: "Course" },
          { key: "projectTitle", header: "Project Title" },
          { key: "githubLink", header: "GitHub", render: renderGithubCell },
          { key: "submittedAt", header: "Submitted At" },
          { key: "fileData", header: "Preview", render: function (project) { return <FilePreview item={project} />; } },
          { key: "status", header: "Status", render: renderStatusCellForProject },
          { key: "reviewComment", header: "Comment", render: renderCommentCellForProject },
        ]}
        data={visibleProjects}
        renderActions={function (project) {
          return (
            <ReviewActions
              item={project}
              draftComment={getReviewComment(project)}
              onCommentChange={updateDraftComment}
              onReview={updateProjectReview}
            />
          );
        }}
      />
    );
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-3 p-lg-4">
        <h1 className="h4 mb-1">Submission Review</h1>
        <p className="text-muted mb-0">Review assignment and project submissions from your assigned students.</p>
      </div>

      {noSubmissionsElement}

      <div className="card shadow-sm p-3 mt-4">
        <h2 className="h5 mb-3">Assignment Submissions</h2>
        {assignmentPanel}
      </div>

      <div className="card shadow-sm p-3 mt-4">
        <h2 className="h5 mb-3">Project Submissions</h2>
        {projectPanel}
      </div>
    </div>
  );
}

