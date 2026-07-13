import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AlertMessage from "../../components/AlertMessage";
import StatsCard from "../../components/StatsCard";
import CourseCard from "../../components/CourseCard";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Clock, Flame, Award, Trophy, Star, Target, Brain, Compass, Mic, TrendingUp, Briefcase } from "lucide-react";

export default function StudentHome() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const savedStudents = JSON.parse(localStorage.getItem("lms-students")) || [];
    const normalizedEmail = (user?.email || "").trim().toLowerCase();
    const foundStudent = savedStudents.find(s => (s?.email || "").trim().toLowerCase() === normalizedEmail);
    setStudent(foundStudent || { name: user?.name, assignedCourse: "React Masterclass", courseProgress: 65, courseStatus: "In Progress" });
  }, [user]);

  if (!student) return <div className="container mt-4"><AlertMessage message="Loading profile..." type="info" /></div>;

  const courses = student.assignedCourse ? [{
    title: student.assignedCourse,
    trainerName: student.trainerName || "Expert Instructor",
    courseStatus: student.courseStatus || "In Progress",
    courseProgress: parseInt(student.courseProgress, 10) || 65,
  }] : [];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      {/* Hero Section */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mb-5 d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-4">
        <div>
          <h1 className="h2 fw-bold mb-2 text-gradient">Student Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mb-0">
            Welcome back, <span className="fw-semibold text-white">{student.name}</span>. Let's conquer today's goals!
          </p>
        </div>
        
        {/* Streak & Motivation */}
        <div className="d-flex gap-3">
          <div className="glass-panel p-2 px-3 rounded-pill d-flex align-items-center gap-2">
            <Flame color="var(--accent-color)" size={20} />
            <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>12 Day Streak!</span>
          </div>
          <div className="glass-panel p-2 px-3 rounded-pill d-flex align-items-center gap-2">
            <Target color="var(--success-color)" size={20} />
            <span className="fw-bold" style={{ color: 'var(--text-primary)' }}>Daily Goal: 80%</span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="row g-4 mb-5">
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Enrolled Courses" count={courses.length || 1} icon={BookOpen} />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Completed" count={0} icon={CheckCircle} />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Pending Assignments" count={3} icon={Clock} trend="Due soon" />
        </motion.div>
        <motion.div variants={itemVariants} className="col-12 col-sm-6 col-xl-3">
          <StatsCard title="Avg Test Score" count="92%" icon={Star} trend="+5% this week" />
        </motion.div>
      </motion.div>

      <div className="row g-4 mb-5">
        {/* Continue Learning */}
        <div className="col-12 col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">Continue Learning</h5>
            <Link to="/student/courses" className="btn btn-sm btn-outline-secondary rounded-pill px-3">View All</Link>
          </div>
          
          <div className="row g-4">
            {courses.map((course, idx) => (
              <div key={idx} className="col-12 col-md-6">
                <CourseCard 
                  title={course.title} 
                  instructor={course.trainerName} 
                  progress={course.courseProgress} 
                  rating={4.8} 
                  duration="4h 30m"
                  category="Development"
                />
              </div>
            ))}
            {courses.length === 0 && <div className="col-12"><div className="glass-panel p-4 text-center">No active courses. Check recommendations!</div></div>}
          </div>
        </div>

        {/* Achievements & Leaderboard */}
        <div className="col-12 col-lg-4">
          <h5 className="fw-bold mb-4">Your Achievements</h5>
          <div className="glass-card h-100">
            <div className="d-flex justify-content-around mb-4">
              <div className="text-center">
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle mb-2 d-inline-block"><Trophy color="var(--warning-color)" size={32} /></div>
                <div className="fw-bold" style={{ fontSize: '0.85rem' }}>Top 5%</div>
              </div>
              <div className="text-center">
                <div className="bg-info bg-opacity-10 p-3 rounded-circle mb-2 d-inline-block"><Award color="#0dcaf0" size={32} /></div>
                <div className="fw-bold" style={{ fontSize: '0.85rem' }}>Fast Learner</div>
              </div>
              <div className="text-center">
                <div className="bg-success bg-opacity-10 p-3 rounded-circle mb-2 d-inline-block"><CheckCircle color="var(--success-color)" size={32} /></div>
                <div className="fw-bold" style={{ fontSize: '0.85rem' }}>Perfect Score</div>
              </div>
            </div>
            <hr style={{ borderColor: 'var(--glass-border)' }} />
            <h6 className="fw-bold mb-3 mt-2">Class Leaderboard</h6>
            <div className="d-flex flex-column gap-2">
              {['1. Alex Johnson - 4500 pts', '2. You - 4250 pts', '3. Maria Garcia - 4100 pts'].map((user, i) => (
                <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: i === 1 ? 'var(--glass-bg)' : 'transparent', border: i === 1 ? '1px solid var(--glass-border)' : 'none' }}>
                  <span style={{ fontSize: '0.9rem', color: i === 1 ? 'var(--accent-color)' : 'var(--text-primary)' }} className={i === 1 ? 'fw-bold' : ''}>{user}</span>
                  {i === 0 && <Trophy size={16} color="var(--warning-color)" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI & Future Modules */}
      <div>
        <h5 className="fw-bold mb-4 ms-2">Future of Learning</h5>
        <div className="row g-3">
          {[
            { title: 'AI Study Assistant', icon: Brain, desc: 'Your 24/7 personalized tutor' },
            { title: 'Personalized Path', icon: Compass, desc: 'Dynamic curriculum adaptation' },
            { title: 'Voice Learning Assistant', icon: Mic, desc: 'Learn hands-free via audio' },
            { title: 'Skill Gap Analysis', icon: TrendingUp, desc: 'Identify & bridge knowledge gaps' },
            { title: 'Career Recommender', icon: Briefcase, desc: 'AI-driven job matching' }
          ].map((module, i) => (
            <div key={i} className="col-12 col-sm-6 col-lg-auto flex-grow-1">
              <div className="glass-panel p-4 h-100 position-relative overflow-hidden text-center" style={{ border: '1px dashed var(--glass-border)' }}>
                <div className="position-absolute top-0 end-0 mt-2 me-2">
                  <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: '0.65rem' }}>Coming Soon</span>
                </div>
                <module.icon size={28} color="var(--text-secondary)" className="mb-3 opacity-50" />
                <h6 className="fw-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{module.title}</h6>
                <p className="small mb-0 opacity-50" style={{ color: 'var(--text-secondary)' }}>{module.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
