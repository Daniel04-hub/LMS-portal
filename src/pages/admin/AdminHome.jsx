import React, { useEffect, useState } from "react";
import StatsCard from "../../components/StatsCard";
import { useAuth } from "../../context/AuthContext";
import { Users, BookOpen, GraduationCap, DollarSign, Activity, Bell, Zap, Brain, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

function AdminHome() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    function loadDashboardData() {
      setCourses(JSON.parse(localStorage.getItem("lms-courses")) || []);
      setTrainers(JSON.parse(localStorage.getItem("lms-trainers")) || []);
      setStudents(JSON.parse(localStorage.getItem("lms-students")) || []);
    }
    loadDashboardData();
    window.addEventListener("focus", loadDashboardData);
    return () => window.removeEventListener("focus", loadDashboardData);
  }, []);

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Platform Revenue ($)',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      borderColor: '#E53935',
      backgroundColor: 'rgba(229, 57, 53, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const userGrowthData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { label: 'Students', data: [65, 59, 80, 81, 56, 55, 40], backgroundColor: '#0D0D0D' },
      { label: 'Trainers', data: [28, 48, 40, 19, 86, 27, 90], backgroundColor: '#D4AF37' }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: 'var(--text-secondary)' } } },
    scales: {
      x: { grid: { color: 'var(--glass-border)' }, ticks: { color: 'var(--text-secondary)' } },
      y: { grid: { color: 'var(--glass-border)' }, ticks: { color: 'var(--text-secondary)' } }
    }
  };

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
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-5">
        <h1 className="h2 fw-bold mb-2 text-gradient">Executive Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span className="fw-semibold text-white">{user.name}</span>. Here's what's happening today.</p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="row g-4 mb-5">
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Total Students" count={students.length || 12450} icon={GraduationCap} trend="+12.5%" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Active Trainers" count={trainers.length || 342} icon={Users} trend="+5.2%" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Published Courses" count={courses.length || 890} icon={BookOpen} trend="+18.1%" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Monthly Revenue" count="$142,300" icon={DollarSign} trend="+22.4%" />
        </motion.div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="row g-4 mb-5">
        <motion.div variants={itemVariants} className="col-12 col-lg-8">
          <div className="glass-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">Revenue Overview</h5>
              <button className="btn btn-sm btn-outline-secondary rounded-pill" style={{ borderColor: 'var(--glass-border)' }}>This Year</button>
            </div>
            <div style={{ height: '300px' }}>
              <Line data={revenueData} options={chartOptions} />
            </div>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-lg-4">
          <div className="glass-card h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">User Growth</h5>
            </div>
            <div style={{ height: '300px' }}>
              <Bar data={userGrowthData} options={chartOptions} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-6">
          <div className="glass-card h-100">
            <h5 className="fw-bold mb-4">Recent Activity</h5>
            <div className="d-flex flex-column gap-3">
              {[
                { title: 'New Course Published', desc: 'Advanced Machine Learning by Dr. Smith', time: '2 mins ago', icon: Zap, color: 'warning' },
                { title: 'New Trainer Registered', desc: 'Alice Johnson completed profile setup', time: '1 hour ago', icon: Users, color: 'info' },
                { title: 'System Update', desc: 'Security patch v2.4.1 applied successfully', time: '3 hours ago', icon: ShieldCheck, color: 'success' },
              ].map((activity, i) => (
                <div key={i} className="d-flex align-items-start gap-3 p-3 rounded-3" style={{ background: 'var(--glass-bg)' }}>
                  <div className={`p-2 rounded-circle bg-${activity.color} bg-opacity-10 text-${activity.color}`}>
                    <activity.icon size={20} />
                  </div>
                  <div>
                    <h6 className="mb-1 fw-semibold">{activity.title}</h6>
                    <p className="mb-1 small" style={{ color: 'var(--text-secondary)' }}>{activity.desc}</p>
                    <small className="text-muted">{activity.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <h5 className="fw-bold mb-4 ms-2">Platform Enhancements</h5>
          <div className="row g-3">
            {[
              { title: 'AI Study Assistant', icon: Brain, desc: 'Generative AI tutor for students' },
              { title: 'Smart Recommendations', icon: Activity, desc: 'Machine learning course suggestions' },
              { title: 'Voice Assistant', icon: Bell, desc: 'Hands-free navigation & learning' },
              { title: 'Blockchain Certificates', icon: ShieldCheck, desc: 'Verifiable on-chain credentials' }
            ].map((module, i) => (
              <div key={i} className="col-12 col-sm-6">
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
    </div>
  );
}

export default AdminHome;