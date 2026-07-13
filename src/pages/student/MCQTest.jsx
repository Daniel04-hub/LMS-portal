import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
import { useAuth } from "../../context/AuthContext";

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

function getOptions(mcq) {
  var list = [];
  var letters = ["A", "B", "C", "D"];
  var i = 0;

  if (mcq.options && mcq.options.length !== undefined) {
    for (i = 0; i < mcq.options.length; i += 1) {
      list.push({
        option: letters[i],
        value: mcq.options[i],
      });
    }
    return list;
  }

  if (mcq.choices && mcq.choices.length !== undefined) {
    for (i = 0; i < mcq.choices.length; i += 1) {
      list.push({
        option: letters[i],
        value: mcq.choices[i],
      });
    }
    return list;
  }

  for (i = 0; i < letters.length; i += 1) {
    var key = letters[i];
    var smallKey = key.toLowerCase();
    var text = mcq["option" + key] || mcq["option" + smallKey] || "";

    if (text) {
      list.push({
        option: key,
        value: text,
      });
    }
  }

  return list;
}

function isCorrect(mcq, answerKey) {
  var correctAnswer = "";
  var options = getOptions(mcq);
  var selectedText = "";
  var i = 0;

  if (mcq.correctAnswer) {
    correctAnswer = (mcq.correctAnswer + "").trim();
  }

  for (i = 0; i < options.length; i += 1) {
    if (options[i].option === answerKey) {
      selectedText = (options[i].value || "").trim();
    }
  }

  if (correctAnswer === ((answerKey || "") + "").trim()) {
    return true;
  }

  if (correctAnswer === selectedText) {
    return true;
  }

  return false;
}

function getResultStatus(result) {
  var score = 0;

  if (result && result.resultStatus) {
    return result.resultStatus;
  }

  if (result && result.percentage) {
    score = parseInt(result.percentage, 10) || 0;
  }

  if (score >= 80) {
    return "Passed";
  }

  return "Retry Required";
}

function getNextAttempt(results) {
  var highest = results.length;

  results.forEach(function (item) {
    var value = parseInt(item.attemptNumber, 10) || 0;

    if (value > highest) {
      highest = value;
    }
  });

  return highest + 1;
}

