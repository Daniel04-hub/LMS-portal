import React, { useEffect, useState } from "react";
import DataTable from "../../components/DataTable";
import StatsCard from "../../components/StatsCard";
import { motion } from "framer-motion";
import { Users, BookOpen, Target, CheckCircle, AlertTriangle, TrendingUp, BarChart2 } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AnalyticsDashboard() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    setStudents(JSON.parse(localStorage.getItem("lms-students")) || []);
    setCourses(JSON.parse(localStorage.getItem("lms-courses")) || []);
    setProjects(JSON.parse(localStorage.getItem("lms-projects")) || []);
  }, []);

  const totalStudents = students.length || 12450;
  const totalCourses = courses.length || 890;
  
  const courseCompletionData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [{
      data: [45, 35, 20],
      backgroundColor: ['#10B981', '#F59E0B', '#374151'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const performanceData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      { label: 'Avg Score (%)', data: [75, 82, 80, 88, 85, 92, 90], backgroundColor: '#E53935', borderRadius: 4 },
      { label: 'Completion Rate (%)', data: [60, 65, 70, 75, 80, 85, 88], backgroundColor: '#D4AF37', borderRadius: 4 }
    ]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: 'var(--text-secondary)' } } },
    cutout: '75%'
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: 'var(--text-secondary)' } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)' } },
      y: { grid: { color: 'var(--glass-border)' }, ticks: { color: 'var(--text-secondary)' }, min: 0, max: 100 }
    }
  };

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="mb-5 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="h2 fw-bold mb-1 text-gradient">Platform Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Comprehensive insights into learner engagement and platform health.</p>
        </div>
        <button className="btn btn-outline-secondary rounded-pill d-flex align-items-center gap-2" style={{ borderColor: 'var(--glass-border)' }}>
          <BarChart2 size={18} /> Export Report
        </button>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-sm-6 col-xl-3"><StatsCard title="Total Students" count={totalStudents} icon={Users} trend="+8.4%" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><StatsCard title="Active Courses" count={totalCourses} icon={BookOpen} trend="+12.1%" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><StatsCard title="Avg Completion" count="68%" icon={Target} trend="+5.2%" /></div>
        <div className="col-12 col-sm-6 col-xl-3"><StatsCard title="Drop-off Rate" count="12%" icon={AlertTriangle} trend="-2.1%" /></div>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-12 col-lg-4">
          <div className="glass-card h-100 d-flex flex-column">
            <h5 className="fw-bold mb-4">Course Status</h5>
            <div className="flex-grow-1 position-relative" style={{ minHeight: '250px' }}>
              <Doughnut data={courseCompletionData} options={chartOptions} />
              <div className="position-absolute top-50 start-50 translate-middle text-center">
                <h3 className="fw-bold mb-0">100%</h3>
                <span className="small text-muted">Total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="glass-card h-100">
            <h5 className="fw-bold mb-4">Weekly Performance Trends</h5>
            <div style={{ height: '300px' }}>
              <Bar data={performanceData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="glass-card h-100">
            <h5 className="fw-bold mb-4">Top Performing Colleges</h5>
            <div className="d-flex flex-column gap-3">
              {[
                { name: 'Stanford University', students: 1200, score: 92 },
                { name: 'MIT', students: 950, score: 89 },
                { name: 'Harvard Business School', students: 840, score: 87 },
              ].map((college, i) => (
                <div key={i} className="p-3 rounded-3" style={{ background: 'var(--glass-bg)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">{college.name}</span>
                    <span className="badge bg-success bg-opacity-25 text-success rounded-pill">{college.score}% Avg</span>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="premium-progress flex-grow-1" style={{ height: '6px' }}>
                      <div className="premium-progress-bar bg-warning" style={{ width: `${(college.students/1500)*100}%` }} />
                    </div>
                    <span className="small text-muted">{college.students} stds</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="glass-card h-100">
            <h5 className="fw-bold mb-4">Project Submission Funnel</h5>
            <div className="d-flex flex-column gap-4 justify-content-center h-100 px-md-4">
              <div className="position-relative">
                <div className="d-flex justify-content-between mb-1"><span className="text-muted">Assigned</span> <span className="fw-bold">4,500</span></div>
                <div className="premium-progress" style={{ height: '12px' }}><div className="premium-progress-bar bg-secondary" style={{ width: '100%' }} /></div>
              </div>
              <div className="position-relative">
                <div className="d-flex justify-content-between mb-1"><span className="text-muted">Submitted</span> <span className="fw-bold text-info">3,200</span></div>
                <div className="premium-progress" style={{ height: '12px' }}><div className="premium-progress-bar bg-info" style={{ width: '71%' }} /></div>
              </div>
              <div className="position-relative">
                <div className="d-flex justify-content-between mb-1"><span className="text-muted">Reviewed</span> <span className="fw-bold text-warning">2,800</span></div>
                <div className="premium-progress" style={{ height: '12px' }}><div className="premium-progress-bar bg-warning" style={{ width: '62%' }} /></div>
              </div>
              <div className="position-relative">
                <div className="d-flex justify-content-between mb-1"><span className="text-muted">Approved</span> <span className="fw-bold text-success">2,500</span></div>
                <div className="premium-progress" style={{ height: '12px' }}><div className="premium-progress-bar bg-success" style={{ width: '55%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

