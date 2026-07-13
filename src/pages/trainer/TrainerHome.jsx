import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import StatsCard from "../../components/StatsCard";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { BookOpen, Users, FileText, Code, CheckCircle, Clock, Zap, Brain, Activity, MessageSquare } from "lucide-react";

export default function TrainerHome() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    setCourses(JSON.parse(localStorage.getItem("lms-courses")) || []);
    setStudents(JSON.parse(localStorage.getItem("lms-students")) || []);
    setBatches(JSON.parse(localStorage.getItem("lms-batches")) || []);
  }, []);

  const totalStudents = students.length || 142;
  const assignedCourses = courses.length || 8;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      {/* Hero Section */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-5">
        <h1 className="h2 fw-bold mb-2 text-gradient">Instructor Portal</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span className="fw-semibold text-white">{user.name}</span>. Ready to inspire?</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="row g-4 mb-5">
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Total Courses" count={assignedCourses} icon={BookOpen} trend="+2 New" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Students Enrolled" count={totalStudents} icon={Users} trend="+15 This Week" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Assignments Pending" count={24} icon={FileText} trend="-5 from yesterday" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Coding Test Avg" count="86%" icon={Code} trend="+4.2%" />
        </motion.div>
      </motion.div>

      <div className="row g-4 mb-5">
        {/* Teaching Progress & Tasks */}
        <div className="col-12 col-lg-8">
          <div className="glass-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Upcoming Reviews & Tasks</h5>
              <button className="btn btn-sm btn-danger rounded-pill">View All</button>
            </div>
            <div className="table-responsive">
              <table className="table table-borderless text-white mb-0 align-middle">
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th className="fw-medium pb-3">Task</th>
                    <th className="fw-medium pb-3">Course</th>
                    <th className="fw-medium pb-3">Deadline</th>
                    <th className="fw-medium pb-3 text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { task: 'Review Python Assignments', course: 'Advanced Python 101', deadline: 'Today, 5:00 PM', status: 'Urgent', color: 'danger' },
                    { task: 'Grade React Projects', course: 'React Masterclass', deadline: 'Tomorrow', status: 'Pending', color: 'warning' },
                    { task: 'Create Node.js Quiz', course: 'Backend Dev', deadline: 'Next Week', status: 'On Track', color: 'success' },
                  ].map((item, i) => (
                    <tr key={i} style={{ borderBottom: i !== 2 ? '1px solid var(--glass-border)' : 'none' }}>
                      <td className="py-3 fw-semibold">{item.task}</td>
                      <td className="py-3" style={{ color: 'var(--text-secondary)' }}>{item.course}</td>
                      <td className="py-3" style={{ color: 'var(--text-secondary)' }}><Clock size={14} className="me-1" />{item.deadline}</td>
                      <td className="py-3 text-end">
                        <span className={`premium-badge text-${item.color}`}>{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Achievement Badges & Recent Activity */}
        <div className="col-12 col-lg-4">
          <div className="glass-card h-100">
            <h5 className="fw-bold mb-4">Recent Interactions</h5>
            <div className="d-flex flex-column gap-3">
              {[
                { title: 'Sarah submitted project', time: '10 mins ago', icon: FileText, color: 'info' },
                { title: 'New student enrolled', time: '1 hour ago', icon: Users, color: 'success' },
                { title: 'Discussion forum reply', time: '2 hours ago', icon: MessageSquare, color: 'warning' },
              ].map((activity, i) => (
                <div key={i} className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'var(--glass-bg)' }}>
                  <div className={`p-2 rounded-circle bg-${activity.color} bg-opacity-10 text-${activity.color}`}>
                    <activity.icon size={18} />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-semibold" style={{ fontSize: '0.9rem' }}>{activity.title}</h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{activity.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI & Future Modules */}
      <div>
        <h5 className="fw-bold mb-4 ms-2">AI Teaching Tools</h5>
        <div className="row g-3">
          {[
            { title: 'AI Course Generator', icon: Brain, desc: 'Auto-generate syllabi & content' },
            { title: 'AI Question Generator', icon: Zap, desc: 'Create MCQs from text instantly' },
            { title: 'AI Content Assistant', icon: CheckCircle, desc: 'Grammar & tone optimization' },
            { title: 'Smart Course Analytics', icon: Activity, desc: 'Predictive student performance' }
          ].map((module, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="glass-panel p-4 h-100 position-relative overflow-hidden text-center" style={{ border: '1px dashed var(--glass-border)' }}>
                <div className="position-absolute top-0 end-0 mt-2 me-2">
                  <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
                </div>
                <module.icon size={32} color="var(--text-secondary)" className="mb-3 opacity-50" />
                <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{module.title}</h6>
                <p className="small mb-0 opacity-50" style={{ color: 'var(--text-secondary)' }}>{module.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
