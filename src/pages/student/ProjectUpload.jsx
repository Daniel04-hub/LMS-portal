import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";
import FormInput from "../../components/FormInput";
import { useAuth } from "../../context/AuthContext";

const PROJECT_ACCEPT = "image/*,.pdf,.zip,.rar,.7z,.doc,.docx";

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

function readFile(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      resolve(reader.result);
    };
    reader.onerror = function () {
      reject(new Error("Unable to read file"));
    };
    reader.readAsDataURL(file);
  });
}

function formatDate() {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();

  if (month < 10) {
    month = "0" + month;
  }

  if (day < 10) {
    day = "0" + day;
  }

  if (hours < 10) {
    hours = "0" + hours;
  }

  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
}

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

export default function ProjectUpload() {
  const { user } = useAuth();
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
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadData() {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedProjects = JSON.parse(localStorage.getItem("lms-projects")) || [];

    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setProjects(Array.isArray(savedProjects) ? savedProjects : []);
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
          event.key === "lms-projects"
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
  if (user && user.email) {
    userEmail = user.email;
  }

  var userName = "";
  if (user && user.name) {
    userName = user.name;
  }

  var student = null;
  student = findBestStudentByEmail(students, userEmail);

  var assignedCourse = "";
  if (student && student.assignedCourse) {
    assignedCourse = student.assignedCourse;
  }

  var visibleProjects = projects
    .filter(function (item) {
      return normalizeText(item.studentEmail) === normalizeText(userEmail);
    })
    .sort(function (a, b) {
      return (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0);
    });

  function handleReset() {
    setProjectTitle("");
    setGithubLink("");
    setDescription("");
    setSelectedFile(null);
    setFileInputKey(fileInputKey + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      showMessage("Please select a file to upload.", "danger");
      return;
    }

    setIsSubmitting(true);

    try {
      const fileData = await readFile(selectedFile);

      const newProject = {
        id: Date.now(),
        studentName: userName,
        studentEmail: userEmail,
        courseTitle: assignedCourse,
        trainerName: student ? student.trainerName : "",
        projectTitle: projectTitle.trim(),
        githubLink: githubLink.trim(),
        description: description.trim(),
        fileName: selectedFile.name,
        fileType: selectedFile.type || "application/octet-stream",
        fileData: fileData,
        submittedAt: formatDate(),
        status: "Submitted",
        reviewComment: "",
      };

      const updatedProjects = projects.concat(newProject);
      setProjects(updatedProjects);
      localStorage.setItem("lms-projects", JSON.stringify(updatedProjects));

      handleReset();
      loadData();
      showMessage("Project uploaded successfully", "success");
    } catch (error) {
      showMessage("Unable to upload file. Please try again.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    { key: "projectTitle", header: "Project Title" },
    { key: "courseTitle", header: "Course" },
    {
      key: "githubLink",
      header: "GitHub Link",
      render: function (item) {
        return (
          <a href={item.githubLink} target="_blank" rel="noreferrer">
            View Repository
          </a>
        );
      },
    },
    {
      key: "fileName",
      header: "File",
      render: function (item) {
        if (item.fileData) {
          return (
            <a href={item.fileData} target="_blank" rel="noreferrer">
              {item.fileName || "Open File"}
            </a>
          );
        }

        return <span className="text-muted">No file</span>;
      },
    },
    { key: "submittedAt", header: "Uploaded Date" },
    {
      key: "status",
      header: "Status",
      render: function (item) {
        return <span className={getBadge(item.status)}>{item.status || "Pending"}</span>;
      },
    },
    {
      key: "reviewComment",
      header: "Trainer Comment",
      render: function (item) {
        return item.reviewComment || <span className="text-muted">No comments yet</span>;
      },
    },
  ];

  return (
    <div className="container mt-4">
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm p-3">
            <h2 className="mb-3">Project Upload</h2>
            <AlertMessage message={message} type={type} />

            <FormInput label="Student Name" value={userName} onChange={function () {}} readOnly />
            <FormInput label="Student Email" value={userEmail} onChange={function () {}} readOnly />
            <FormInput label="Assigned Course" value={assignedCourse} onChange={function () {}} readOnly />

            <form onSubmit={handleSubmit}>
              <FormInput
                label="Project Title"
                value={projectTitle}
                onChange={function (event) {
                  setProjectTitle(event.target.value);
                }}
                placeholder="Project Title"
                name="projectTitle"
                required
              />

              <FormInput
                label="GitHub Repository Link"
                type="url"
                value={githubLink}
                onChange={function (event) {
                  setGithubLink(event.target.value);
                }}
                placeholder="GitHub Repository Link"
                name="githubLink"
                required
              />

              <div className="mb-3">
                <label className="form-label">Project Description</label>
                <textarea
                  className="form-control"
                  placeholder="Project Description"
                  rows={4}
                  value={description}
                  onChange={function (event) {
                    setDescription(event.target.value);
                  }}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Upload File</label>
                <input
                  key={fileInputKey}
                  type="file"
                  className="form-control"
                  accept={PROJECT_ACCEPT}
                  onChange={function (event) {
                    const file = event.target.files[0] || null;
                    setSelectedFile(file);
                  }}
                  required
                />
                <small className="text-muted">
                  Supported: images, PDF, ZIP, RAR, 7Z, DOC, DOCX
                </small>
              </div>

              <FormInput
                label="Selected File"
                value={selectedFile && selectedFile.name ? selectedFile.name : ""}
                onChange={function () {}}
                placeholder="No file selected"
                readOnly
              />

              <CustomButton
                text={isSubmitting ? "Uploading..." : "Upload Project"}
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card shadow-sm p-3">
            <h2 className="mb-3">Uploaded Projects</h2>
            <DataTable rowKey="id" columns={columns} data={visibleProjects} />
          </div>
        </div>
      </div>
    </div>
  );
}


