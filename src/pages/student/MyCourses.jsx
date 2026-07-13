import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const VIDEO_WEIGHT = 40;
const MCQ_WEIGHT = 30;
const CODING_WEIGHT = 30;

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function findBestStudentByEmail(students, email) {
  var normalizedEmail = normalizeText(email);
  var matches = (Array.isArray(students) ? students : []).filter(function (student) {
    return normalizeText(student?.email) === normalizedEmail;
  });

  if (!matches.length) {
    return null;
  }

  var withCourse = matches.find(function (student) {
    return String(student?.assignedCourse || "").trim();
  });

  if (withCourse) {
    return withCourse;
  }

  var withTrainer = matches.find(function (student) {
    return String(student?.trainerName || "").trim();
  });

  if (withTrainer) {
    return withTrainer;
  }

  return matches[matches.length - 1];
}

function getBadge(status) {
  var value = "";

  if (status) {
    value = (status + "").toLowerCase();
  }

  if (value === "completed" || value === "approved" || value === "active") {
    return "badge bg-success";
  }

  if (value === "in progress" || value === "pending" || value === "reviewed") {
    return "badge bg-warning text-dark";
  }

  if (value === "not started" || value === "submitted") {
    return "badge bg-secondary";
  }

  return "badge bg-danger";
}

function clamp(value) {
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
    .map(function (module, index) {
      return {
        id: "" + (module?.id ?? ""),
        moduleTitle: module?.moduleTitle || module?.title || "Module " + (index + 1),
        moduleDescription: module?.moduleDescription || "",
        videoUrl: module?.videoUrl || "",
        duration: Number(module?.duration) || 0,
        moduleOrder: Number(module?.moduleOrder) || index + 1,
      };
    })
    .filter(function (module) {
      return module.id;
    })
    .sort(function (first, second) {
      return first.moduleOrder - second.moduleOrder;
    });
}

function getLatestTimestamp(record) {
  var parsedDate = Date.parse(record?.submittedAt || "");

  if (!Number.isNaN(parsedDate)) {
    return parsedDate;
  }

  return Number(record?.id) || 0;
}

function getLatestRecord(records) {
  if (!records.length) {
    return null;
  }

  return records.slice().sort(function (first, second) {
    return getLatestTimestamp(second) - getLatestTimestamp(first);
  })[0];
}

function getLinkedModuleId(record, modules, courseTitle) {
  if (record?.moduleId !== undefined && record?.moduleId !== null && record?.moduleId !== "") {
    return "" + record.moduleId;
  }

  if (
    String(record?.courseTitle || "").trim().toLowerCase() ===
      String(courseTitle || "").trim().toLowerCase() &&
    modules.length === 1
  ) {
    return "" + modules[0].id;
  }

  return "";
}

function getMcqPercentage(result) {
  if (!result) {
    return 0;
  }

  if (result.percentage !== undefined && result.percentage !== null && result.percentage !== "") {
    return clamp(result.percentage);
  }

  var score = Number(result.score) || 0;
  var totalQuestions = Number(result.totalQuestions) || 0;

  if (totalQuestions <= 0) {
    return 0;
  }

  return clamp((score / totalQuestions) * 100);
}

function getCodingResultStatus(submission) {
  if (submission?.resultStatus) {
    return String(submission.resultStatus);
  }

  if (String(submission?.status || "").toLowerCase() === "pending") {
    return "Pending Review";
  }

  return clamp(submission?.score) >= 80 ? "Passed" : "Retry Required";
}

