import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
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
  const value = String(status || "Pending").trim().toLowerCase();

  if (value === "approved") {
    return "Approved";
  }

  if (value === "rejected") {
    return "Rejected";
  }

  return "Pending";
}

function normalizeCourse(course) {
  return {
    ...course,
    status: normalizeCourseStatus(course?.status),
  };
}

export default function CourseApproval() {
  const [courses, setCourses] = React.useState([]);
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

  const normalizedCourses = Array.isArray(courses) ? courses.map(normalizeCourse) : [];

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      localStorage.setItem("lms-courses", JSON.stringify(courses));
    }
  }, [courses]);

  const handleStatus = (id, newStatus) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id
          ? { ...course, status: normalizeCourseStatus(newStatus) }
          : normalizeCourse(course)
      )
    );

    if (normalizeCourseStatus(newStatus) === "Approved") {
      showMessage("Course approved successfully.", "success");
      return;
    }

    if (normalizeCourseStatus(newStatus) === "Rejected") {
      showMessage("Course rejected successfully.", "success");
      return;
    }

    showMessage("Course status updated.", "success");
  };

  return (
    <div className="container mt-4">
      <div className="card p-3 shadow-sm">
        <h1 className="h4 mb-3">Course Approval</h1>

        <AlertMessage message={message} type={type} />

        <DataTable
          rowKey="id"
          columns={[
            { key: "title", header: "Title" },
            { key: "trainerName", header: "Trainer" },
            { key: "syllabus", header: "Syllabus" },
            {
              key: "status",
              header: "Status",
              render: (course) => (
                <span className={getStatusBadgeClass(course.status)}>
                  {normalizeCourseStatus(course.status)}
                </span>
              ),
            },
          ]}
          data={normalizedCourses}
          renderActions={(course) => (
            <div className="d-flex gap-2">
              <CustomButton
                text="Approve"
                onClick={() => handleStatus(course.id, "Approved")}
              />
              <CustomButton
                text="Reject"
                onClick={() => handleStatus(course.id, "Rejected")}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}


