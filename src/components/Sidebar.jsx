import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, BarChart3, User, Users, BookOpen, 
  FileText, Layers, PlusCircle, CheckSquare, List, 
  Upload, Code, Activity, ClipboardList
} from "lucide-react";

const MENU_BY_ROLE = {
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
    { label: "Profile", to: "/admin/profile", icon: User },
    { label: "Trainers", to: "/admin/trainers", icon: Users },
    { label: "Courses", to: "/admin/courses", icon: BookOpen },
    { label: "Reports", to: "/admin/reports", icon: FileText },
    { label: "Batches", to: "/admin/batches", icon: Layers },
  ],

  trainer: [
    { label: "Dashboard", to: "/trainer", icon: LayoutDashboard },
    { label: "Profile", to: "/trainer/profile", icon: User },
    { label: "Courses", to: "/trainer/courses", icon: BookOpen },
    { label: "Modules", to: "/trainer/modules", icon: PlusCircle },
    { label: "Assign Course", to: "/trainer/assign", icon: CheckSquare },
    { label: "MCQ", to: "/trainer/mcq", icon: List },
    { label: "MCQ Analytics", to: "/trainer/analytics", icon: BarChart3 },
    { label: "Students", to: "/trainer/students", icon: Users },
    { label: "Assignments", to: "/trainer/assignments", icon: FileText },
    { label: "Coding Tests", to: "/trainer/coding-tests", icon: Code },
    { label: "Coding Reviews", to: "/trainer/coding-reviews", icon: CheckSquare },
    { label: "Progress", to: "/trainer/progress", icon: Activity },
    { label: "Submission Review", to: "/trainer/review", icon: ClipboardList },
  ],

  student: [
    { label: "Dashboard", to: "/student", icon: LayoutDashboard },
    { label: "My Courses", to: "/student/courses", icon: BookOpen },
    { label: "MCQ Test", to: "/student/mcq", icon: List },
    { label: "Coding Test", to: "/student/coding-test", icon: Code },
    { label: "Assignments", to: "/student/assignments", icon: FileText },
    { label: "Project Upload", to: "/student/projects", icon: Upload },
    { label: "Profile", to: "/student/profile", icon: User },
  ],
};

export default function Sidebar(props) {
  const { user } = useAuth();
  const location = useLocation();

  const isOpen = props.isOpen !== undefined ? props.isOpen : true;
  const onClose = props.onClose;
  const isMobile = props.isMobile !== undefined ? props.isMobile : false;

  let role = user?.role?.toLowerCase() || "";
  let menuItems = MENU_BY_ROLE[role] || [];

  if (menuItems.length === 0) return null;

  let sidebarClass = "glass-panel border-top-0 border-start-0 border-bottom-0 rounded-0 ";

  if (isMobile) {
    sidebarClass += isOpen ? "d-block " : "d-none ";
  } else {
    sidebarClass += "min-vh-100 ";
  }

  sidebarClass += " p-3";

  return (
    <aside className={sidebarClass} style={{ width: '100%', maxWidth: isMobile ? '100%' : '260px' }}>
      <nav className="nav flex-column gap-2 mt-2">
        {menuItems.map(function (item) {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className="text-decoration-none"
              onClick={onClose}
            >
              <motion.div
                whileHover={{ x: 5, backgroundColor: 'var(--glass-bg)' }}
                whileTap={{ scale: 0.98 }}
                className={`d-flex align-items-center gap-3 p-3 rounded-3 position-relative ${isActive ? 'fw-bold' : ''}`}
                style={{ 
                  color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
                  backgroundColor: isActive ? 'var(--glass-bg)' : 'transparent',
                  border: isActive ? '1px solid var(--glass-border)' : '1px solid transparent',
                  transition: 'color var(--transition-fast)'
                }}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="position-absolute start-0 top-0 bottom-0 rounded-end"
                    style={{ width: '4px', backgroundColor: 'var(--accent-color)' }}
                  />
                )}
                <Icon size={20} />
                <span style={{ fontSize: '0.95rem' }}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}