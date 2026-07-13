import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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

function prepareAssignedStudent(student, course, trainerFallback) {
  const modules = normalizeModules(course);
  const isSameCourse = normalizeText(student.assignedCourse) === normalizeText(course.title);
  const nextModuleProgress = {};
  const nextModuleRecords = {};
  let totalProgress = 0;

  modules.forEach((module) => {
    const savedProgress = isSameCourse ? clampProgress(student?.moduleProgress?.[module.id]) : 0;

    nextModuleProgress[module.id] = savedProgress;
    nextModuleRecords[module.id] = {
      moduleTitle: module.moduleTitle,
      moduleProgress: savedProgress,
      moduleMarks: Math.round((savedProgress * 40) / 100),
      moduleStatus: getProgressStatus(savedProgress),
    };
    totalProgress += savedProgress;
  });

  const courseProgress = modules.length ? clampProgress(totalProgress / modules.length) : 0;
  let courseStatus = getProgressStatus(courseProgress);

  if (modules.length > 0 && courseStatus === "Not Started") {
    courseStatus = "In Progress";
  }

  return {
    ...student,
    trainerName:
      String(course.trainerName || student.trainerName || trainerFallback?.name || "").trim(),
    trainerEmail: normalizeEmail(
      course.trainerEmail || student.trainerEmail || trainerFallback?.email || ""
    ),
    assignedCourse: course.title,
    courseProgress,
    courseStatus,
    moduleProgress: nextModuleProgress,
    moduleRecords: nextModuleRecords,
  };
}

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

export default function AssignCourse() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
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

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedTrainers = JSON.parse(localStorage.getItem("lms-trainers")) || [];

    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setTrainers(Array.isArray(savedTrainers) ? savedTrainers : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-students", JSON.stringify(students));
  }, [students, isLoaded]);

  const userName = normalizeText(user?.name);
  const userEmail = normalizeEmail(user?.email);

  const matchesTrainer = (record) => {
    const recordTrainerEmail = normalizeEmail(record?.trainerEmail);
    const recordTrainerName = normalizeText(record?.trainerName);

    if (userEmail && recordTrainerEmail) {
      return recordTrainerEmail === userEmail;
    }

    if (userName && recordTrainerName) {
      return recordTrainerName === userName;
    }

    return false;
  };

  const trainerRecord = (Array.isArray(trainers) ? trainers : []).find((trainer) => {
    const trainerName = normalizeText(trainer?.name);
    const trainerEmail = normalizeEmail(trainer?.email);

    if (userEmail && trainerEmail) {
      return trainerEmail === userEmail;
    }

    if (userName && trainerName) {
      return trainerName === userName;
    }

    return false;
  });

  const assignedStudentEmails = new Set(
    (Array.isArray(trainerRecord?.assignedStudents) ? trainerRecord.assignedStudents : [])
      .map((value) => normalizeEmail(value))
      .filter(Boolean)
  );

  const createdCourseTitles = new Set(
    (Array.isArray(trainerRecord?.createdCourses) ? trainerRecord.createdCourses : [])
      .map((value) => normalizeText(value))
      .filter(Boolean)
  );

  const visibleStudents = (Array.isArray(students) ? students : []).filter((student) => {
    if (matchesTrainer(student)) {
      return true;
    }

    const email = normalizeEmail(student?.email);
    if (email && assignedStudentEmails.has(email)) {
      return true;
    }

    const hasTrainerName = Boolean(normalizeText(student?.trainerName));
    const hasTrainerEmail = Boolean(normalizeEmail(student?.trainerEmail));

    return !hasTrainerName && !hasTrainerEmail;
  });

  const visibleCourses = (Array.isArray(courses) ? courses : []).filter((course) => {
    const status = normalizeText(course?.status);
    if (status === "rejected") {
      return false;
    }

    if (matchesTrainer(course)) {
      return true;
    }

    const title = normalizeText(course?.title);
    return title ? createdCourseTitles.has(title) : false;
  });

  const assignedStudents = visibleStudents.filter((student) => student.assignedCourse);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedStudentId || !selectedCourseTitle) {
      return;
    }

    const selectedCourse = visibleCourses.find(
      (course) => normalizeText(course.title) === normalizeText(selectedCourseTitle)
    );

    if (!selectedCourse) {
      showMessage("Please select a course.", "danger");
      return;
    }

    setStudents(
      students.map((student) =>
        String(student.id) === String(selectedStudentId)
          ? prepareAssignedStudent(student, selectedCourse, {
              name: user?.name || "",
              email: user?.email || "",
            })
          : student
      )
    );

    setSelectedStudentId("");
    setSelectedCourseTitle("");
    showMessage("Course assigned successfully.", "success");
  };

  const noData = visibleStudents.length === 0 || visibleCourses.length === 0;

  return (
    <div className="container mt-4">
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card p-3 shadow-sm">
            <h1 className="h4 mb-3">Assign Course</h1>

            <AlertMessage message={message} type={type} />

            {noData ? (
              <div className="alert alert-info mb-0">No data available</div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Select Student</label>
                  <select
                    className="form-select"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    required
                  >
                    <option value="">-- Select Student --</option>
                    {visibleStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Select Course</label>
                  <select
                    className="form-select"
                    value={selectedCourseTitle}
                    onChange={(event) => setSelectedCourseTitle(event.target.value)}
                    required
                  >
                    <option value="">-- Select Course --</option>
                    {visibleCourses.map((course) => (
                      <option key={course.id} value={course.title}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <CustomButton text="Assign" onClick={handleSubmit} />
              </form>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card p-3 shadow-sm">
            <h2 className="h5 mb-3">Assigned Courses</h2>
            <DataTable
              rowKey="id"
              columns={[
                { key: "name", header: "Student Name" },
                { key: "assignedCourse", header: "Course" },
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
              data={assignedStudents}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