function calculateStudentCourseProgress(student, courses, mcqResults, codingSubmissions) {
  var assignedCourse = String(student?.assignedCourse || "").trim().toLowerCase();
  var course = null;

  (Array.isArray(courses) ? courses : []).forEach(function (item) {
    var title = String(item?.title || "").trim().toLowerCase();
    var status = String(item?.status || "").trim().toLowerCase();

    if (title === assignedCourse && status !== "rejected") {
      course = item;
    }
  });

  var modules = normalizeModules(course);
  var progressMap =
    student?.moduleProgress && typeof student.moduleProgress === "object"
      ? student.moduleProgress
      : {};
  var moduleRecords = {};
  var totalProgress = 0;

  modules.forEach(function (module) {
    var moduleId = module.id;
    var videoProgress = clamp(progressMap[moduleId] || 0);
    var latestMcq = getLatestRecord(
      (Array.isArray(mcqResults) ? mcqResults : []).filter(function (item) {
        return (
          String(item?.studentEmail || "").trim().toLowerCase() ===
            String(student?.email || "").trim().toLowerCase() &&
          String(item?.courseTitle || "").trim().toLowerCase() === assignedCourse &&
          getLinkedModuleId(item, modules, student?.assignedCourse) === moduleId
        );
      })
    );
    var latestCoding = getLatestRecord(
      (Array.isArray(codingSubmissions) ? codingSubmissions : []).filter(function (item) {
        return (
          String(item?.studentEmail || "").trim().toLowerCase() ===
            String(student?.email || "").trim().toLowerCase() &&
          String(item?.courseTitle || "").trim().toLowerCase() === assignedCourse &&
          getLinkedModuleId(item, modules, student?.assignedCourse) === moduleId
        );
      })
    );
    var mcqPercentage = getMcqPercentage(latestMcq);
    var codingScore = clamp(latestCoding?.score || 0);
    var codingPassed = getCodingResultStatus(latestCoding) === "Passed";
    var moduleProgress = clamp(
      (videoProgress * VIDEO_WEIGHT) / 100 +
        (mcqPercentage >= 80 ? MCQ_WEIGHT : 0) +
        (codingPassed ? CODING_WEIGHT : 0)
    );
    var moduleMarks = clamp(
      (videoProgress * VIDEO_WEIGHT) / 100 +
        (mcqPercentage * MCQ_WEIGHT) / 100 +
        (codingScore * CODING_WEIGHT) / 100
    );

    moduleRecords[moduleId] = {
      moduleTitle: module.moduleTitle,
      moduleProgress: moduleProgress,
      moduleMarks: moduleMarks,
      moduleStatus: getProgressStatus(moduleProgress),
      mcqPercentage: mcqPercentage,
      codingScore: codingScore,
    };
    totalProgress += moduleProgress;
  });

  var courseProgress = modules.length ? clamp(totalProgress / modules.length) : 0;

  return {
    course: course,
    modules: modules,
    progressMap: progressMap,
    moduleRecords: moduleRecords,
    courseProgress: courseProgress,
    courseStatus: getProgressStatus(courseProgress),
  };
}

function getYoutubeEmbed(url, autoPlay) {
  if (!url) {
    return "";
  }

  try {
    var parsed = new URL(url);
    var host = parsed.hostname.replace("www.", "");

    if (host === "youtu.be") {
      var parts = parsed.pathname.split("/").filter(function (item) {
        return item;
      });

      if (parts[0]) {
        var base = "https://www.youtube.com/embed/" + parts[0];
        return autoPlay ? base + "?autoplay=1&mute=1" : base;
      }

      return "";
    }

    if (host.indexOf("youtube.com") !== -1) {
      var id = "";

      if (parsed.pathname && parsed.pathname.indexOf("/embed/") === 0) {
        id = parsed.pathname.replace("/embed/", "").split("/")[0];
      } else if (parsed.pathname && parsed.pathname.indexOf("/shorts/") === 0) {
        id = parsed.pathname.replace("/shorts/", "").split("/")[0];
      } else {
        id = parsed.searchParams.get("v") || "";
      }

      if (id) {
        var base = "https://www.youtube.com/embed/" + id;
        return autoPlay ? base + "?autoplay=1&mute=1" : base;
      }

      return "";
    }
  } catch (error) {
    return "";
  }

  return "";
}

