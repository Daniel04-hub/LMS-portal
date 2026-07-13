import React, { useEffect, useState } from "react";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";
import FormInput from "../../components/FormInput";
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

function normalizeCourse(course) {
  return {
    ...course,
    modules: Array.isArray(course.modules) ? course.modules : [],
  };
}

export default function CourseCreation() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
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
  const [title, setTitle] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];

    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-courses", JSON.stringify(courses));
  }, [courses, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-students", JSON.stringify(students));
  }, [students, isLoaded]);

  const visibleCourses = courses
    .filter((course) => course.trainerName === (user?.name || ""))
    .map(normalizeCourse);

  const resetForm = () => {
    setTitle("");
    setSyllabus("");
    setEditingCourseId(null);
  };

  const handleEdit = (course) => {
    setTitle(course.title || "");
    setSyllabus(course.syllabus || "");
    setEditingCourseId(course.id);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedSyllabus = syllabus.trim();

    if (!trimmedTitle || !trimmedSyllabus) {
      showMessage("Please fill in all required fields.", "danger");
      return;
    }

    const duplicateCourse = visibleCourses.find(
      (course) =>
        course.title.toLowerCase() === trimmedTitle.toLowerCase() &&
        course.id !== editingCourseId
    );

    if (duplicateCourse) {
      showMessage("Course title already exists.", "danger");
      return;
    }

    if (editingCourseId) {
      const previousCourse = courses.find((course) => course.id === editingCourseId);

      const updatedCourses = courses.map((course) =>
          course.id === editingCourseId
            ? {
                ...normalizeCourse(course),
                title: trimmedTitle,
                syllabus: trimmedSyllabus,
              }
            : normalizeCourse(course)
        );

      setCourses(updatedCourses);

      if (previousCourse && previousCourse.title !== trimmedTitle) {
        setStudents(
          students.map((student) =>
            student.assignedCourse === previousCourse.title
              ? {
                  ...student,
                  assignedCourse: trimmedTitle,
              }
              : student
          )
        );
      }

      showMessage("Course updated successfully.", "success");
      resetForm();
      return;
    }

    const newCourse = {
      id: Date.now(),
      title: trimmedTitle,
      syllabus: trimmedSyllabus,
      trainerName: user?.name || "",
      status: "pending",
      modules: [],
    };

    setCourses([...courses.map(normalizeCourse), newCourse]);
    resetForm();
    showMessage("Course added successfully.", "success");
  };

  const tableData = visibleCourses.map((course) => ({
    ...course,
    trainer: course.trainerName,
    moduleCount: course.modules.length,
    status: (
      <span className={getStatusBadgeClass(course.status)}>
        {course.status}
      </span>
    ),
  }));

  return (
    <div className="container mt-4">
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <h1 className="h4 mb-3">
              {editingCourseId ? "Edit Course" : "Course Creation"}
            </h1>

            {message ? (
              <div className={`alert alert-${type}`} role="alert">
                {message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Course Title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter course title"
                name="title"
                required
              />

              <div className="mb-3">
                <label className="form-label">Syllabus</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={syllabus}
                  onChange={(event) => setSyllabus(event.target.value)}
                  placeholder="Enter syllabus"
                  required
                />
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CustomButton
                  text={editingCourseId ? "Update Course" : "Add Course"}
                  type="submit"
                  onClick={handleSubmit}
                />
                {editingCourseId ? (
                  <CustomButton text="Cancel" onClick={resetForm} />
                ) : null}
              </div>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0 rounded-3 p-3">
            <h2 className="h5 mb-3">Created Courses</h2>

            <DataTable
              rowKey="id"
              columns={[
                { key: "title", header: "Title" },
                { key: "trainer", header: "Trainer" },
                { key: "moduleCount", header: "Modules" },
                { key: "status", header: "Status" },
              ]}
              data={tableData}
              renderActions={(course) => (
                <CustomButton text="Edit" onClick={() => handleEdit(course)} />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}



