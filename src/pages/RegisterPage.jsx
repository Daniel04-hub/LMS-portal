import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import AlertMessage from "../components/AlertMessage";
import Logo from "../components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Settings, User, Mail, Lock, ArrowRight, ArrowLeft, Shield, CheckCircle } from "lucide-react";

const ROLES = ["student", "trainer", "admin"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, changeTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    const r = (user?.role || "").toLowerCase();
    if (r === "admin") navigate("/admin", { replace: true });
    else if (r === "trainer") navigate("/trainer", { replace: true });
    else if (r === "student") navigate("/student", { replace: true });
  }, [navigate, user]);

  const handleNext = () => {
    setError("");
    if (step === 1) {
      if (!name.trim()) return setError("Please enter your full name.");
      if (!email.trim()) return setError("Please enter your email address.");
      setStep(2);
    }
  };

  const handleBack = () => { setError(""); setStep(1); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!password || password.length < 3) return setError("Password must be at least 3 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!ROLES.includes(role)) return setError("Please select a valid role.");

    const key = "lms-user-" + email.trim().toLowerCase();
    if (localStorage.getItem(key)) return setError("An account with this email already exists.");

    localStorage.setItem(key, JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }));
    setSuccess("Account created successfully!");
    setTimeout(() => navigate("/login", { replace: true }), 1500);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-vh-100 d-flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <motion.div 
        initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
        className="d-none d-lg-flex col-lg-6 position-relative flex-column justify-content-center p-5 text-white"
        style={{ background: `linear-gradient(135deg, var(--accent-color) 0%, var(--bg-primary) 100%)`, borderRight: '1px solid var(--glass-border)' }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, var(--accent-hover) 0%, transparent 50%)', filter: 'blur(60px)' }} />
        <div className="position-relative z-1">
          <Logo size="xl" className="mb-4" />
          <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Join the <br/><span className="text-white">Future of Learning</span></h1>
          <p className="lead mb-5" style={{ color: 'var(--text-secondary)' }}>Get access to world-class resources, expert instructors, and a premium educational journey.</p>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3"><CheckCircle color="var(--success-color)" /><span style={{ color: 'var(--text-secondary)' }}>Industry recognized certificates</span></div>
            <div className="d-flex align-items-center gap-3"><CheckCircle color="var(--success-color)" /><span style={{ color: 'var(--text-secondary)' }}>AI-powered personalized paths</span></div>
            <div className="d-flex align-items-center gap-3"><CheckCircle color="var(--success-color)" /><span style={{ color: 'var(--text-secondary)' }}>Interactive coding environments</span></div>
          </div>
        </div>
      </motion.div>

      <div className="col-12 col-lg-6 d-flex flex-column justify-content-center align-items-center position-relative p-4 p-md-5">
        
        <div className="position-absolute top-0 end-0 p-4">
          <div className="position-relative">
            <button className="btn btn-link p-2 glass-panel rounded-circle d-flex" onClick={() => setShowThemeMenu(!showThemeMenu)}>
              {theme === 'theme-red-eclipse' && <Moon size={20} color="var(--text-secondary)" />}
              {theme === 'theme-royal-gold' && <Settings size={20} color="var(--accent-color)" />}
              {theme === 'theme-crystal-white' && <Sun size={20} color="var(--text-secondary)" />}
            </button>
            {showThemeMenu && (
              <div className="position-absolute end-0 mt-2 glass-card p-2 shadow-lg" style={{ width: '160px', zIndex: 1001 }}>
                <div className="d-flex flex-column gap-1">
                  <button className="btn btn-sm text-start" style={{ color: 'var(--text-primary)' }} onClick={() => { changeTheme('theme-dark'); setShowThemeMenu(false); }}>🌑 Dark</button>
                  <button className="btn btn-sm text-start" style={{ color: 'var(--text-primary)' }} onClick={() => { changeTheme('theme-light'); setShowThemeMenu(false); }}>☀️ Light</button>
                  <button className="btn btn-sm text-start" style={{ color: 'var(--text-primary)' }} onClick={() => { changeTheme('theme-red-black'); setShowThemeMenu(false); }}>🔴 Red / Black</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-100" style={{ maxWidth: '420px' }}>
          <div className="d-lg-none mb-5 text-center"><Logo size="lg" className="justify-content-center" /></div>

          <div className="mb-5 text-center text-lg-start">
            <h2 className="fw-bold mb-2">Create Account</h2>
            <div className="d-flex align-items-center justify-content-center justify-content-lg-start gap-2 mt-3">
              <div className="premium-progress flex-grow-1"><div className="premium-progress-bar" style={{ width: step === 1 ? '50%' : '100%' }} /></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Step {step} of 2</span>
            </div>
          </div>

          {error && <AlertMessage message={error} type="danger" />}
          {success && <AlertMessage message={success} type="success" />}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="d-flex flex-column gap-4">
                <div className="position-relative">
                  <User className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
                  <input type="text" className="modern-input ps-5" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" style={{ padding: '1rem' }} />
                </div>
                <div className="position-relative">
                  <Mail className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
                  <input type="email" className="modern-input ps-5" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" style={{ padding: '1rem' }} />
                </div>
                <button type="button" onClick={handleNext} className="btn btn-danger w-100 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2">
                  Continue <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.form key="step2" variants={stepVariants} initial="initial" animate="animate" exit="exit" onSubmit={handleSubmit} className="d-flex flex-column gap-4">
                <div className="position-relative">
                  <Shield className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
                  <select className="modern-input ps-5" value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '1rem', appearance: 'none' }}>
                    <option value="student">Student Account</option>
                    <option value="trainer">Instructor Account</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="position-relative">
                  <Lock className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
                  <input type="password" className="modern-input ps-5" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create Password" style={{ padding: '1rem' }} />
                </div>
                <div className="position-relative">
                  <Lock className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
                  <input type="password" className="modern-input ps-5" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" style={{ padding: '1rem' }} />
                </div>
                <div className="d-flex gap-3">
                  <button type="button" onClick={handleBack} className="btn glass-panel py-3 rounded-3 fw-bold flex-grow-1 d-flex justify-content-center align-items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <ArrowLeft size={18} /> Back
                  </button>
                  <button type="submit" className="btn btn-danger py-3 rounded-3 fw-bold flex-grow-1">Create Account</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center mt-5" style={{ color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" className="fw-bold ms-1" style={{ color: 'var(--accent-color)' }}>Sign In</Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
}
