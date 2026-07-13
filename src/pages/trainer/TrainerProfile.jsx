import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Lock, Camera, BookOpen, Star, Users, Briefcase } from "lucide-react";

export default function TrainerProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const [formValues, setFormValues] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("lms-trainer-profile"));
    const savedTrainers = JSON.parse(localStorage.getItem("lms-trainers")) || [];

    setProfile(savedProfile && typeof savedProfile === "object" ? savedProfile : null);
    setTrainers(Array.isArray(savedTrainers) ? savedTrainers : []);
  }, []);

  useEffect(() => {
    const trainerRecord = trainers.find((item) => item.email === user?.email) || null;
    const userRecord = user?.email ? JSON.parse(localStorage.getItem("lms-user-" + String(user.email).trim().toLowerCase())) : null;
    const source = trainerRecord || profile || user;

    setFormValues({
      name: source?.name || "",
      email: source?.email || "",
      password: String(userRecord?.password || trainerRecord?.password || profile?.password || ""),
    });
  }, [profile, trainers, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formValues.name.trim();
    const email = formValues.email.trim().toLowerCase();
    const password = formValues.password.trim();
    const previousEmail = String(profile?.email || user?.email || "").trim().toLowerCase();

    if (!name || !email || !password) {
      setMessage("Please fill in all required fields.");
      setType("danger");
      return;
    }

    if (previousEmail && previousEmail !== email) {
      localStorage.removeItem("lms-user-" + String(previousEmail).trim().toLowerCase());
    }

    localStorage.setItem(
      "lms-user-" + String(email).trim().toLowerCase(),
      JSON.stringify({ name, email, password, role: "trainer" })
    );

    const updatedTrainers = trainers.map((trainer) =>
      String(trainer?.email || "").trim().toLowerCase() === previousEmail
        ? { ...trainer, name, email, password }
        : trainer
    );

    const nextProfile = { name, email, password, role: "trainer" };

    setTrainers(updatedTrainers);
    localStorage.setItem("lms-trainers", JSON.stringify(updatedTrainers));
    setProfile(nextProfile);
    localStorage.setItem("lms-trainer-profile", JSON.stringify(nextProfile));
    login({ name, email, role: "trainer" });
    setMessage("Profile updated successfully.");
    setType("success");
  };

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-1 text-gradient">Instructor Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details and view your teaching metrics.</p>
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
            <h4 className="fw-bold mb-1">{formValues.name}</h4>
            <p className="small mb-3" style={{ color: 'var(--text-secondary)' }}>Senior Instructor</p>
            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className="premium-badge bg-primary text-primary bg-opacity-25 border-0"><Briefcase size={14} className="me-1"/> Subject Expert</span>
            </div>
            <hr style={{ borderColor: 'var(--glass-border)' }} />
            <div className="text-start mt-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Total Students</span>
                <span className="small fw-bold"><Users size={14} className="me-1"/> 1,240</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="small text-muted">Courses Created</span>
                <span className="small fw-bold"><BookOpen size={14} className="me-1"/> 8</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="small text-muted">Avg. Rating</span>
                <span className="small fw-bold text-warning"><Star size={14} className="me-1"/> 4.9/5</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Edit Profile */}
        <div className="col-12 col-lg-8">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card mb-4">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><User size={18} /> Account Details</h5>
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label small text-muted">Full Name</label>
                  <div className="position-relative">
                    <User className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input 
                      type="text" 
                      className="modern-input ps-5" 
                      value={formValues.name} 
                      onChange={e => setFormValues(prev => ({...prev, name: e.target.value}))} 
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted">Email Address</label>
                  <div className="position-relative">
                    <Mail className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input 
                      type="email" 
                      className="modern-input ps-5" 
                      value={formValues.email} 
                      onChange={e => setFormValues(prev => ({...prev, email: e.target.value}))} 
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <label className="form-label small text-muted">Password</label>
                  <div className="position-relative">
                    <Lock className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input 
                      type="password" 
                      className="modern-input ps-5" 
                      value={formValues.password} 
                      onChange={e => setFormValues(prev => ({...prev, password: e.target.value}))} 
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 text-end">
                <button type="submit" className="btn btn-danger px-5 py-2 rounded-pill fw-bold">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}



