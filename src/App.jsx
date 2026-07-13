import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminHome from "./pages/admin/AdminHome";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import TrainerManagement from "./pages/admin/TrainerManagement";
import CourseApproval from "./pages/admin/CourseApproval";
import StudentReport from "./pages/admin/StudentReport";
import BatchManagement from "./pages/admin/BatchManagement";
import TrainerHome from "./pages/trainer/TrainerHome";
import TrainerProfile from "./pages/trainer/TrainerProfile";
import CourseCreation from "./pages/trainer/CourseCreation";
import ModuleCreation from "./pages/trainer/ModuleCreation";
import StudentCreation from "./pages/trainer/StudentCreation";
import StudentProgress from "./pages/trainer/StudentProgress";
import AssignCourse from "./pages/trainer/AssignCourse";
import MCQCreation from "./pages/trainer/MCQCreation";
import MCQAnalytics from "./pages/trainer/MCQAnalytics";
import CodingTestCreation from "./pages/trainer/CodingTestCreation";
import CodingSubmissionReview from "./pages/trainer/CodingSubmissionReview";
import SubmissionReview from "./pages/trainer/SubmissionReview";
import AssignmentMonitoring from "./pages/trainer/AssignmentMonitoring";
import StudentHome from "./pages/student/StudentHome";
import MyCourses from "./pages/student/MyCourses";
import MCQTest from "./pages/student/MCQTest";
import CodingTest from "./pages/student/CodingTest";
import AssignmentUpload from "./pages/student/AssignmentUpload";
import ProjectUpload from "./pages/student/ProjectUpload";
import StudentProfile from "./pages/student/StudentProfile";

function DashboardShell({ title, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="container-fluid">
        <div className="row">
          <div className="col-12 d-lg-none px-3 pt-3">
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              isMobile
            />
          </div>

          <div className="col-lg-3 col-xl-2 d-none d-lg-block px-0">
            <Sidebar />
          </div>

          <main className="col-12 col-lg-9 col-xl-10 p-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <AdminHome />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <AnalyticsDashboard />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <AdminProfile />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/trainers"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <TrainerManagement />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <CourseApproval />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <StudentReport />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route path="/admin/students" element={<Navigate to="/admin/reports" replace />} />
      <Route
        path="/admin/batches"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <BatchManagement />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/assignments"
        element={
          <ProtectedRoute role="admin">
            <DashboardShell title="Dani LMS | Admin">
              <AssignmentMonitoring />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trainer"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <TrainerHome />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/profile"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <TrainerProfile />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/courses"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <CourseCreation />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/modules"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <ModuleCreation />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/students"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <StudentCreation />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/progress"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <StudentProgress />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/assignments"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <AssignmentMonitoring />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/assign"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <AssignCourse />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/mcq"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <MCQCreation />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/coding-tests"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <CodingTestCreation />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/coding-reviews"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <CodingSubmissionReview />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainer/analytics"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <MCQAnalytics />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route path="/trainer/mcq-analytics" element={<Navigate to="/trainer/analytics" replace />} />
      <Route
        path="/trainer/review"
        element={
          <ProtectedRoute role="trainer">
            <DashboardShell title="Dani LMS | Trainer">
              <SubmissionReview />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <StudentHome />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <MyCourses />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/mcq"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <MCQTest />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/coding-test"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <CodingTest />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <AssignmentUpload />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/projects"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <ProjectUpload />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute role="student">
            <DashboardShell title="Dani LMS | Student">
              <StudentProfile />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
