import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";

function createEmptyTestCase() {
  return {
    input: "",
    expectedOutput: "",
  };
}

function normalizeTestCase(testCase) {
  return {
    input: String(testCase?.input || ""),
    expectedOutput: String(testCase?.expectedOutput || ""),
  };
}

function normalizeCodingTest(test, index = 0) {
  return {
    id: test?.id ?? Date.now() + index,
    questionTitle: String(test?.questionTitle || ""),
    description: String(test?.description || ""),
    starterCode: String(test?.starterCode || ""),
    language: String(test?.language || "JavaScript"),
    testCases: Array.isArray(test?.testCases)
      ? test.testCases.map(normalizeTestCase)
      : [],
    createdBy: String(test?.createdBy || ""),
    trainerName: String(test?.trainerName || test?.createdBy || ""),
    courseTitle: String(test?.courseTitle || ""),
    moduleId: test?.moduleId ? String(test.moduleId) : "",
    moduleTitle: String(test?.moduleTitle || ""),
  };
}

export default function CodingTestCreation() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [codingTests, setCodingTests] = useState([]);
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
  const [editingTestId, setEditingTestId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [formValues, setFormValues] = useState({
    questionTitle: "",
    description: "",
    starterCode: "",
    language: "JavaScript",
    testCases: [createEmptyTestCase()],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedCodingTests =
      JSON.parse(localStorage.getItem("lms-coding-tests")) || [];

    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setCodingTests(Array.isArray(savedCodingTests) ? savedCodingTests : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-coding-tests", JSON.stringify(codingTests));
  }, [codingTests, isLoaded]);

  const trainerCourses = (Array.isArray(courses) ? courses : []).filter(
    (course) => course.trainerName === (user?.name || "")
  );
  const selectedCourseDetails =
    trainerCourses.find((course) => course.title === selectedCourse) || null;
  const selectedModules =
    selectedCourseDetails && selectedCourseDetails.modules
      ? selectedCourseDetails.modules
      : [];
  const selectedModule =
    selectedModules.find((module) => String(module.id) === String(selectedModuleId)) || null;

  const trainerTests = (Array.isArray(codingTests) ? codingTests : [])
    .map(normalizeCodingTest)
    .filter((test) => test.createdBy === (user?.name || "") || test.trainerName === (user?.name || ""));

  const resetForm = () => {
    setEditingTestId(null);
    setSelectedCourse("");
    setSelectedModuleId("");
    setFormValues({
      questionTitle: "",
      description: "",
      starterCode: "",
      language: "JavaScript",
      testCases: [createEmptyTestCase()],
    });
  };

  const handleChange = (key) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const handleTestCaseChange = (index, key) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({
      ...prev,
      testCases: prev.testCases.map((testCase, currentIndex) =>
        currentIndex === index
          ? {
              ...testCase,
              [key]: value,
            }
          : testCase
      ),
    }));
  };

  const addTestCase = () => {
    setFormValues((prev) => ({
      ...prev,
      testCases: [...prev.testCases, createEmptyTestCase()],
    }));
  };

  const removeTestCase = (index) => {
    setFormValues((prev) => ({
      ...prev,
      testCases:
        prev.testCases.length === 1
          ? [createEmptyTestCase()]
          : prev.testCases.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleEdit = (test) => {
    const normalizedTest = normalizeCodingTest(test);
    setEditingTestId(normalizedTest.id);
    setSelectedCourse(normalizedTest.courseTitle);
    setSelectedModuleId(normalizedTest.moduleId);
    setFormValues({
      questionTitle: normalizedTest.questionTitle,
      description: normalizedTest.description,
      starterCode: normalizedTest.starterCode,
      language: normalizedTest.language,
      testCases:
        normalizedTest.testCases.length > 0
          ? normalizedTest.testCases
          : [createEmptyTestCase()],
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const questionTitle = formValues.questionTitle.trim();
    const description = formValues.description.trim();
    const starterCode = formValues.starterCode;
    const language = formValues.language.trim() || "JavaScript";
    const testCases = formValues.testCases
      .map(normalizeTestCase)
      .filter((testCase) => testCase.input.trim() && testCase.expectedOutput.trim());

    if (
      !selectedCourseDetails ||
      !questionTitle ||
      !description ||
      !starterCode.trim() ||
      testCases.length === 0
    ) {
      showMessage("Please fill in all required fields and add at least one test case.", "danger");
      return;
    }

    const duplicateTest = trainerTests.find(
      (test) =>
        test.questionTitle.toLowerCase() === questionTitle.toLowerCase() &&
        test.id !== editingTestId
    );

    if (duplicateTest) {
      showMessage("Coding question title already exists.", "danger");
      return;
    }

    if (editingTestId) {
      setCodingTests(
        (Array.isArray(codingTests) ? codingTests : []).map((test, index) => {
          const normalizedTest = normalizeCodingTest(test, index);

          return normalizedTest.id === editingTestId
            ? {
                ...normalizedTest,
                questionTitle,
                description,
                starterCode,
                language,
                testCases,
                createdBy: user?.name || "",
                trainerName: user?.name || "",
                courseTitle: selectedCourseDetails.title,
                moduleId: selectedModule ? selectedModule.id : "",
                moduleTitle: selectedModule
                  ? selectedModule.moduleTitle || selectedModule.title || ""
                  : "",
              }
            : normalizedTest;
        })
      );

      showMessage("Coding test updated successfully.", "success");
      resetForm();
      return;
    }

    const newCodingTest = {
      id: Date.now(),
      questionTitle,
      description,
      starterCode,
      language,
      testCases,
      createdBy: user?.name || "",
      trainerName: user?.name || "",
      courseTitle: selectedCourseDetails.title,
      moduleId: selectedModule ? selectedModule.id : "",
      moduleTitle: selectedModule
        ? selectedModule.moduleTitle || selectedModule.title || ""
        : "",
    };

    setCodingTests([...(Array.isArray(codingTests) ? codingTests : []), newCodingTest]);
    showMessage("Coding test created successfully.", "success");
    resetForm();
  };

  return (
    <div className="container mt-4">
      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm p-3">
            <h1 className="h4 mb-3">
              {editingTestId ? "Edit Coding Test" : "Coding Test Creation"}
            </h1>

            <AlertMessage message={message} type={type} />

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Select Course</label>
                <select
                  className="form-select"
                  value={selectedCourse}
                  onChange={(event) => {
                    setSelectedCourse(event.target.value);
                    setSelectedModuleId("");
                  }}
                  required
                >
                  <option value="">-- Select Course --</option>
                  {trainerCourses.map((course) => (
                    <option key={course.id} value={course.title}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Select Module</label>
                <select
                  className="form-select"
                  value={selectedModuleId}
                  onChange={(event) => setSelectedModuleId(event.target.value)}
                  required={selectedModules.length > 0}
                >
                  <option value="">-- Select Module --</option>
                  {selectedModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.moduleTitle || module.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Question Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={formValues.questionTitle}
                  onChange={handleChange("questionTitle")}
                  placeholder="Enter coding question title"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formValues.description}
                  onChange={handleChange("description")}
                  placeholder="Enter coding question description"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Starter Code</label>
                <textarea
                  className="form-control"
                  rows={8}
                  value={formValues.starterCode}
                  onChange={handleChange("starterCode")}
                  placeholder="Enter starter code"
                  required
                  style={{
                    backgroundColor: "#1e1e1e",
                    color: "#ffffff",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Language</label>
                <select
                  className="form-select"
                  value={formValues.language}
                  onChange={handleChange("language")}
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                </select>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Test Cases</label>
                  <CustomButton text="Add Test Case" onClick={addTestCase} />
                </div>

                <div className="d-flex flex-column gap-3">
                  {formValues.testCases.map((testCase, index) => (
                    <div key={`${index}-${testCase.input}`} className="border rounded p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h2 className="h6 mb-0">Test Case {index + 1}</h2>
                        <CustomButton
                          text="Remove"
                          onClick={() => removeTestCase(index)}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Input</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={testCase.input}
                          onChange={handleTestCaseChange(index, "input")}
                          placeholder="Example: 5"
                        />
                      </div>

                      <div>
                        <label className="form-label">Expected Output</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={testCase.expectedOutput}
                          onChange={handleTestCaseChange(index, "expectedOutput")}
                          placeholder="Example: 25"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <CustomButton
                  text={editingTestId ? "Update Coding Test" : "Create Coding Test"}
                  type="submit"
                />
                {editingTestId ? <CustomButton text="Cancel" onClick={resetForm} /> : null}
              </div>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm p-3">
            <h2 className="h5 mb-3">Created Coding Tests</h2>

            <DataTable
              rowKey="id"
              columns={[
                { key: "courseTitle", header: "Course" },
                {
                  key: "moduleTitle",
                  header: "Module",
                  render: (test) => test.moduleTitle || "Course Level",
                },
                { key: "questionTitle", header: "Question" },
                { key: "language", header: "Language" },
                {
                  key: "testCases",
                  header: "Test Cases",
                  render: (test) => test.testCases.length,
                },
              ]}
              data={trainerTests}
              renderActions={(test) => (
                <CustomButton text="Edit" onClick={() => handleEdit(test)} />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


