import React, { useEffect, useState } from "react";
import StatsCard from "../../components/StatsCard";
import { useAuth } from "../../context/AuthContext";

const MODULE_WEIGHTS = {
  video: 40,
  mcq: 30,
  coding: 30,
};

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

function clampProgress(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function getModuleStatus(progress) {
  const normalizedProgress = clampProgress(progress);

  if (normalizedProgress >= 100) {
    return "Completed";
  }

  if (normalizedProgress > 0) {
    return "In Progress";
  }

  return "Not Started";
}

function normalizeProgressMap(moduleProgress) {
  if (Array.isArray(moduleProgress)) {
    return moduleProgress.reduce((result, item) => {
      if (item?.moduleId) {
        result[String(item.moduleId)] = clampProgress(item.progress);
      }

      return result;
    }, {});
  }

  if (moduleProgress && typeof moduleProgress === "object") {
    return Object.entries(moduleProgress).reduce((result, [moduleId, progress]) => {
      result[String(moduleId)] = clampProgress(progress);
      return result;
    }, {});
  }

  return {};
}

function normalizeModuleRecordMap(moduleRecords) {
  if (Array.isArray(moduleRecords)) {
    return moduleRecords.reduce((result, item) => {
      if (!item?.moduleId) {
        return result;
      }

      result[String(item.moduleId)] = {
        moduleTitle: item.moduleTitle || "",
        moduleProgress: clampProgress(item.moduleProgress),
        moduleMarks: clampProgress(item.moduleMarks),
        moduleStatus: item.moduleStatus || getModuleStatus(item.moduleProgress),
      };

      return result;
    }, {});
  }

  if (moduleRecords && typeof moduleRecords === "object") {
    return Object.entries(moduleRecords).reduce((result, [moduleId, value]) => {
      result[String(moduleId)] = {
        moduleTitle: value?.moduleTitle || "",
        moduleProgress: clampProgress(value?.moduleProgress),
        moduleMarks: clampProgress(value?.moduleMarks),
        moduleStatus: value?.moduleStatus || getModuleStatus(value?.moduleProgress),
      };

      return result;
    }, {});
  }

  return {};
}

function normalizeCourse(course) {
  const modules = Array.isArray(course?.modules)
    ? course.modules
        .map((module, index) => ({
          id: module?.id,
          moduleTitle: module?.moduleTitle || module?.title || `Module ${index + 1}`,
          moduleOrder: Number(module?.moduleOrder) || index + 1,
        }))
        .sort((first, second) => first.moduleOrder - second.moduleOrder)
    : [];

  return {
    ...course,
    modules,
  };
}

function normalizePercentage(result) {
  if (!result || typeof result !== "object") {
    return 0;
  }

  if (result.percentage !== undefined && result.percentage !== null) {
    return clampProgress(result.percentage);
  }

  const score = Number(result.score) || 0;
  const totalQuestions = Number(result.totalQuestions) || 0;

  if (totalQuestions <= 0) {
    return 0;
  }

  return clampProgress((score / totalQuestions) * 100);
}

function getMcqResultStatus(result) {
  if (result?.resultStatus) {
    return String(result.resultStatus);
  }

  return normalizePercentage(result) >= 80 ? "Passed" : "Retry Required";
}

function getCodingResultStatus(submission) {
  if (submission?.resultStatus) {
    return String(submission.resultStatus);
  }

  if (String(submission?.status || "").toLowerCase() === "pending") {
    return "Pending Review";
  }

  return clampProgress(submission?.score) >= 80 ? "Passed" : "Retry Required";
}

function getLatestTimestamp(record) {
  const submittedAt = Date.parse(record?.submittedAt || "");

  if (!Number.isNaN(submittedAt)) {
    return submittedAt;
  }

  return Number(record?.id) || 0;
}

function getLatestRecord(records) {
  if (!records.length) {
    return null;
  }

  return [...records].sort((first, second) => {
    return getLatestTimestamp(second) - getLatestTimestamp(first);
  })[0];
}

function getLinkedModuleId(record, modules, assignedCourse) {
  const explicitModuleId = record?.moduleId;

  if (explicitModuleId !== undefined && explicitModuleId !== null && explicitModuleId !== "") {
    return String(explicitModuleId);
  }

  const courseMatches =
    String(record?.courseTitle || "").trim().toLowerCase() ===
    String(assignedCourse || "").trim().toLowerCase();

  if (courseMatches && modules.length === 1) {
    return String(modules[0].id);
  }

  return "";
}

function buildModuleRecordMap({
  modules,
  assignedCourse,
  videoProgressMap,
  legacyModuleRecords,
  mcqResults,
  codingSubmissions,
  studentEmail,
}) {
  const scopedMcqResults = (Array.isArray(mcqResults) ? mcqResults : []).filter((result) => {
    return String(result?.studentEmail || "").trim().toLowerCase() ===
      String(studentEmail || "").trim().toLowerCase();
  });

  const scopedCodingSubmissions = (Array.isArray(codingSubmissions) ? codingSubmissions : []).filter(
    (submission) => {
      return String(submission?.studentEmail || "").trim().toLowerCase() ===
        String(studentEmail || "").trim().toLowerCase();
    }
  );

  return modules.reduce((result, module) => {
    const moduleId = String(module.id);
    const legacyRecord = legacyModuleRecords[moduleId] || {};
    const videoProgress = clampProgress(
      videoProgressMap[moduleId] ?? legacyRecord.moduleProgress ?? 0
    );

    const latestMcqResult = getLatestRecord(
      scopedMcqResults.filter((record) => {
        return getLinkedModuleId(record, modules, assignedCourse) === moduleId;
      })
    );

    const latestCodingSubmission = getLatestRecord(
      scopedCodingSubmissions.filter((record) => {
        return getLinkedModuleId(record, modules, assignedCourse) === moduleId;
      })
    );

    const mcqPercentage = normalizePercentage(latestMcqResult);
    const codingScore = clampProgress(latestCodingSubmission?.score || 0);
    const mcqResultStatus = latestMcqResult ? getMcqResultStatus(latestMcqResult) : "Not Started";
    const codingResultStatus = latestCodingSubmission
      ? getCodingResultStatus(latestCodingSubmission)
      : "Not Started";
    const mcqCompletion = mcqResultStatus === "Passed" ? 100 : 0;
    const codingCompletion = codingResultStatus === "Passed" ? 100 : 0;

    const moduleProgress = clampProgress(
      (videoProgress * MODULE_WEIGHTS.video) / 100 +
        (mcqCompletion * MODULE_WEIGHTS.mcq) / 100 +
        (codingCompletion * MODULE_WEIGHTS.coding) / 100
    );

    const moduleMarks = clampProgress(
      (videoProgress * MODULE_WEIGHTS.video) / 100 +
        (mcqPercentage * MODULE_WEIGHTS.mcq) / 100 +
        (codingScore * MODULE_WEIGHTS.coding) / 100
    );

    result[moduleId] = {
      moduleTitle: module.moduleTitle,
      moduleProgress,
      moduleMarks,
      moduleStatus: getModuleStatus(moduleProgress),
    };

    return result;
  }, {});
}

export default function StudentProgress() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [selectedBatch, setSelectedBatch] = useState("All Batches");

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

  const visibleStudents = Array.isArray(students)
    ? students.filter((student) => {
        if ((user?.role || "").toLowerCase() === "trainer") {
          return String(student?.trainerName || "").trim().toLowerCase() ===
            String(user?.name || "").trim().toLowerCase();
        }

        return true;
      })
    : [];

  const moduleRows = visibleStudents.flatMap((student) => {
    const foundCourse = courses.find((course) => {
      return (
        String(course?.title || "").trim().toLowerCase() ===
        String(student?.assignedCourse || "").trim().toLowerCase()
      );
    });

    const normalizedCourse = foundCourse ? normalizeCourse(foundCourse) : null;
    const modules = normalizedCourse?.modules || [];
    const videoProgressMap = normalizeProgressMap(student?.moduleProgress);
    const legacyModuleRecords = normalizeModuleRecordMap(
      student?.moduleRecords || student?.moduleDetails
    );
    const moduleRecordMap = buildModuleRecordMap({
      modules,
      assignedCourse: student?.assignedCourse,
      videoProgressMap,
      legacyModuleRecords,
      mcqResults,
      codingSubmissions,
      studentEmail: student?.email,
    });

    return modules.map((module) => {
      const moduleId = String(module.id);
      const record = moduleRecordMap[moduleId] || {
        moduleTitle: module.moduleTitle,
        moduleProgress: 0,
        moduleMarks: 0,
        moduleStatus: "Not Started",
      };

      return {
        id: `${student.id}-${moduleId}`,
        studentId: student.id,
        name: student.name || "-",
        email: student.email || "",
        course: student.assignedCourse || normalizedCourse?.title || "Not Assigned",
        batch: getStudentBatch(student) || "-",
        trainerName: student.trainerName || "-",
        module: record.moduleTitle || module.moduleTitle,
        moduleProgress: record.moduleProgress,
        moduleMarks: record.moduleMarks,
        moduleStatus: record.moduleStatus,
      };
    });
  });

  const courseOptionSet = new Set();
  moduleRows.forEach((row) => {
    if (row.course && row.course !== "Not Assigned") {
      courseOptionSet.add(row.course);
    }
  });
  const courseOptions = [
    "All Courses",
    ...Array.from(courseOptionSet).sort((first, second) => first.localeCompare(second)),
  ];

  const batchOptionSet = new Set();
  moduleRows.forEach((row) => {
    if (row.batch && row.batch !== "-") {
      batchOptionSet.add(row.batch);
    }
  });
  const batchOptions = [
    "All Batches",
    ...Array.from(batchOptionSet).sort((first, second) => first.localeCompare(second)),
  ];

  useEffect(() => {
    if (selectedBatch === "All Batches") {
      return;
    }

    const exists = batchOptions.some((option) => normalizeValue(option) === normalizeValue(selectedBatch));
    if (!exists) {
      setSelectedBatch("All Batches");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchOptions.join("|"), selectedBatch]);

  const courseFilter = String(selectedCourse || "All Courses").trim().toLowerCase();
  const batchFilter = String(selectedBatch || "All Batches").trim().toLowerCase();
  const filteredRows = moduleRows.filter((row) => {
    const courseMatches =
      courseFilter === "all courses" ||
      String(row.course || "").trim().toLowerCase() === courseFilter;

    const batchMatches =
      batchFilter === "all batches" ||
      normalizeValue(row.batch) === batchFilter;

    return courseMatches && batchMatches;
  });

  const summaryCounts = filteredRows.reduce(
    (result, row) => {
      if (row.moduleStatus === "Completed") {
        result.completed += 1;
      } else if (row.moduleStatus === "In Progress") {
        result.inProgress += 1;
      } else {
        result.notStarted += 1;
      }

      return result;
    },
    { completed: 0, inProgress: 0, notStarted: 0 }
  );

  const hasRows = filteredRows.length > 0;

  return (
    <div className="container py-3">
      <div className="card shadow-sm p-3 mb-4 border-0 rounded-3">
        <h1 className="h4 mb-1">Student Progress Dashboard</h1>
        <p className="text-muted mb-0">
          Track module-wise marks, progress, and completion across assigned students
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatsCard title="Completed" count={summaryCounts.completed} bgColor="success" />
        </div>
        <div className="col-12 col-md-4">
          <StatsCard title="In Progress" count={summaryCounts.inProgress} bgColor="warning" />
        </div>
        <div className="col-12 col-md-4">
          <StatsCard title="Not Started" count={summaryCounts.notStarted} bgColor="secondary" />
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
            <label className="form-label">Batch Filter</label>
            <select
              className="form-select"
              value={selectedBatch}
              onChange={(event) => setSelectedBatch(event.target.value)}
            >
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card shadow-sm p-3 border-0 rounded-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h2 className="h5 mb-0">Module-Wise Student Progress</h2>
          <span className="text-muted small">Showing {filteredRows.length} module record(s)</span>
        </div>

        {hasRows ? (
          <div className="table-responsive mt-4">
            <table className="table table-bordered table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Batch</th>
                  <th>Module</th>
                  <th>Progress</th>
                  <th>Marks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.course}</td>
                    <td>{row.batch}</td>
                    <td>{row.module}</td>
                    <td>
                      <div className="d-grid gap-2">
                        <div className="small text-muted">{row.moduleProgress}%</div>
                        <div className="progress">
                          <div
                            className={`progress-bar ${
                              row.moduleStatus === "Completed"
                                ? "bg-success"
                                : row.moduleStatus === "In Progress"
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                            }`}
                            style={{ width: `${row.moduleProgress}%` }}
                          >
                            {row.moduleProgress}%
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{row.moduleMarks} / 100</td>
                    <td>
                      <span className={getStatusBadgeClass(row.moduleStatus)}>
                        {row.moduleStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!hasRows ? <div className="alert alert-info mb-0">No data available</div> : null}
      </div>
    </div>
  );
}

