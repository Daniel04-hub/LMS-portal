import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";
import FormInput from "../../components/FormInput";
import { useAuth } from "../../context/AuthContext";

function getOptionRows(mcq) {
  return [
    `A. ${mcq.options?.A || mcq.optionA || ""}`,
    `B. ${mcq.options?.B || mcq.optionB || ""}`,
    `C. ${mcq.options?.C || mcq.optionC || ""}`,
    `D. ${mcq.options?.D || mcq.optionD || ""}`,
  ];
}

export default function MCQCreation() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [mcqs, setMcqs] = useState([]);
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
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    const savedMcqs = JSON.parse(localStorage.getItem("lms-mcqs")) || [];

    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setMcqs(Array.isArray(savedMcqs) ? savedMcqs : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-mcqs", JSON.stringify(mcqs));
  }, [mcqs, isLoaded]);

  const [formValues, setFormValues] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
  });

  const trainerCourses = courses.filter((course) => course.trainerName === user?.name);

  const selectedCourseDetails = trainerCourses.find(
    (course) => course.title === selectedCourse
  );
  const selectedModules =
    selectedCourseDetails && selectedCourseDetails.modules
      ? selectedCourseDetails.modules
      : [];
  const selectedModule = selectedModules.find(
    (module) => String(module.id) === String(selectedModuleId)
  );

  const safeMcqs = Array.isArray(mcqs) ? mcqs : [];
  const titles = new Set(trainerCourses.map((course) => course.title));
  const trainerMcqs = safeMcqs.filter((mcq) => {
    const mcqCourse = mcq?.course || mcq?.courseTitle || "";
    return titles.has(mcqCourse);
  });

  const filteredMcqs =
    selectedCourse === ""
      ? trainerMcqs
      : trainerMcqs.filter((item) => {
          const mcqCourse = item?.course || item?.courseTitle || "";
          return mcqCourse === selectedCourse;
        });

  const handleChange = (key) => (event) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormValues({
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedCourseDetails) {
      return;
    }

    const newMcq = {
      id: Date.now(),
      course: selectedCourse,
      courseTitle: selectedCourseDetails.title,
      trainerName: user?.name || "",
      moduleId: selectedModule ? selectedModule.id : "",
      moduleTitle: selectedModule
        ? selectedModule.moduleTitle || selectedModule.title || ""
        : "",
      question: formValues.question.trim(),
      options: {
        A: formValues.optionA.trim(),
        B: formValues.optionB.trim(),
        C: formValues.optionC.trim(),
        D: formValues.optionD.trim(),
      },
      correctAnswer: formValues.correctAnswer,
      optionA: formValues.optionA.trim(),
      optionB: formValues.optionB.trim(),
      optionC: formValues.optionC.trim(),
      optionD: formValues.optionD.trim(),
    };

    setMcqs([...mcqs, newMcq]);
    resetForm();
    setSelectedModuleId("");
    showMessage("MCQ added successfully.", "success");
  };

  return (
    <div className="container mt-4">
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card p-3 shadow-sm">
            <h1 className="h4 mb-3">MCQ Creation</h1>

            <AlertMessage message={message} type={type} />

            {trainerCourses.length === 0 ? (
              <div className="alert alert-info mb-0">No data available</div>
            ) : (
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
                  <label className="form-label">Question</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={formValues.question}
                    onChange={handleChange("question")}
                    placeholder="Enter question"
                    required
                  />
                </div>

                <FormInput
                  label="Option A"
                  type="text"
                  value={formValues.optionA}
                  onChange={handleChange("optionA")}
                  placeholder="Enter option A"
                  name="optionA"
                  required
                />
                <FormInput
                  label="Option B"
                  type="text"
                  value={formValues.optionB}
                  onChange={handleChange("optionB")}
                  placeholder="Enter option B"
                  name="optionB"
                  required
                />
                <FormInput
                  label="Option C"
                  type="text"
                  value={formValues.optionC}
                  onChange={handleChange("optionC")}
                  placeholder="Enter option C"
                  name="optionC"
                  required
                />
                <FormInput
                  label="Option D"
                  type="text"
                  value={formValues.optionD}
                  onChange={handleChange("optionD")}
                  placeholder="Enter option D"
                  name="optionD"
                  required
                />

                <div className="mb-3">
                  <label className="form-label">Correct Answer</label>
                  <select
                    className="form-select"
                    value={formValues.correctAnswer}
                    onChange={handleChange("correctAnswer")}
                    required
                  >
                    <option value="">-- Select Answer --</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                <CustomButton text="Add MCQ" onClick={handleSubmit} />
              </form>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card p-3 shadow-sm">
            <h2 className="h5 mb-3">MCQ List</h2>
            {selectedCourse !== "" && filteredMcqs.length === 0 ? (
              <p className="text-muted mb-0">No MCQs available for this course</p>
            ) : (
              <DataTable
                rowKey="id"
                columns={[
                  {
                    key: "course",
                    header: "Course",
                    render: (mcq) => mcq.course || mcq.courseTitle || "",
                  },
                  {
                    key: "moduleTitle",
                    header: "Module",
                    render: (mcq) => mcq.moduleTitle || "Course Level",
                  },
                  { key: "question", header: "Question" },
                  {
                    key: "options",
                    header: "Options",
                    render: (mcq) => (
                      <div>
                        {getOptionRows(mcq).map((row) => (
                          <div key={row}>{row}</div>
                        ))}
                      </div>
                    ),
                  },
                  { key: "correctAnswer", header: "Correct" },
                ]}
                data={filteredMcqs}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


