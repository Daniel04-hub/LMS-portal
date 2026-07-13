import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Shield, BookOpen, CheckCircle, Award, Trophy, Clock, Edit2, Camera } from "lucide-react";

export default function StudentProfile() {
  const { user, login } = useAuth();
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const normalizedEmail = (user?.email || "").trim().toLowerCase();
    const foundStudent = savedStudents.find(s => (s?.email || "").trim().toLowerCase() === normalizedEmail);
    
    if (foundStudent) {
      setStudent(foundStudent);
      setName(foundStudent.name || "");
      setEmail(foundStudent.email || "");
      setCollege(foundStudent.college || "");
    } else {
      setStudent({ name: user?.name, email: user?.email, college: "Not Specified", batch: "No Batch" });
      setName(user?.name || "");
      setEmail(user?.email || "");
      setCollege("Not Specified");
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMessage("Name and Email are required.");
      setType("danger");
      return;
    }
    
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const updatedStudents = savedStudents.map(s => {
      if ((s.email || "").toLowerCase() === (user.email || "").toLowerCase()) {
        return { ...s, name, email, college };
      }
      return s;
    });
    
    localStorage.setItem("lms-students", JSON.stringify(updatedStudents));
    login({ ...user, name, email });
    setMessage("Profile updated successfully!");
    setType("success");
  };

  if (!student) return <div className="container mt-4"><AlertMessage message="Loading..." type="info" /></div>;

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-1 text-gradient">My Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and view your progress.</p>
      </div>

      {message && <AlertMessage message={message} type={type} />}

      <div className="row g-4">
        {/* Left Column: Avatar & Quick Stats */}
        <div className="col-12 col-lg-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card text-center mb-4">
            <div className="position-relative d-inline-block mb-3">
              <div className="rounded-circle overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '120px', height: '120px', background: 'var(--glass-bg)', border: '2px solid var(--accent-color)' }}>
                <User size={64} color="var(--text-secondary)" />
              </div>
              <button className="btn btn-sm btn-danger rounded-circle position-absolute bottom-0 end-0 p-2 shadow">
                <Camera size={16} />
              </button>
            </div>
            <h4 className="fw-bold mb-1">{name}</h4>
            <p className="small mb-3" style={{ color: 'var(--text-secondary)' }}>{student.batch || "Independent Learner"}</p>
            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className="premium-badge bg-info text-info bg-opacity-25 border-0"><BookOpen size={14} className="me-1"/> 4 Courses</span>
              <span className="premium-badge bg-success text-success bg-opacity-25 border-0"><Award size={14} className="me-1"/> 2 Certs</span>
            </div>
            <hr style={{ borderColor: 'var(--glass-border)' }} />
            <div className="text-start mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Overall Rank</span>
                <span className="small fw-bold text-warning"><Trophy size={14} className="me-1"/> Top 10%</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="small text-muted">Total Hours</span>
                <span className="small fw-bold"><Clock size={14} className="me-1"/> 124 hrs</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
            <h5 className="fw-bold mb-3">Recent Badges</h5>
            <div className="d-flex flex-wrap gap-2">
              <div className="bg-warning bg-opacity-10 p-2 rounded text-center flex-grow-1" style={{ border: '1px solid var(--glass-border)' }}>
                <Trophy size={24} color="var(--warning-color)" className="mb-1" />
                <div style={{ fontSize: '0.7rem' }}>React Pro</div>
              </div>
              <div className="bg-info bg-opacity-10 p-2 rounded text-center flex-grow-1" style={{ border: '1px solid var(--glass-border)' }}>
                <Award size={24} color="#0dcaf0" className="mb-1" />
                <div style={{ fontSize: '0.7rem' }}>Fast Learner</div>
              </div>
              <div className="bg-success bg-opacity-10 p-2 rounded text-center flex-grow-1" style={{ border: '1px solid var(--glass-border)' }}>
                <CheckCircle size={24} color="var(--success-color)" className="mb-1" />
                <div style={{ fontSize: '0.7rem' }}>Perfect Test</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Edit Profile & Timeline */}
        <div className="col-12 col-lg-8">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card mb-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><Edit2 size={18} /> Edit Profile</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small text-muted">Full Name</label>
                  <div className="position-relative">
                    <User className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="text" className="modern-input ps-5" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted">Email Address</label>
                  <div className="position-relative">
                    <Mail className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="email" className="modern-input ps-5" value={email} onChange={e => setEmail(e.target.value)} disabled />
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>Email cannot be changed.</small>
                </div>
                <div className="col-md-12">
                  <label className="form-label small text-muted">College / University</label>
                  <div className="position-relative">
                    <Shield className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="text" className="modern-input ps-5" value={college} onChange={e => setCollege(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="mt-4 text-end">
                <button type="submit" className="btn btn-danger px-4 rounded-pill fw-bold">Save Changes</button>
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card">
            <h5 className="fw-bold mb-4">Activity Timeline</h5>
            <div className="position-relative ps-4 border-start border-secondary border-opacity-25">
              {[
                { title: "Earned Certificate", desc: "Advanced UI/UX Design", time: "2 days ago", icon: Award, color: "success" },
                { title: "Completed Module", desc: "React Hooks Deep Dive", time: "5 days ago", icon: BookOpen, color: "primary" },
                { title: "Submitted Project", desc: "E-Commerce Dashboard", time: "1 week ago", icon: CheckCircle, color: "info" }
              ].map((act, i) => (
                <div key={i} className="mb-4 position-relative">
                  <span className={`position-absolute top-0 start-0 translate-middle p-2 bg-${act.color} rounded-circle d-flex align-items-center justify-content-center shadow`} style={{ marginLeft: '-1.5rem', width: '32px', height: '32px' }}>
                    <act.icon size={14} color="#fff" />
                  </span>
                  <div>
                    <h6 className="fw-semibold mb-1">{act.title}</h6>
                    <p className="small mb-1" style={{ color: 'var(--text-secondary)' }}>{act.desc}</p>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{act.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


