import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { Users, UserPlus, FileText, CheckCircle, Mail, School, BookOpen, Key, Eye, EyeOff, Copy, ClipboardList, AlertTriangle, GraduationCap, Layers } from "lucide-react";

function getStatusBadgeClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "completed" || value === "approved" || value === "active") return "badge-success";
  if (value === "in progress" || value === "pending" || value === "reviewed") return "badge-warning";
  if (value === "not started" || value === "submitted") return "badge-secondary";
  return "badge-danger";
}

export default function StudentCreation() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const [formValues, setFormValues] = useState({
    name: "", email: "", password: "", college: "", batch: "",
  });
  const [latestCredentials, setLatestCredentials] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [bulkInput, setBulkInput] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const savedBatches = JSON.parse(localStorage.getItem("lms-batches")) || [];
    setStudents(Array.isArray(savedStudents) ? savedStudents : []);
    setBatches(Array.isArray(savedBatches) ? savedBatches : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("lms-students", JSON.stringify(students));
  }, [students, isLoaded]);

  const visibleStudents = students.filter((s) => s.trainerName === user?.name);
  const visibleBatches = Array.isArray(batches) ? batches : [];
  const selectedBatch = visibleBatches.find((b) => b.batchName === formValues.batch) || null;

  const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

  const parseBulkStudents = (input) => {
    const lines = String(input || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const existingEmails = new Set(visibleStudents.map(s => normalizeEmail(s.email)));
    const seenEmails = new Set();

    return lines.map((line, index) => {
      const columns = line.split(",").map(p => p.trim());
      const [nameRaw = "", emailRaw = "", collegeRaw = "", batchRaw = ""] = columns;
      const name = nameRaw; const email = normalizeEmail(emailRaw); const college = collegeRaw; const batch = batchRaw;
      const password = "123456";
      const invalidFormat = columns.length < 4;
      const missingValues = !name || !email || !college || !batch;
      
      let status = "Ready"; let reason = "Will be created";
      if (invalidFormat || missingValues) { status = "Invalid"; reason = "Expected name,email,college,batch"; }
      else if (existingEmails.has(email)) { status = "Duplicate"; reason = "Email already exists"; }
      else if (seenEmails.has(email)) { status = "Duplicate"; reason = "Duplicate in pasted batch"; }
      
      seenEmails.add(email);
      return { id: `${index}-${email || line}`, rowNumber: index + 1, name, email, college, batch, password, status, reason, isReady: status === "Ready" };
    });
  };

  const bulkPreview = parseBulkStudents(bulkInput);
  const bulkReadyRows = bulkPreview.filter(r => r.isReady);
  const bulkBlockedRows = bulkPreview.filter(r => !r.isReady);

  const handleChange = (key) => (event) => {
    const nextValue = event.target.value;
    if (key === "batch") {
      const matchedBatch = visibleBatches.find(b => b.batchName === nextValue);
      setFormValues(prev => ({ ...prev, batch: nextValue, college: matchedBatch?.college || prev.college }));
      return;
    }
    setFormValues(prev => ({ ...prev, [key]: nextValue }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const name = formValues.name.trim(); const normalizedEmail = formValues.email.trim().toLowerCase();
    const password = formValues.password.trim() || "123456"; const college = formValues.college.trim(); const batch = formValues.batch.trim();

    if (!name || !normalizedEmail || !college || !batch) { setMessage("Please fill in all required fields."); setType("danger"); return; }
    
    if (visibleStudents.some(s => s.email.toLowerCase() === normalizedEmail)) {
        setMessage("Student with this email already exists."); setType("danger"); return;
    }

    const newStudent = {
      id: Date.now(), name, email: normalizedEmail, password, college, batch,
      batchStartDate: selectedBatch?.startDate || "", batchEndDate: selectedBatch?.endDate || "", batchStatus: selectedBatch?.status || "",
      trainerName: user?.name || "", assignedCourse: "", courseStatus: "Not Started", courseProgress: 0,
    };

    localStorage.setItem("lms-user-" + normalizedEmail, JSON.stringify({ name, email: normalizedEmail, password, role: "student" }));
    setStudents([...students, newStudent]);
    setFormValues({ name: "", email: "", password: "", college: "", batch: "" });
    setLatestCredentials({ email: normalizedEmail, password });
    setMessage("Student added successfully."); setType("success");
  };

  const handleBulkSubmit = (event) => {
    event.preventDefault();
    if (!bulkPreview.length) { setMessage("Paste student data before saving bulk entries."); setType("danger"); return; }
    if (!bulkReadyRows.length) { setMessage("No valid bulk student rows to save."); setType("danger"); return; }

    const newStudents = bulkReadyRows.map((row) => ({
      id: Date.now() + Math.random(), name: row.name, email: row.email, password: row.password, college: row.college, batch: row.batch,
      batchStartDate: visibleBatches.find(b => b.batchName === row.batch)?.startDate || "",
      batchEndDate: visibleBatches.find(b => b.batchName === row.batch)?.endDate || "",
      batchStatus: visibleBatches.find(b => b.batchName === row.batch)?.status || "",
      trainerName: user?.name || "", assignedCourse: "", courseStatus: "Not Started", courseProgress: 0,
    }));

    newStudents.forEach((student) => {
      localStorage.setItem("lms-user-" + student.email, JSON.stringify({ name: student.name, email: student.email, password: student.password, role: "student" }));
    });

    setStudents([...students, ...newStudents]);
    setBulkInput("");
    setMessage(`Created ${newStudents.length} student(s) successfully.`); setType("success");
  };

  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); setMessage("Copied successfully"); setType("success"); } 
    catch (error) { setMessage("Unable to copy."); setType("danger"); }
  };

  const togglePasswordVisibility = (studentId) => {
    setVisiblePasswords(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  // Stats calculation
  const totalStudents = visibleStudents.length;
  const activeStudents = visibleStudents.filter(s => s.courseStatus !== "Completed").length;
  const totalBatches = new Set(visibleStudents.map(s => s.batch)).size;
  const completedStudents = visibleStudents.filter(s => s.courseStatus === "Completed").length;
  const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1 text-gradient">Student Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and onboard students efficiently.</p>
        </div>
      </div>

      {/* Stats Hero */}
      <div className="row g-3 mb-5">
        {[
          { label: "Total Students", value: totalStudents, icon: Users, color: "var(--accent-color)" },
          { label: "Active Students", value: activeStudents, icon: UserPlus, color: "#4CAF50" },
          { label: "Total Batches", value: totalBatches, icon: Layers, color: "#2196F3" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: CheckCircle, color: "#FF9800" }
        ].map((stat, i) => (
          <div key={i} className="col-12 col-md-6 col-xl-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card d-flex align-items-center gap-3 p-4 h-100">
              <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                <stat.icon size={24} />
              </div>
              <div>
                <h3 className="fw-bold mb-0 text-white">{stat.value}</h3>
                <small className="text-muted text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '0.75rem' }}>{stat.label}</small>
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {message && <AlertMessage message={message} type={type} />}

      <div className="row g-4">
        {/* Creation Form */}
        <div className="col-12 col-lg-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card sticky-top" style={{ top: '100px' }}>
            <div className="d-flex gap-3 border-bottom pb-3 mb-4" style={{ borderColor: 'var(--glass-border) !important' }}>
              <button onClick={() => setActiveTab("single")} className={`btn fw-bold px-0 position-relative ${activeTab === 'single' ? 'text-white' : 'text-muted'}`} style={{ border: 'none', background: 'transparent' }}>
                Single Registration
                {activeTab === 'single' && <motion.div layoutId="tab-indicator" className="position-absolute bottom-0 start-0 w-100" style={{ height: '2px', background: 'var(--accent-color)', marginBottom: '-17px' }} />}
              </button>
              <button onClick={() => setActiveTab("bulk")} className={`btn fw-bold px-0 position-relative ${activeTab === 'bulk' ? 'text-white' : 'text-muted'}`} style={{ border: 'none', background: 'transparent' }}>
                Bulk Import
                {activeTab === 'bulk' && <motion.div layoutId="tab-indicator" className="position-absolute bottom-0 start-0 w-100" style={{ height: '2px', background: 'var(--accent-color)', marginBottom: '-17px' }} />}
              </button>
            </div>

            {activeTab === "single" ? (
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label small text-muted">Full Name</label>
                  <div className="position-relative">
                    <Users className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="text" className="modern-input ps-5" value={formValues.name} onChange={handleChange("name")} placeholder="e.g. John Doe" required />
                  </div>
                </div>

                <div>
                  <label className="form-label small text-muted">Email Address</label>
                  <div className="position-relative">
                    <Mail className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="email" className="modern-input ps-5" value={formValues.email} onChange={handleChange("email")} placeholder="john@example.com" required />
                  </div>
                </div>

                <div>
                  <label className="form-label small text-muted">College / Institution</label>
                  <div className="position-relative">
                    <School className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="text" className="modern-input ps-5" value={formValues.college} onChange={handleChange("college")} placeholder="e.g. Stanford University" required />
                  </div>
                </div>

                {visibleBatches.length > 0 && (
                  <div>
                    <label className="form-label small text-muted">Select Batch</label>
                    <div className="position-relative">
                      <Layers className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                      <select className="modern-input ps-5" value={formValues.batch} onChange={handleChange("batch")} required>
                        <option value="" disabled>-- Select a Batch --</option>
                        {visibleBatches.map(b => <option key={b.id} value={b.batchName}>{b.batchName}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                
                {selectedBatch && (
                  <div className="p-3 rounded mt-2" style={{ background: 'var(--accent-hover)', border: '1px solid var(--accent-color)' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <BookOpen size={14} color="var(--accent-color)" />
                      <span className="small fw-bold text-white">Batch Details: {selectedBatch.status}</span>
                    </div>
                    <div className="small text-muted">
                      {selectedBatch.startDate} to {selectedBatch.endDate}
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label small text-muted">Temporary Password (Optional)</label>
                  <div className="position-relative">
                    <Key className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="text" className="modern-input ps-5" value={formValues.password} onChange={handleChange("password")} placeholder="Leave blank for '123456'" />
                  </div>
                </div>

                <button type="submit" className="btn btn-danger w-100 py-3 rounded-3 fw-bold mt-2 d-flex justify-content-center align-items-center gap-2">
                  <UserPlus size={18}/> Onboard Student
                </button>
              </form>
            ) : (
              <form onSubmit={handleBulkSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label small text-muted">Bulk Import Data (CSV Format)</label>
                  <div className="position-relative">
                    <ClipboardList className="position-absolute top-0 mt-3 ms-3" size={16} color="var(--text-secondary)" />
                    <textarea className="modern-input ps-5" rows="6" value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} placeholder="name, email, college, batch&#10;John Doe, john@example.com, SNS College, Batch A" style={{ fontFamily: 'monospace' }} />
                  </div>
                  <small className="text-muted d-block mt-2">Format: Name, Email, College, Batch</small>
                </div>

                {bulkPreview.length > 0 && (
                  <div className="d-flex gap-2">
                    <div className="p-2 rounded flex-grow-1 text-center" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                      <span className="fw-bold">{bulkReadyRows.length}</span> Valid
                    </div>
                    <div className="p-2 rounded flex-grow-1 text-center" style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#f44336', border: '1px solid rgba(244, 67, 54, 0.2)' }}>
                      <span className="fw-bold">{bulkBlockedRows.length}</span> Blocked
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2 mt-2">
                  <button type="submit" className="btn btn-danger flex-grow-1 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2">
                    <FileText size={18}/> Process Import
                  </button>
                  {bulkInput && <button type="button" onClick={() => setBulkInput("")} className="btn glass-panel py-3 rounded-3 fw-bold px-4">Clear</button>}
                </div>
              </form>
            )}

            {/* Latest Credentials Card */}
            {latestCredentials && activeTab === "single" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-4 mt-4" style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <h6 className="fw-bold text-success mb-3 d-flex align-items-center gap-2"><CheckCircle size={18}/> Student Created!</h6>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Email:</span>
                  <span className="text-white fw-bold">{latestCredentials.email}</span>
                </div>
                <div className="mb-4 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Password:</span>
                  <span className="text-white fw-bold">{latestCredentials.password}</span>
                </div>
                <button onClick={() => copyText(`Email: ${latestCredentials.email}\nPassword: ${latestCredentials.password}`)} className="btn btn-sm btn-success w-100 py-2 d-flex justify-content-center align-items-center gap-2 rounded-3">
                  <Copy size={16}/> Copy Credentials
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* List & Bulk Preview */}
        <div className="col-12 col-lg-7">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card h-100">
            {activeTab === "bulk" && bulkPreview.length > 0 ? (
              <>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <AlertTriangle size={20} color="var(--accent-color)" /> Import Preview
                </h5>
                <div className="table-responsive rounded-3" style={{ border: '1px solid var(--glass-border)' }}>
                  <table className="table table-dark table-hover mb-0" style={{ background: 'transparent' }}>
                    <thead style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <tr>
                        <th className="bg-transparent text-muted fw-normal">Row</th>
                        <th className="bg-transparent text-muted fw-normal">Name</th>
                        <th className="bg-transparent text-muted fw-normal">Email</th>
                        <th className="bg-transparent text-muted fw-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((row) => (
                        <tr key={row.id}>
                          <td className="bg-transparent border-0">{row.rowNumber}</td>
                          <td className="bg-transparent border-0">{row.name || "-"}</td>
                          <td className="bg-transparent border-0">{row.email || "-"}</td>
                          <td className="bg-transparent border-0">
                            <span className={`badge rounded-pill ${row.status === "Ready" ? "bg-success" : "bg-danger"}`}>
                              {row.status}
                            </span>
                            {row.reason && <small className="d-block text-muted mt-1">{row.reason}</small>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <Users size={20} color="var(--accent-color)" /> Enrolled Students
                </h5>

                {visibleStudents.length === 0 ? (
                  <div className="text-center p-5 rounded h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', minHeight: '400px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎓</div>
                    <h4 className="fw-bold text-white mb-2">No Students Added Yet</h4>
                    <p className="text-muted mb-0 max-w-sm mx-auto">Start by creating your first student using the form on the left, or bulk import a CSV list.</p>
                  </div>
                ) : (
                  <DataTable
                    rowKey="id"
                    columns={[
                      { key: "name", header: "Name", render: (s) => <div className="fw-bold text-white">{s.name}</div> },
                      { key: "email", header: "Email" },
                      { key: "batch", header: "Batch", render: (s) => <span className="badge" style={{ background: 'var(--glass-border)' }}>{s.batch}</span> },
                      {
                        key: "password",
                        header: "Access",
                        render: (student) => {
                          const isVisible = Boolean(visiblePasswords[student.id]);
                          return (
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ width: '60px', fontFamily: 'monospace' }}>{isVisible ? student.password : "••••••"}</span>
                              <button onClick={() => togglePasswordVisibility(student.id)} className="btn btn-sm btn-icon text-muted p-0" style={{ background: 'transparent', border: 'none' }}>
                                {isVisible ? <EyeOff size={14}/> : <Eye size={14}/>}
                              </button>
                            </div>
                          );
                        },
                      },
                      {
                        key: "courseStatus",
                        header: "Status",
                        render: (student) => (
                          <span className={`badge rounded-pill ${getStatusBadgeClass(student.courseStatus)}`} style={{ padding: '0.4em 0.8em' }}>
                            {student.courseStatus}
                          </span>
                        ),
                      },
                    ]}
                    data={visibleStudents}
                  />
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}




