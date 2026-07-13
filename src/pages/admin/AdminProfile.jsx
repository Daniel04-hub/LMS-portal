import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { User, Mail, Lock, Camera, Shield, Settings, Activity } from "lucide-react";

const DEFAULT_AVATAR = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22160%22%20height%3D%22160%22%20viewBox%3D%220%200%20160%20160%22%3E%3Crect%20width%3D%22160%22%20height%3D%22160%22%20fill%3D%22%231A1A1A%22%2F%3E%3Ccircle%20cx%3D%2280%22%20cy%3D%2264%22%20r%3D%2230%22%20fill%3D%22%23333%22%2F%3E%3Cpath%20d%3D%22M25%20150c9-32%2037-46%2055-46s46%2014%2055%2046%22%20fill%3D%22%23333%22%2F%3E%3C%2Fsvg%3E";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

export default function AdminProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const savedProfile = JSON.parse(localStorage.getItem("lms-admin-profile")) || null;
    setProfile(savedProfile);
    
    const source = savedProfile || user;
    setName(source?.name || "");
    setEmail(source?.email || "");
    setPassword("");
    setProfileImage(savedProfile?.profileImage || "");
  }, [user]);

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    try {
      const image = await readFileAsDataUrl(file);
      setProfileImage(image);
      setMessage("");
    } catch (error) {
      setMessage("Unable to upload image.");
      setType("danger");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMessage("Name and Email are required.");
      setType("danger");
      return;
    }

    const previousUserKey = "lms-user-" + String(profile?.email || user?.email || "").trim().toLowerCase();
    const currentUserKey = "lms-user-" + email.trim().toLowerCase();

    if (previousUserKey !== currentUserKey) localStorage.removeItem(previousUserKey);

    const nextProfile = { name: name.trim(), email: email.trim().toLowerCase(), role: "admin", password: password.trim() || profile?.password || "123", profileImage };
    
    localStorage.setItem(currentUserKey, JSON.stringify(nextProfile));
    localStorage.setItem("lms-admin-profile", JSON.stringify(nextProfile));
    
    setProfile(nextProfile);
    login({ name: nextProfile.name, email: nextProfile.email, role: "admin" });
    setMessage("Profile updated successfully.");
    setType("success");
  };

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-1 text-gradient">Administrator Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your executive account settings and platform access.</p>
      </div>

      {message && <AlertMessage message={message} type={type} />}

      <div className="row g-4">
        {/* Left Column: Avatar */}
        <div className="col-12 col-lg-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card text-center mb-4">
            <div className="position-relative d-inline-block mb-3">
              <div className="rounded-circle overflow-hidden d-flex justify-content-center align-items-center" style={{ width: '140px', height: '140px', background: 'var(--glass-bg)', border: '2px solid var(--accent-color)' }}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-100 h-100 object-fit-cover" />
                ) : (
                  <img src={DEFAULT_AVATAR} alt="Default" className="w-100 h-100 object-fit-cover opacity-50" />
                )}
              </div>
              <label className="btn btn-sm btn-danger rounded-circle position-absolute bottom-0 end-0 p-2 shadow cursor-pointer">
                <Camera size={16} />
                <input type="file" className="d-none" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <h4 className="fw-bold mb-1">{name || "Admin User"}</h4>
            <p className="small mb-3" style={{ color: 'var(--accent-color)' }}>Super Administrator</p>
            <div className="d-flex justify-content-center gap-2 mb-4">
              <span className="premium-badge bg-danger text-danger bg-opacity-25 border-0"><Shield size={14} className="me-1"/> Full Access</span>
            </div>
            <hr style={{ borderColor: 'var(--glass-border)' }} />
            <div className="text-start mt-3">
              <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
                <Activity size={14} /> System Status: <span className="text-success fw-bold ms-auto">Online</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted small">
                <Settings size={14} /> Last Login: <span className="fw-bold ms-auto">Just now</span>
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
                    <input type="text" className="modern-input ps-5" value={name} onChange={e => setName(e.target.value)} placeholder="Admin Name" />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted">Email Address</label>
                  <div className="position-relative">
                    <Mail className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="email" className="modern-input ps-5" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@danilms.com" />
                  </div>
                </div>
                <div className="col-md-12">
                  <label className="form-label small text-muted">Change Password</label>
                  <div className="position-relative">
                    <Lock className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="password" className="modern-input ps-5" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
                  </div>
                </div>
              </div>
              <div className="mt-5 text-end">
                <button type="submit" className="btn btn-danger px-5 py-2 rounded-pill fw-bold">Save Configuration</button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