function clampProgress(value) {
  var numericValue = Number(value);

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

function getLinkedModuleId(record, modules, assignedCourse) {
  if (record?.moduleId !== undefined && record?.moduleId !== null && record?.moduleId !== "") {
    return "" + record.moduleId;
  }

  if (
    String(record?.courseTitle || "").trim().toLowerCase() ===
      String(assignedCourse || "").trim().toLowerCase() &&
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
    return clampProgress(result.percentage);
  }

  var score = Number(result.score) || 0;
  var totalQuestions = Number(result.totalQuestions) || 0;

  if (totalQuestions <= 0) {
    return 0;
  }

  return clampProgress((score / totalQuestions) * 100);
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

function updateStudentProgress(students, courses, mcqResults, codingSubmissions, studentEmail) {
  return (Array.isArray(students) ? students : []).map(function (student) {
    if (String(student?.email || "").trim().toLowerCase() !== String(studentEmail || "").trim().toLowerCase()) {
      return student;
    }

    var assignedCourse = String(student?.assignedCourse || "").trim().toLowerCase();
    var course = null;

    (Array.isArray(courses) ? courses : []).forEach(function (item) {
      if (
        String(item?.title || "").trim().toLowerCase() === assignedCourse &&
        String(item?.status || "").trim().toLowerCase() === "approved"
      ) {
        course = item;
      }
    });

    if (!course) {
      return student;
    }

    var modules = normalizeModules(course);
    var progressMap =
      student?.moduleProgress && typeof student.moduleProgress === "object"
        ? student.moduleProgress
        : {};
    var moduleRecords = {};
    var totalProgress = 0;

    modules.forEach(function (module) {
      var moduleId = module.id;
      var videoProgress = clampProgress(progressMap[moduleId] || 0);
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
      var codingScore = clampProgress(latestCoding?.score || 0);
      var moduleProgress = clampProgress(
        (videoProgress * 40) / 100 +
          (mcqPercentage >= 80 ? 30 : 0) +
          (getCodingResultStatus(latestCoding) === "Passed" ? 30 : 0)
      );

      moduleRecords[moduleId] = {
        moduleTitle: module.moduleTitle,
        moduleProgress: moduleProgress,
        moduleMarks: clampProgress(
          (videoProgress * 40) / 100 + (mcqPercentage * 30) / 100 + (codingScore * 30) / 100
        ),
        moduleStatus: getProgressStatus(moduleProgress),
      };
      totalProgress += moduleProgress;
    });

    var courseProgress = modules.length ? clampProgress(totalProgress / modules.length) : 0;

    return {
      ...student,
      trainerName: course.trainerName || student.trainerName || "",
      moduleRecords: moduleRecords,
      courseProgress: courseProgress,
      courseStatus: getProgressStatus(courseProgress),
    };
  });
}

function QuestionCard(props) {
  var mcq = props.mcq;
  var index = props.index;
  var value = props.value;
  var onChange = props.onChange;
  var disabled = props.disabled;
  var options = getOptions(mcq);

  return (
    <div className="card p-3 shadow-sm mb-3">
      <div className="fw-semibold mb-2">
        Q{index + 1}. {mcq.question || mcq.title || "Question"}
      </div>

      {options.length === 0 ? (
        <div className="text-muted">No data available</div>
      ) : (
        options.map(function (option) {
          return (
            <div className="form-check" key={option.option}>
              <input
                className="form-check-input"
                type="radio"
                name={"mcq-" + mcq.id}
                id={"mcq-" + mcq.id + "-" + option.option}
                checked={value === option.option}
                onChange={function () {
                  onChange(mcq.id, option.option);
                }}
                disabled={disabled}
              />
              <label
                className="form-check-label"
                htmlFor={"mcq-" + mcq.id + "-" + option.option}
              >
                {option.option}. {option.value}
              </label>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function MCQTest() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allMcqs, setAllMcqs] = useState([]);
  const [mcqResults, setMcqResults] = useState([]);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [violations, setViolations] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);

  function loadData() {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedMcqs = JSON.parse(localStorage.getItem("lms-mcqs")) || [];
    const savedMcqResults = JSON.parse(localStorage.getItem("lms-mcq-results")) || [];
    const savedCodingSubmissions =
      JSON.parse(localStorage.getItem("lms-coding-submissions")) || [];

    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setAllMcqs(Array.isArray(savedMcqs) ? savedMcqs : []);
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
          event.key === "lms-mcqs" ||
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
  var userName = "";
  var student = null;
  var assignedCourse = "";
  var course = null;
  var modules = [];
  var fallbackModuleId = "";
  var mcqs = [];
  var resultList = [];
  var latestResult = null;
  var latestStatus = "";
  var hasPassed = false;
  var retryRequired = false;

  if (user && user.email) {
    userEmail = user.email;
  }

  if (user && user.name) {
    userName = user.name;
  }

  var normalizedUserEmail = normalizeText(userEmail);

  student = findBestStudentByEmail(students, userEmail);

  if (student && student.assignedCourse) {
    assignedCourse = student.assignedCourse;
  }

  var normalizedAssignedCourse = normalizeText(assignedCourse);
  var normalizedStudentTrainerName = normalizeText(student?.trainerName);

  courses.forEach(function (item) {
    if (normalizeText(item.title) === normalizedAssignedCourse) {
      course = item;
    }
  });

  if (course && course.modules && course.modules.length !== undefined) {
    modules = course.modules;
  }

  if (modules.length === 1 && modules[0] && modules[0].id) {
    fallbackModuleId = "" + modules[0].id;
  }

  mcqs = allMcqs.filter(function (item) {
    var itemCourseTitle = item?.courseTitle;
    var itemCourse = item?.course;
    var courseMatches =
      normalizeText(itemCourseTitle) === normalizedAssignedCourse ||
      normalizeText(itemCourse) === normalizedAssignedCourse;

    if (!courseMatches) {
      return false;
    }

    if (
      item.trainerName &&
      student &&
      normalizedStudentTrainerName &&
      normalizeText(item.trainerName) !== normalizedStudentTrainerName
    ) {
      return false;
    }

    return true;
  });

  resultList = mcqResults
    .filter(function (item) {
      return (
        normalizeText(item.studentEmail) === normalizedUserEmail &&
        normalizeText(item.courseTitle) === normalizedAssignedCourse
      );
    })
    .sort(function (a, b) {
      var first = Date.parse(b.submittedAt || "") || (parseInt(b.id, 10) || 0);
      var second = Date.parse(a.submittedAt || "") || (parseInt(a.id, 10) || 0);
      return first - second;
    });

  latestResult = resultList[0];
  latestStatus = getResultStatus(latestResult);
  hasPassed = latestStatus === "Passed";
  retryRequired = latestStatus === "Retry Required";

  useEffect(
    function () {
      function handleFullscreenChange() {
        var active = Boolean(document.fullscreenElement);
        setIsFullscreen(active);

        if (isTestStarted && !showResult && !active) {
          setViolations(function (value) {
            return value + 1;
          });
          setWarningMessage("Do not exit fullscreen");
        }
      }

      function handleVisibilityChange() {
        if (isTestStarted && !showResult && document.visibilityState === "hidden") {
          setViolations(function (value) {
            return value + 1;
          });
          setWarningMessage("Tab switching detected");
        }
      }

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return function () {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    },
    [isTestStarted, showResult]
  );

  useEffect(
    function () {
      if (violations >= 3 && isTestStarted && !showResult && !isAutoSubmitted) {
        handleSubmitTest();
        setWarningMessage("Test auto-submitted due to violations");
        setIsAutoSubmitted(true);
      }
    },
    [violations, isTestStarted, showResult, isAutoSubmitted]
  );

  function handleAnswer(id, answer) {
    const updatedAnswers = { ...answers, [id]: answer };
    setAnswers(updatedAnswers);
  }

  function handleReset() {
    setAnswers({});
    setScore(0);
    setPercentage(0);
    setShowResult(false);
    setIsTestStarted(false);
    setViolations(0);
    setWarningMessage("");
    setIsAutoSubmitted(false);
  }

  function handleSubmitTest() {
    var nextScore = 0;
    var totalQuestions = mcqs.length;
    var nextPercentage = 0;
    var resultStatus = "Retry Required";
    var resultModuleId = fallbackModuleId;
    var resultModuleTitle = "";

    mcqs.forEach(function (mcq) {
      if (!mcq.moduleId) {
        return;
      }

      if (!resultModuleId) {
        resultModuleId = "" + mcq.moduleId;
        resultModuleTitle = mcq.moduleTitle || "";
        return;
      }

      if (resultModuleId !== "" + mcq.moduleId) {
        resultModuleId = "";
        resultModuleTitle = "";
      }
    });

    mcqs.forEach(function (mcq) {
      if (isCorrect(mcq, answers[mcq.id])) {
        nextScore += 1;
      }
    });

    if (totalQuestions > 0) {
      nextPercentage = Math.round((nextScore / totalQuestions) * 100);
    }

    if (nextPercentage >= 80) {
      resultStatus = "Passed";
    }

    setScore(nextScore);
    setPercentage(nextPercentage);
    setShowResult(true);

    if (totalQuestions > 0 && assignedCourse) {
      const result = {
        id: Date.now(),
        studentEmail: userEmail,
        studentName: userName || (student && student.name) || "Student",
        courseTitle: assignedCourse,
        trainerName: student ? student.trainerName : "",
        moduleId: resultModuleId,
        moduleTitle: resultModuleTitle,
        score: nextScore,
        totalQuestions: totalQuestions,
        percentage: nextPercentage,
        resultStatus: resultStatus,
        isPassed: resultStatus === "Passed",
        attemptNumber: getNextAttempt(resultList),
        submittedAt: new Date().getTime(),
      };

      const updatedResults = mcqResults.concat(result);
      const updatedStudents = updateStudentProgress(
        students,
        courses,
        updatedResults,
        codingSubmissions,
        userEmail
      );

      setMcqResults(updatedResults);
      setStudents(updatedStudents);
      localStorage.setItem("lms-mcq-results", JSON.stringify(updatedResults));
      localStorage.setItem("lms-students", JSON.stringify(updatedStudents));
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  async function handleStartTest() {
    setAnswers({});
    setScore(0);
    setPercentage(0);
    setIsTestStarted(true);
    setShowResult(false);
    setViolations(0);
    setWarningMessage("");
    setIsAutoSubmitted(false);

    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {}

    setIsFullscreen(Boolean(document.fullscreenElement));
  }

  var fullscreenBadge = "badge bg-secondary";
  var latestBadge = "badge bg-warning text-dark";
  var resultAlert = "alert alert-warning";
  var resultType = "warning";
  var resultText = "Retry Required";

  if (isFullscreen) {
    fullscreenBadge = "badge bg-success";
  }

  if (hasPassed) {
    latestBadge = "badge bg-success";
    resultAlert = "alert alert-success";
    resultType = "success";
    resultText = "Passed";
  }

  return (
    <div className="container mt-4">
      <h1 className="h4 mb-3">MCQ Test</h1>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <span className="badge bg-danger">Violations: {violations} / 3</span>
        <span className={fullscreenBadge}>
          Fullscreen: {isFullscreen ? "Active" : "Inactive"}
        </span>
        {latestResult ? <span className={latestBadge}>Latest Result: {latestStatus}</span> : null}
      </div>

      <AlertMessage message={warningMessage} type="danger" />

      {mcqs.length === 0 ? <AlertMessage message="No data available" type="info" /> : null}

      {latestResult ? (
        <div className={resultAlert}>
          {hasPassed ? "Passed" : "Retry Required"} - {latestResult.percentage}% on attempt{" "}
          {latestResult.attemptNumber || 1}
        </div>
      ) : null}

      {mcqs.length > 0 && !isTestStarted && !hasPassed ? (
        <CustomButton
          text={retryRequired ? "Retry MCQ" : "Start Test"}
          onClick={handleStartTest}
        />
      ) : null}

      {isTestStarted
        ? mcqs.map(function (mcq, index) {
            return (
              <QuestionCard
                key={mcq.id}
                mcq={mcq}
                index={index}
                value={answers[mcq.id]}
                onChange={handleAnswer}
                disabled={showResult}
              />
            );
          })
        : null}

      {isTestStarted ? (
        <CustomButton
          text="Submit Test"
          onClick={handleSubmitTest}
          disabled={!mcqs.length || showResult}
        />
      ) : null}

      {showResult ? (
        <div className="card shadow-sm mt-3">
          <div className="card-body">
            <h2 className="h5 mb-3">Result Summary</h2>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="small text-muted">Total Questions</div>
                  <div className="fw-semibold">{mcqs.length}</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="small text-muted">Correct Answers</div>
                  <div className="fw-semibold">{score}</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="small text-muted">Percentage</div>
                  <div className="fw-semibold">{percentage}%</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="border rounded p-3 h-100">
                  <div className="small text-muted">Final Result</div>
                  <div className="fw-semibold">{resultText}</div>
                </div>
              </div>
            </div>

            <AlertMessage
              message={
                resultText + " - Score: " + score + " / " + mcqs.length + " (" + percentage + "%)"
              }
              type={resultType}
              className="mt-3"
            />
          </div>
        </div>
      ) : null}

      {showResult && percentage < 80 ? (
        <div className="mt-3">
          <CustomButton text="Retry Required" onClick={handleReset} />
        </div>
      ) : null}
    </div>
  );
}

