import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import AlertMessage from "../components/AlertMessage";
import Logo from "../components/Logo";
import { motion } from "framer-motion";
import { Moon, Sun, Settings, Mail, Lock, ArrowRight, Terminal, Globe } from "lucide-react";

const DEFAULT_ADMIN_USER = { name: "Admin", email: "admin@gmail.com", password: "123", role: "admin" };
const DEFAULT_TRAINER_USER = { name: "Trainer", email: "trainer@gmail.com", password: "123", role: "trainer" };
const DEFAULT_STUDENT_USER = { name: "Student", email: "student@gmail.com", password: "123", role: "student" };

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { theme, changeTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  function getSavedUser(key) {
    const savedUser = localStorage.getItem(key);
    if (!savedUser) return null;
    try { return JSON.parse(savedUser); } catch { return null; }
  }

  useEffect(() => {
    if (!localStorage.getItem("lms-user-admin@gmail.com")) localStorage.setItem("lms-user-admin@gmail.com", JSON.stringify(DEFAULT_ADMIN_USER));
    if (!localStorage.getItem("lms-user-trainer@gmail.com")) localStorage.setItem("lms-user-trainer@gmail.com", JSON.stringify(DEFAULT_TRAINER_USER));
    if (!localStorage.getItem("lms-user-student@gmail.com")) localStorage.setItem("lms-user-student@gmail.com", JSON.stringify(DEFAULT_STUDENT_USER));
  }, []);

  useEffect(() => {
    const role = (user?.role || "").toLowerCase();
    if (role === "admin") return navigate("/admin", { replace: true });
    if (role === "trainer") return navigate("/trainer", { replace: true });
    if (role === "student") navigate("/student", { replace: true });
  }, [navigate, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) { setError("Please enter email and password."); return; }
    
    const key = "lms-user-" + String(trimmedEmail).trim().toLowerCase();
    const userData = getSavedUser(key);
    
    if (!userData) { setError("Invalid email"); return; }
    if (String(userData.password || "") !== password) { setError("Incorrect password"); return; }
    
    login({ name: userData.name, email: userData.email, role: userData.role });
  };

  return (
    <div className="min-vh-100 d-flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="d-none d-lg-flex col-lg-6 position-relative flex-column justify-content-center p-5 text-white"
        style={{
          background: `linear-gradient(135deg, var(--accent-hover) 0%, var(--bg-primary) 100%)`,
          borderRight: '1px solid var(--glass-border)'
        }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" 
             style={{ 
               backgroundImage: 'radial-gradient(circle at 20% 50%, var(--accent-color) 0%, transparent 50%)',
               filter: 'blur(60px)'
             }} 
        />
        <div className="position-relative z-1">
          <Logo size="xl" className="mb-4" />
          <h1 className="display-4 fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Elevate Your <br/><span className="accent-gradient">Learning Experience</span>
          </h1>
          <p className="lead mb-5" style={{ color: 'var(--text-secondary)' }}>
            The premium enterprise learning management system designed for the future of education and corporate training.
          </p>
          
          <div className="d-flex gap-4 opacity-75" style={{ color: 'var(--text-secondary)' }}>
            <div className="d-flex flex-column">
              <h2 className="h4 fw-bold mb-1 text-white">100k+</h2>
              <small>Active Users</small>
            </div>
            <div className="d-flex flex-column">
              <h2 className="h4 fw-bold mb-1 text-white">5k+</h2>
              <small>Premium Courses</small>
            </div>
            <div className="d-flex flex-column">
              <h2 className="h4 fw-bold mb-1 text-white">99%</h2>
              <small>Satisfaction</small>
            </div>
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-100" style={{ maxWidth: '420px' }}
        >
          <div className="d-lg-none mb-5 text-center">
            <Logo size="lg" className="justify-content-center" />
          </div>

          <div className="mb-5 text-center text-lg-start">
            <h2 className="fw-bold mb-2">Welcome Back</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue to your dashboard</p>
          </div>

          {error && <AlertMessage message={error} type="danger" />}

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
            
            <div className="position-relative">
              <Mail className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
              <input
                type="email"
                className="modern-input ps-5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                autoComplete="email"
                style={{ padding: '1rem' }}
              />
            </div>

            <div className="position-relative">
              <Lock className="position-absolute top-50 translate-middle-y ms-3" size={18} color="var(--text-secondary)" />
              <input
                type="password"
                className="modern-input ps-5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                style={{ padding: '1rem' }}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <label className="d-flex align-items-center gap-2 cursor-pointer">
                <input type="checkbox" className="form-check-input mt-0" style={{ accentColor: 'var(--accent-color)' }}/>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
              <a href="#" className="text-decoration-none" style={{ fontSize: '0.85rem' }}>Forgot password?</a>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-danger w-100 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2"
            >
              Sign In <ArrowRight size={18} />
            </motion.button>
          </form>

          <div className="mt-4 mb-4 position-relative text-center">
            <hr style={{ borderColor: 'var(--glass-border)' }} />
            <span className="position-absolute top-50 start-50 translate-middle px-3" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Or continue with
            </span>
          </div>

          <div className="d-flex gap-3 justify-content-center">
            <button className="btn glass-panel d-flex justify-content-center align-items-center p-3 flex-grow-1" style={{ color: 'var(--text-primary)' }}>
              <Globe size={20} />
            </button>
            <button className="btn glass-panel d-flex justify-content-center align-items-center p-3 flex-grow-1" style={{ color: 'var(--text-primary)' }}>
              <Terminal size={20} />
            </button>
          </div>

          <p className="text-center mt-5" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" className="fw-bold ms-1" style={{ color: 'var(--accent-color)' }}>Create Account</Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
}