export default function MyCourses() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [currentVideoProgress, setCurrentVideoProgress] = useState(0);
  const [furthestWatchedTime, setFurthestWatchedTime] = useState(0);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);
  const [navMessage, setNavMessage] = useState("");
  const [autoPlayVideo, setAutoPlayVideo] = useState(false);
  const [youtubeSrc, setYoutubeSrc] = useState("");
  const [videoLoadError, setVideoLoadError] = useState(false);
  const videoRef = useRef(null);

  const skipBufferSeconds = 2;

  function loadData() {
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
  }

  useEffect(function () {
    loadData();
  }, []);

  useEffect(
    function () {
      function handleStorage(event) {
        if (
          !event.key ||
          event.key === "lms-students" ||
          event.key === "lms-courses" ||
          event.key === "lms-mcq-results" ||
          event.key === "lms-coding-submissions"
        ) {
          loadData();
        }
      }

      window.addEventListener("storage", handleStorage);
      window.addEventListener("focus", loadData);

      return function () {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("focus", loadData);
      };
    },
    []
  );

  var userEmail = "";
  var student = null;
  var course = null;
  var modules = [];
  var progressMap = {};
  var moduleRecords = {};
  var unlockedModuleIds = [];
  var selectedModule = null;
  var selectedRecord = null;
  var isYoutubeVideo = false;
  var youtubeEmbedUrl = "";
  var courseProgress = 0;
  var courseStatus = "Not Started";

  if (user && user.email) {
    userEmail = user.email;
  }

  student = findBestStudentByEmail(students, userEmail);

  var progressData = calculateStudentCourseProgress(
    student,
    courses,
    mcqResults,
    codingSubmissions
  );

  course = progressData.course;
  modules = progressData.modules;
  progressMap = progressData.progressMap;
  moduleRecords = progressData.moduleRecords;
  courseProgress = progressData.courseProgress;
  courseStatus = progressData.courseStatus;

  // unlock modules
  modules.forEach(function (module, index) {
    if (index === 0) {
      unlockedModuleIds.push(module.id);
      return;
    }

    var previousModule = modules[index - 1];
    var previousProgress = clamp(progressMap[previousModule.id]);

    if (previousProgress >= 80) {
      unlockedModuleIds.push(module.id);
    }
  });

  modules.forEach(function (item) {
    if (item.id === (selectedModuleId + "")) {
      selectedModule = item;
    }
  });

  if (selectedModule) {
    selectedRecord = moduleRecords[selectedModule.id] || null;
  }

  if (selectedModule && selectedModule.videoUrl) {
    if (
      selectedModule.videoUrl.indexOf("youtube.com") !== -1 ||
      selectedModule.videoUrl.indexOf("youtu.be") !== -1
    ) {
      isYoutubeVideo = true;
    }
  }

  youtubeEmbedUrl = youtubeSrc || getYoutubeEmbed(selectedModule ? selectedModule.videoUrl : "", false);

  useEffect(
    function () {
      setVideoLoadError(false);

      if (!selectedModule || !selectedModule.videoUrl) {
        setYoutubeSrc("");
        return;
      }

      if (isYoutubeVideo) {
        setYoutubeSrc(getYoutubeEmbed(selectedModule.videoUrl, autoPlayVideo));

        if (autoPlayVideo) {
          setAutoPlayVideo(false);
        }

        return;
      }

      setYoutubeSrc("");

      if (autoPlayVideo && videoRef.current && typeof videoRef.current.play === "function") {
        videoRef.current.play().catch(function () {});
        setAutoPlayVideo(false);
      }
    },
    [selectedModuleId, isYoutubeVideo, autoPlayVideo]
  );

  useEffect(
    function () {
      if (!navMessage) {
        return;
      }

      var timer = setTimeout(function () {
        setNavMessage("");
      }, 2000);

      return function () {
        clearTimeout(timer);
      };
    },
    [navMessage]
  );

  useEffect(
    function () {
      if (!modules.length) {
        setSelectedModuleId("");
        return;
      }

      var isCurrentUnlocked = false;

      unlockedModuleIds.forEach(function (item) {
        if (item === (selectedModuleId + "")) {
          isCurrentUnlocked = true;
        }
      });

      if (isCurrentUnlocked) {
        return;
      }

      setSelectedModuleId(unlockedModuleIds[0] || "");
    },
    [selectedModuleId, modules.length, unlockedModuleIds.join(",")]
  );

  function getNextModuleId() {
    if (!selectedModule) {
      return "";
    }

    var index = -1;

    modules.forEach(function (module, i) {
      if (module.id === selectedModule.id) {
        index = i;
      }
    });

    if (index < 0) {
      return "";
    }

    var next = modules[index + 1];
    return next && next.id ? next.id : "";
  }

  function handleStartLearning() {
    if (!modules.length) {
      return;
    }

    var firstUnlocked = unlockedModuleIds[0] || modules[0].id;
    if (firstUnlocked) {
      setAutoPlayVideo(true);
      setSelectedModuleId(firstUnlocked);
    }
  }

  function handleNextModule() {
    if (!selectedModule) {
      handleStartLearning();
      return;
    }

    var nextModuleId = getNextModuleId();

    if (!nextModuleId) {
      setNavMessage("You are already on the last module.");
      return;
    }

    var currentProgress = clamp(progressMap[selectedModule.id] || 0);

    if (currentProgress < 80) {
      setNavMessage("Complete at least 80% of this module to unlock the next module.");
      return;
    }

    setAutoPlayVideo(true);
    setSelectedModuleId(nextModuleId);
  }

  useEffect(
    function () {
      if (!student || !modules.length) {
        return;
      }

      var nextStudents = students.map(function (item) {
        if (item.id !== student.id) {
          return item;
        }

        var nextModuleRecords = {};

        modules.forEach(function (module) {
          var record = moduleRecords[module.id];

          nextModuleRecords[module.id] = {
            moduleTitle: record.moduleTitle,
            moduleProgress: record.moduleProgress,
            moduleMarks: record.moduleMarks,
            moduleStatus: record.moduleStatus,
          };
        });

        return {
          ...item,
          moduleRecords: nextModuleRecords,
          courseProgress: courseProgress,
          courseStatus: courseStatus,
        };
      });

      var oldData = JSON.stringify(students);
      var newData = JSON.stringify(nextStudents);

      if (oldData !== newData) {
        setStudents(nextStudents);
        localStorage.setItem("lms-students", newData);
      }
    },
    [students, student, modules.length, courseProgress, courseStatus]
  );

  useEffect(
    function () {
      if (!selectedModule) {
        setCurrentVideoProgress(0);
        return;
      }

      var savedProgress = clamp(progressMap[selectedModule.id] || 0);
      setCurrentVideoProgress(savedProgress);
      setFurthestWatchedTime(0);
      setLastSavedProgress(savedProgress);
    },
    [selectedModuleId]
  );

  function saveStudents(nextStudents) {
    setStudents(nextStudents);
    localStorage.setItem("lms-students", JSON.stringify(nextStudents));
  }

  function saveModuleProgress(moduleId, progress) {
    if (!student) {
      return;
    }

    const nextStudents = students.map(function (item) {
      if (item.id !== student.id) {
        return item;
      }

      var nextProgress = {};
      var oldProgress = 0;

      if (item.moduleProgress && typeof item.moduleProgress === "object") {
        nextProgress = { ...item.moduleProgress };
      }

      oldProgress = clamp(nextProgress[moduleId] || 0);
      nextProgress[moduleId] = Math.max(oldProgress, clamp(progress));

      return {
        ...item,
        moduleProgress: nextProgress,
      };
    });

    saveStudents(nextStudents);
  }

  function updateCourseDuration(moduleId, duration) {
    if (!course || !moduleId || !duration) {
      return;
    }

    const nextCourses = courses.map(function (item) {
      if (item.id !== course.id) {
        return item;
      }

      const nextModules = item.modules.map(function (module) {
        if (("" + module.id) === (moduleId + "")) {
          return {
            ...module,
            duration: Math.floor(duration),
          };
        }

        return module;
      });

      return {
        ...item,
        modules: nextModules,
      };
    });

    setCourses(nextCourses);
    localStorage.setItem("lms-courses", JSON.stringify(nextCourses));
  }

  function handleLoadedMetadata(event) {
    if (!selectedModule) {
      return;
    }

    var video = event.currentTarget;
    var duration = parseInt(video.duration, 10) || 0;

    updateCourseDuration(selectedModule.id, duration);

    if (!duration) {
      return;
    }

    var savedProgress = clamp(progressMap[selectedModule.id] || 0);
    var savedTime = (savedProgress / 100) * duration;

    setFurthestWatchedTime(savedTime);
    setLastSavedProgress(savedProgress);
    video.currentTime = savedTime;
  }

  function handleVideoProgress(event) {
    if (!selectedModule) {
      return;
    }

    var video = event.currentTarget;
    var duration = parseInt(video.duration, 10) || 0;

    if (!duration) {
      return;
    }

    var watchedTime = Math.max(furthestWatchedTime, video.currentTime);
    var nextProgress = clamp((watchedTime / duration) * 100);

    setFurthestWatchedTime(watchedTime);
    setCurrentVideoProgress(function (value) {
      return Math.max(value, nextProgress);
    });

    if (nextProgress > lastSavedProgress) {
      setLastSavedProgress(nextProgress);
      saveModuleProgress(selectedModule.id, nextProgress);
    }
  }

  function handleSeeking(event) {
    var video = event.currentTarget;
    var allowedTime = furthestWatchedTime + skipBufferSeconds;

    if (video.currentTime > allowedTime) {
      video.currentTime = furthestWatchedTime;
    }
  }

  if (!student || !course) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info" role="alert">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-3 p-lg-4">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
          <div>
            <h1 className="h4 mb-2">My Courses</h1>
            <p className="mb-1">
              <strong>Title:</strong> {course.title}
            </p>
            <p className="mb-0">
              <strong>Trainer Name:</strong> {course.trainerName}
            </p>
          </div>

          <div className="text-lg-end">
            <div className="mb-2">
              <span className="me-2 fw-semibold">Status:</span>
              <span className={getBadge(courseStatus)}>{courseStatus}</span>
            </div>
            <div>
              <span className="me-2 fw-semibold">Progress:</span>
              <span>{courseProgress}%</span>
            </div>
          </div>
        </div>

        <div className="progress mb-4">
          <div className="progress-bar" style={{ width: courseProgress + "%" }}>
            {courseProgress}%
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h6 text-muted mb-3">Module List</h2>

                {modules.length === 0 ? (
                  <div className="alert alert-info mb-0">No modules available</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {modules.map(function (module) {
                      var moduleId = module.id;
                      var record = moduleRecords[moduleId] || {};
                      var isActive = selectedModuleId + "" === moduleId;
                      var isUnlocked = false;
                      var buttonClass =
                        "list-group-item list-group-item-action text-start rounded border";

                      unlockedModuleIds.forEach(function (item) {
                        if (item === moduleId) {
                          isUnlocked = true;
                        }
                      });

                      if (isActive) {
                        buttonClass = buttonClass + " active";
                      }

                      if (!isUnlocked) {
                        buttonClass = buttonClass + " disabled bg-light text-muted";
                      }

                      return (
                        <button
                          key={module.id}
                          type="button"
                          className={buttonClass}
                          onClick={function () {
                            if (isUnlocked) {
                              setSelectedModuleId(moduleId);
                            }
                          }}
                          disabled={!isUnlocked}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="pe-2">
                              <div className="fw-semibold">
                                Module {module.moduleOrder}: {module.moduleTitle}
                              </div>
                              <small className={isActive ? "text-white-50" : "text-muted"}>
                                Progress: {(record.moduleProgress || 0) + "%"} | Marks:{" "}
                                {record.moduleMarks || 0}
                              </small>
                              {!isUnlocked ? (
                                <div>
                                  <small className="text-danger">
                                    Complete previous module to unlock
                                  </small>
                                </div>
                              ) : null}
                            </div>
                            <span
                              className={
                                isActive
                                  ? "badge bg-light text-dark"
                                  : getBadge(record.moduleStatus)
                              }
                            >
                              {record.moduleStatus || "Not Started"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <h2 className="h6 text-muted mb-0">Learning Box</h2>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleStartLearning}
                      disabled={!modules.length}
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleNextModule}
                      disabled={!modules.length}
                    >
                      Next Module
                    </button>
                  </div>
                </div>

                {navMessage ? (
                  <div className="alert alert-warning" role="alert">
                    {navMessage}
                  </div>
                ) : null}

                {!selectedModule ? (
                  <div className="alert alert-info mb-0">Select a module to start learning</div>
                ) : (
                  <>
                    <div className="mb-3">
                      <h3 className="h5 mb-2">{selectedModule.moduleTitle}</h3>
                      <p className="text-muted mb-0">
                        {selectedModule.moduleDescription || "No description available"}
                      </p>
                    </div>

                    {selectedModule.videoUrl ? (
                      <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-2 p-md-3">
                          {isYoutubeVideo ? (
                            youtubeEmbedUrl ? (
                              <div className="ratio ratio-16x9">
                                <iframe
                                  title={selectedModule.moduleTitle}
                                  src={youtubeEmbedUrl}
                                  className="w-100 h-100"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            ) : (
                              <div className="alert alert-info mb-0">No video uploaded</div>
                            )
                          ) : (
                            <video
                              key={selectedModule.id}
                              ref={videoRef}
                              controls
                              src={selectedModule.videoUrl}
                              width="100%"
                              className="w-100 rounded"
                              onLoadedMetadata={handleLoadedMetadata}
                              onTimeUpdate={handleVideoProgress}
                              onSeeking={handleSeeking}
                              onError={function () {
                                setVideoLoadError(true);
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-info mb-4">No video uploaded</div>
                    )}

                    {videoLoadError ? (
                      <div className="alert alert-warning" role="alert">
                        Video could not be loaded. Please check the module video URL.
                      </div>
                    ) : null}

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-4">
                        <div className="border rounded p-3 h-100">
                          <div className="small text-muted mb-1">Module Progress</div>
                          <div className="fw-semibold">{selectedRecord ? selectedRecord.moduleProgress : 0}%</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="border rounded p-3 h-100">
                          <div className="small text-muted mb-1">Module Marks</div>
                          <div className="fw-semibold">
                            {(selectedRecord ? selectedRecord.moduleMarks : 0) + " / 100"}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-4">
                        <div className="border rounded p-3 h-100">
                          <div className="small text-muted mb-1">Completion Status</div>
                          <span className={getBadge(selectedRecord ? selectedRecord.moduleStatus : "Not Started")}>
                            {selectedRecord ? selectedRecord.moduleStatus : "Not Started"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                        <span className="fw-semibold">Overall Module Progress</span>
                        <span>{selectedRecord ? selectedRecord.moduleProgress : 0}%</span>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          style={{ width: (selectedRecord ? selectedRecord.moduleProgress : 0) + "%" }}
                        >
                          {selectedRecord ? selectedRecord.moduleProgress : 0}%
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                        <span className="fw-semibold">Video Completion</span>
                        <span>{currentVideoProgress}%</span>
                      </div>
                      <div className="progress">
                        <div className="progress-bar bg-info" style={{ width: currentVideoProgress + "%" }}>
                          {currentVideoProgress}%
                        </div>
                      </div>
                    </div>

                    <div className="card border-0 bg-light mb-3">
                      <div className="card-body py-3">
                        <div className="row g-3">
                          <div className="col-12 col-md-4">
                            <div className="small text-muted">Video Marks</div>
                            <div className="fw-semibold">
                              {clamp((currentVideoProgress * VIDEO_WEIGHT) / 100)} / {VIDEO_WEIGHT}
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="small text-muted">MCQ Marks</div>
                            <div className="fw-semibold">
                              {clamp((((selectedRecord ? selectedRecord.mcqPercentage : 0) || 0) * MCQ_WEIGHT) / 100)} / {MCQ_WEIGHT}
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="small text-muted">Coding Marks</div>
                            <div className="fw-semibold">
                              {clamp((((selectedRecord ? selectedRecord.codingScore : 0) || 0) * CODING_WEIGHT) / 100)} / {CODING_WEIGHT}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {courseStatus === "Completed" ? (
                      <div className="alert alert-success mb-0" role="alert">
                        Course completed successfully
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0" role="alert">
                        Module progress combines video completion, MCQ completion, and coding
                        submission
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

