import React, { useEffect, useState } from "react";
import CustomButton from "../../components/CustomButton";
import DataTable from "../../components/DataTable";

function normalizeTrainer(trainer, index) {
  if (index === undefined) {
    index = 0;
  }

  let name = "";
  let email = "";
  let specialization = "";

  if (trainer && trainer.name) {
    name = String(trainer.name).trim();
  }

  if (trainer && trainer.email) {
    email = String(trainer.email).trim();
  }

  if (trainer && trainer.specialization) {
    specialization = String(trainer.specialization).trim();
  } else if (trainer && trainer.subject) {
    specialization = String(trainer.subject).trim();
  }

  let trainerId = "";

  if (
    trainer &&
    trainer.id !== undefined &&
    trainer.id !== null &&
    trainer.id !== ""
  ) {
    trainerId = trainer.id;
  } else {
    trainerId = (email || "trainer") + "-" + index;
  }

  let assignedStudents = [];

  if (trainer && Array.isArray(trainer.assignedStudents)) {
    assignedStudents = trainer.assignedStudents;
  }

  let createdCourses = [];

  if (trainer && Array.isArray(trainer.createdCourses)) {
    createdCourses = trainer.createdCourses;
  }

  return {
    id: trainerId,
    name: name,
    email: email,
    password: trainer ? String(trainer.password || "") : "",
    specialization: specialization,
    assignedStudents: assignedStudents,
    createdCourses: createdCourses,
  };
}

function getTrainerDisplayName(trainer) {
  if (trainer && trainer.name) {
    return String(trainer.name).trim();
  }

  return "";
}

