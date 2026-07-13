import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";
import { Search, Bell, Settings, LogOut, Moon, Sun, Monitor, Menu } from "lucide-react";

const ROLE_SUBTITLE = {
  admin: "Executive Portal",
  trainer: "Instructor Portal",
  student: "Student Portal",
};

export default function Navbar(props) {
  const { user, logout } = useAuth();
  const { theme, changeTheme } = useTheme();
  const navigate = useNavigate();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  let role = user?.role?.toLowerCase() || "";
  let homePath = role ? `/${role}` : "/login";
  let roleSubtitle = ROLE_SUBTITLE[role] || "Learning Management System";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
    setShowThemeMenu(false);
  };

  return (
    <nav className="navbar glass-panel border-bottom-0 rounded-0 shadow-sm sticky-top px-3 py-2" style={{ zIndex: 1000, borderRadius: '0' }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">
        
        {/* Left Section: Logo & Mobile Toggle */}
        <div className="d-flex align-items-center gap-3">
          {user && (
            <button
              type="button"
              className="btn btn-link text-primary d-lg-none p-0"
              onClick={props.onToggleSidebar}
              style={{ color: 'var(--text-primary)' }}
            >
              <Menu size={24} color="var(--text-primary)" />
            </button>
          )}
          <Link to={homePath} className="text-decoration-none">
            <Logo size="sm" />
          </Link>
          {user && <span className="premium-badge d-none d-md-inline-block ms-2">{roleSubtitle}</span>}
        </div>

        {/* Center Section: Global Search (Only if logged in) */}
        {user && (
          <div className="d-none d-md-flex align-items-center position-relative w-25">
            <Search size={18} className="position-absolute ms-3" style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="modern-input ps-5 py-2" 
              placeholder="Search courses, students, resources..." 
              style={{ borderRadius: '20px' }}
            />
          </div>
        )}

        {/* Right Section: Actions & Profile */}
        <div className="d-flex align-items-center gap-3">
          
          {/* Theme Switcher */}
          <div className="position-relative">
            <button 
              className="btn btn-link p-1" 
              onClick={() => setShowThemeMenu(!showThemeMenu)}
            >
              {theme === 'theme-dark' && <Moon size={20} color="var(--text-secondary)" />}
              {theme === 'theme-light' && <Sun size={20} color="var(--accent-color)" />}
              {theme === 'theme-red-black' && <Moon size={20} color="var(--accent-color)" />}
            </button>
            
            {showThemeMenu && (
              <div className="position-absolute end-0 mt-2 glass-card p-2 shadow-lg" style={{ width: '160px', zIndex: 1001 }}>
                <div className="d-flex flex-column gap-1">
                  <button className="btn btn-sm text-start" style={{ color: 'var(--text-primary)' }} onClick={() => handleThemeChange('theme-dark')}>🌑 Dark</button>
                  <button className="btn btn-sm text-start" style={{ color: 'var(--text-primary)' }} onClick={() => handleThemeChange('theme-light')}>☀️ Light</button>
                  <button className="btn btn-sm text-start" style={{ color: 'var(--text-primary)' }} onClick={() => handleThemeChange('theme-red-black')}>🔴 Red / Black</button>
                </div>
              </div>
            )}
          </div>

          {user && (
            <>
              <button className="btn btn-link p-1 position-relative">
                <Bell size={20} color="var(--text-secondary)" />
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                  <span className="visually-hidden">New alerts</span>
                </span>
              </button>

              <div className="d-flex align-items-center gap-2 ms-2">
                <div className="d-none d-sm-block text-end">
                  <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="text-capitalize">{user.role}</div>
                </div>
                <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white fw-bold shadow-sm" style={{ width: '36px', height: '36px', background: 'var(--accent-color)' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button className="btn btn-link p-1 ms-1 text-danger" onClick={handleLogout} title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}