import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle, Clock, XCircle, Info, BookOpen, User, Tag, FileUp } from "lucide-react";

const ASSIGNMENT_ACCEPT = "image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx";

function getBadge(status) {
  var value = (status || "").toLowerCase();
  if (value === "completed" || value === "approved" || value === "active") return "premium-badge bg-success bg-opacity-25 text-success border-0";
  if (value === "in progress" || value === "pending" || value === "reviewed") return "premium-badge bg-warning bg-opacity-25 text-warning border-0";
  if (value === "not started" || value === "submitted") return "premium-badge bg-secondary bg-opacity-25 text-secondary border-0";
  return "premium-badge bg-danger bg-opacity-25 text-danger border-0";
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function formatDate() {
  var date = new Date();
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');
  var seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function AssignmentUpload() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = () => {
    setStudents(JSON.parse(localStorage.getItem("lms-students")) || []);
    setAssignments(JSON.parse(localStorage.getItem("lms-assignments")) || []);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (!e.key || ["lms-students", "lms-assignments"].includes(e.key)) loadData();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", loadData);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  const userEmail = user?.email || "";
  const userName = user?.name || "";
  const student = students.find(s => String(s?.email).trim().toLowerCase() === userEmail.trim().toLowerCase()) || {};
  const assignedCourse = student?.assignedCourse || "Not Assigned";

  const visibleAssignments = assignments
    .filter(item => String(item.studentEmail).trim().toLowerCase() === userEmail.trim().toLowerCase())
    .sort((a, b) => (parseInt(b.id, 10) || 0) - (parseInt(a.id, 10) || 0));

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setFileInputKey(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage("Please select a file to upload."); setType("danger");
      return;
    }
    setIsSubmitting(true);

    try {
      const fileData = await readFile(selectedFile);
      const newAssignment = {
        id: Date.now(),
        studentName: userName,
        studentEmail: userEmail,
        courseTitle: assignedCourse,
        trainerName: student.trainerName || "",
        title: title.trim(),
        description: description.trim(),
        fileName: selectedFile.name,
        fileType: selectedFile.type || "application/octet-stream",
        fileData: fileData,
        submittedAt: formatDate(),
        status: "Submitted",
        reviewComment: "",
      };

      const updatedAssignments = [newAssignment, ...assignments];
      setAssignments(updatedAssignments);
      localStorage.setItem("lms-assignments", JSON.stringify(updatedAssignments));

      handleReset();
      setMessage("Assignment uploaded successfully."); setType("success");
    } catch (error) {
      setMessage("Unable to upload file. Please try again."); setType("danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { key: "title", header: "Title", render: (item) => <span className="fw-bold">{item.title}</span> },
    { key: "courseTitle", header: "Course", render: (item) => <span className="text-muted small">{item.courseTitle}</span> },
    {
      key: "fileName", header: "File",
      render: (item) => item.fileData ? (
        <a href={item.fileData} target="_blank" rel="noreferrer" className="text-decoration-none d-flex align-items-center gap-1" style={{ color: 'var(--accent-color)' }}>
          <FileText size={14} /> {item.fileName}
        </a>
      ) : <span className="text-muted">No file</span>
    },
    { key: "submittedAt", header: "Submitted At", render: (item) => <span className="small text-muted">{item.submittedAt}</span> },
    { key: "status", header: "Status", render: (item) => <span className={getBadge(item.status)}>{item.status || "Pending"}</span> },
    { key: "reviewComment", header: "Feedback", render: (item) => <span className="small">{item.reviewComment || <span className="text-muted">No comments yet</span>}</span> }
  ];

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-1 text-gradient">Assignment Submission</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your course assignments and track your evaluations.</p>
      </div>

      {message && <AlertMessage message={message} type={type} />}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><UploadCloud size={20} color="var(--accent-color)" /> Submit New Assignment</h5>
            
            <div className="p-3 rounded mb-4" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
              <div className="d-flex align-items-center gap-2 mb-2"><User size={16} color="var(--text-secondary)" /> <span className="small fw-semibold">{userName}</span></div>
              <div className="d-flex align-items-center gap-2"><BookOpen size={16} color="var(--text-secondary)" /> <span className="small text-muted">{assignedCourse}</span></div>
            </div>

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="form-label small text-muted">Assignment Title</label>
                <div className="position-relative">
                  <Tag className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                  <input 
                    type="text" className="modern-input ps-5" 
                    value={title} onChange={(e) => setTitle(e.target.value)} 
                    placeholder="E.g., Week 1 React Project" required 
                  />
                </div>
              </div>

              <div>
                <label className="form-label small text-muted">Description & Notes</label>
                <textarea 
                  className="modern-input" rows="3" 
                  value={description} onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Add any notes for your instructor..." required 
                />
              </div>

              <div>
                <label className="form-label small text-muted">Upload Document</label>
                <div className="position-relative">
                  <input 
                    key={fileInputKey} type="file" className="modern-input d-none" id="fileUpload"
                    accept={ASSIGNMENT_ACCEPT} onChange={(e) => setSelectedFile(e.target.files[0] || null)} required 
                  />
                  <label htmlFor="fileUpload" className="modern-input d-flex align-items-center justify-content-center gap-2 cursor-pointer border-dashed" style={{ borderStyle: 'dashed', background: 'var(--glass-bg)', padding: '1.5rem' }}>
                    <FileUp size={24} color={selectedFile ? "var(--success-color)" : "var(--text-secondary)"} />
                    <span style={{ color: selectedFile ? "var(--success-color)" : "var(--text-secondary)" }}>
                      {selectedFile ? selectedFile.name : "Click to browse files"}
                    </span>
                  </label>
                </div>
                <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>Supported: PDF, DOCX, PPTX, Images</small>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-danger w-100 py-3 mt-2 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2">
                {isSubmitting ? "Uploading..." : <><UploadCloud size={18} /> Submit Assignment</>}
              </button>
            </form>
          </motion.div>
        </div>

        <div className="col-12 col-lg-7">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><Clock size={20} color="var(--accent-color)" /> Submission History</h5>
            {visibleAssignments.length > 0 ? (
              <div className="table-responsive">
                <DataTable rowKey="id" columns={columns} data={visibleAssignments} />
              </div>
            ) : (
              <div className="text-center p-5" style={{ background: 'var(--glass-bg)', borderRadius: '1rem' }}>
                <FileText size={48} color="var(--text-secondary)" className="mb-3 opacity-50" />
                <h6 className="text-muted">No assignments submitted yet</h6>
                <p className="small text-muted mb-0">Your submitted work and evaluations will appear here.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}