export default function TrainerManagement() {
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  function showMessage(text, messageType) {
    setMessage(text);
    setType(messageType);
  }

  useEffect(function () {
    if (!message) {
      return;
    }

    const timer = setTimeout(function () {
      setMessage("");
      setType("info");
    }, 2000);

    return function () {
      clearTimeout(timer);
    };
  }, [message]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [editingTrainerId, setEditingTrainerId] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  let trainerRecords = [];

  if (Array.isArray(trainers)) {
    trainerRecords = trainers;
  }

  let courseRecords = [];

  if (Array.isArray(courses)) {
    courseRecords = courses;
  }

  let studentRecords = [];

  if (Array.isArray(students)) {
    studentRecords = students;
  }

  let batchRecords = [];

  if (Array.isArray(batches)) {
    batchRecords = batches;
  }

  const normalizedTrainers = trainerRecords.map(function (trainer, index) {
    return normalizeTrainer(trainer, index);
  });

  useEffect(function () {
    const savedTrainers =
      JSON.parse(localStorage.getItem("lms-trainers")) || [];

    const savedCourses =
      JSON.parse(localStorage.getItem("lms-courses")) || [];

    const savedStudents =
      JSON.parse(localStorage.getItem("lms-students")) || [];

    const savedBatches =
      JSON.parse(localStorage.getItem("lms-batches")) || [];

    if (Array.isArray(savedTrainers)) {
      setTrainers(savedTrainers);
    } else {
      setTrainers([]);
    }

    if (Array.isArray(savedCourses)) {
      setCourses(savedCourses);
    } else {
      setCourses([]);
    }

    if (Array.isArray(savedStudents)) {
      setStudents(savedStudents);
    } else {
      setStudents([]);
    }

    if (Array.isArray(savedBatches)) {
      setBatches(savedBatches);
    } else {
      setBatches([]);
    }

    setIsLoaded(true);
  }, []);

  useEffect(function () {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-trainers", JSON.stringify(trainers));
  }, [trainers, isLoaded]);

  useEffect(function () {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-courses", JSON.stringify(courses));
  }, [courses, isLoaded]);

  useEffect(function () {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-students", JSON.stringify(students));
  }, [students, isLoaded]);

  useEffect(function () {
    if (!isLoaded) {
      return;
    }

    localStorage.setItem("lms-batches", JSON.stringify(batches));
  }, [batches, isLoaded]);

  let selectedTrainer = null;

  for (let i = 0; i < normalizedTrainers.length; i++) {
    if (normalizedTrainers[i].id === selectedTrainerId) {
      selectedTrainer = normalizedTrainers[i];
      break;
    }
  }

  let selectedTrainerCourses = [];

  if (selectedTrainer) {
    selectedTrainerCourses = courseRecords.filter(function (course) {
      let trainerName = "";

      if (course && course.trainerName) {
        trainerName = String(course.trainerName).trim();
      }

      return trainerName === selectedTrainer.name;
    });
  }

  let selectedTrainerStudents = [];

  if (selectedTrainer) {
    selectedTrainerStudents = studentRecords.filter(function (student) {
      let trainerName = "";

      if (student && student.trainerName) {
        trainerName = String(student.trainerName).trim();
      }

      return trainerName === selectedTrainer.name;
    });
  }

  const tableData = normalizedTrainers.map(function (trainer) {
    const trainerName = getTrainerDisplayName(trainer);

    const trainerCourses = courseRecords.filter(function (course) {
      let courseTrainerName = "";

      if (course && course.trainerName) {
        courseTrainerName = String(course.trainerName).trim();
      }

      return courseTrainerName === trainerName;
    });

    const trainerStudents = studentRecords.filter(function (student) {
      let studentTrainerName = "";

      if (student && student.trainerName) {
        studentTrainerName = String(student.trainerName).trim();
      }

      return studentTrainerName === trainerName;
    });

    return {
      ...trainer,
      studentCount: trainerStudents.length,
      courseCount: trainerCourses.length,
    };
  });

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setSpecialization("");
    setEditingTrainerId(null);
  }

  function selectTrainer(trainerId) {
    setSelectedTrainerId(trainerId);
  }

  function startEdit(trainer) {
    setSelectedTrainerId(trainer.id);
    setEditingTrainerId(trainer.id);

    setName(trainer.name || "");
    setEmail(trainer.email || "");
    setPassword(trainer.password || "");
    setSpecialization(trainer.specialization || "");
  }

  function cascadeTrainerNameChange(previousName, nextName) {
    if (!previousName || previousName === nextName) {
      return;
    }

    const updatedCourses = courses.map(function (course) {
      let trainerName = "";

      if (course && course.trainerName) {
        trainerName = String(course.trainerName).trim();
      }

      if (trainerName === previousName) {
        return {
          ...course,
          trainerName: nextName,
        };
      }

      return course;
    });

    setCourses(updatedCourses);

    const updatedStudents = students.map(function (student) {
      let trainerName = "";

      if (student && student.trainerName) {
        trainerName = String(student.trainerName).trim();
      }

      if (trainerName === previousName) {
        return {
          ...student,
          trainerName: nextName,
        };
      }

      return student;
    });

    setStudents(updatedStudents);

    const updatedBatches = batchRecords.map(function (batch) {
      let trainerName = "";

      if (batch && batch.trainerName) {
        trainerName = String(batch.trainerName).trim();
      }

      if (trainerName === previousName) {
        return {
          ...batch,
          trainerName: nextName,
        };
      }

      return batch;
    });

    setBatches(updatedBatches);
  }

  function handleDelete(id) {
    let trainerToDelete = null;

    for (let i = 0; i < normalizedTrainers.length; i++) {
      if (normalizedTrainers[i].id === id) {
        trainerToDelete = normalizedTrainers[i];
        break;
      }
    }

    if (trainerToDelete && trainerToDelete.email) {
      localStorage.removeItem(
        "lms-user-" + String(trainerToDelete.email).trim().toLowerCase()
      );
    }

    const updatedTrainers = trainerRecords.filter(function (trainer, index) {
      return normalizeTrainer(trainer, index).id !== id;
    });

    setTrainers(updatedTrainers);

    if (editingTrainerId === id) {
      resetForm();
    }

    if (selectedTrainerId === id) {
      setSelectedTrainerId(null);
    }

    if (trainerToDelete) {
      showMessage("Trainer deleted successfully.", "success");
    } else {
      showMessage("Trainer removed.", "success");
    }
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
  }

  function handleSpecializationChange(event) {
    setSpecialization(event.target.value);
  }

  function handleCancel() {
    resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedSpecialization = specialization.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSpecialization) {
      showMessage("Please fill in all required fields.", "danger");
      return;
    }

    if (!editingTrainerId && !trimmedPassword) {
      showMessage("Please fill in all required fields.", "danger");
      return;
    }

    let duplicateEmail = null;

    for (let i = 0; i < normalizedTrainers.length; i++) {
      const trainer = normalizedTrainers[i];

      if (
        trainer.email.toLowerCase() === trimmedEmail.toLowerCase() &&
        trainer.id !== editingTrainerId
      ) {
        duplicateEmail = trainer;
        break;
      }
    }

    if (duplicateEmail) {
      showMessage("Trainer email already exists.", "danger");
      return;
    }

    let existingTrainer = null;

    for (let i = 0; i < normalizedTrainers.length; i++) {
      if (normalizedTrainers[i].id === editingTrainerId) {
        existingTrainer = normalizedTrainers[i];
        break;
      }
    }

    let trainerPassword = "";

    if (trimmedPassword) {
      trainerPassword = trimmedPassword;
    } else {
      if (existingTrainer) {
        trainerPassword = existingTrainer.password;
      }
    }

    const nextTrainer = {
      id:
        editingTrainerId ||
        (trimmedEmail || "trainer") + "-" + Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      password: trainerPassword,
      specialization: trimmedSpecialization,
      assignedStudents: [],
      createdCourses: [],
    };

    if (existingTrainer) {
      nextTrainer.assignedStudents = existingTrainer.assignedStudents;
      nextTrainer.createdCourses = existingTrainer.createdCourses;
    }

    let updatedTrainers = [];

    if (editingTrainerId && existingTrainer) {
      for (let i = 0; i < trainerRecords.length; i++) {
        const trainer = trainerRecords[i];

        if (normalizeTrainer(trainer, i).id === editingTrainerId) {
          updatedTrainers.push(nextTrainer);
        } else {
          updatedTrainers.push(trainer);
        }
      }

      if (existingTrainer.name !== trimmedName) {
        cascadeTrainerNameChange(existingTrainer.name, trimmedName);
      }

      showMessage("Trainer updated successfully.", "success");
    } else {
      for (let i = 0; i < trainerRecords.length; i++) {
        updatedTrainers.push(trainerRecords[i]);
      }

      updatedTrainers.push(nextTrainer);

      showMessage("Trainer added successfully.", "success");
    }

    setTrainers(updatedTrainers);
    resetForm();
  }

  const tableColumns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "specialization", header: "Specialization" },
    { key: "studentCount", header: "Students" },
    { key: "courseCount", header: "Courses" },
  ];

  let messageElement = null;

  if (message) {
    messageElement = (
      <div className={`alert alert-${type}`} role="alert">
        {message}
      </div>
    );
  }

  let saveButtonText = "Add Trainer";

  if (editingTrainerId) {
    saveButtonText = "Update Trainer";
  }

  let passwordPlaceholder = "Enter password";

  if (editingTrainerId) {
    passwordPlaceholder = "Leave blank to keep current password";
  }

  let cancelButton = null;

  if (editingTrainerId) {
    cancelButton = (
      <CustomButton text="Cancel" onClick={handleCancel} />
    );
  }

  let selectedTrainerSection = null;

  if (selectedTrainer) {
    selectedTrainerSection = (
      <div className="mt-4">
        <h2 className="h5">Selected Trainer Details</h2>
        <p className="mb-1"><strong>Name:</strong> {selectedTrainer.name}</p>
        <p className="mb-1"><strong>Email:</strong> {selectedTrainer.email}</p>
        <p className="mb-1"><strong>Specialization:</strong> {selectedTrainer.specialization || "Not Available"}</p>
        <p className="mb-1"><strong>Assigned Students:</strong> {selectedTrainerStudents.length}</p>
        <p className="mb-1"><strong>Created Courses:</strong> {selectedTrainerCourses.length}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card p-3 shadow-sm">
        <h1 className="h4 mb-3">Trainer Management</h1>

        {messageElement}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter trainer name"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter trainer email"
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={handlePasswordChange}
                placeholder={passwordPlaceholder}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Specialization</label>
              <input
                type="text"
                className="form-control"
                value={specialization}
                onChange={handleSpecializationChange}
                placeholder="Enter specialization"
              />
            </div>
          </div>

          <div className="mt-3 d-flex flex-wrap gap-2">
            <CustomButton type="submit" text={saveButtonText} />
            {cancelButton}
          </div>
        </form>

        <hr className="my-4" />

        <div className="mb-3">
          <h2 className="h5">Trainer List</h2>
        </div>

        <DataTable
          columns={tableColumns}
          data={tableData}
          rowKey="id"
          renderActions={function (trainer) {
            return (
              <div className="d-flex flex-wrap gap-2">
                <CustomButton
                  text="Select"
                  onClick={function () {
                    selectTrainer(trainer.id);
                  }}
                />
                <CustomButton
                  text="Edit"
                  onClick={function () {
                    startEdit(trainer);
                  }}
                />
                <CustomButton
                  text="Delete"
                  onClick={function () {
                    handleDelete(trainer.id);
                  }}
                />
              </div>
            );
          }}
        />

        {selectedTrainerSection}
      </div>
    </div>
  );
}
