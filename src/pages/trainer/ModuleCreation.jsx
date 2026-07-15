import React, { useEffect, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import { BookOpen, Layers, PlusCircle, Trash2, Edit3, Video, AlignLeft, Calendar, PlayCircle, Book } from "lucide-react";

function normalizeModule(module) {
  return {
    id: module?.id || Date.now(),
    moduleTitle: module?.moduleTitle || module?.title || "",
    moduleDescription: module?.moduleDescription || "",
    videoUrl: module?.videoUrl || "",
    createdAt: module?.createdAt || "",
  };
}

function normalizeCourse(course) {
  return {
    ...course,
    id: course?.id,
    title: course?.title || "",
    syllabus: course?.syllabus || "",
    trainerName: course?.trainerName || "",
    modules: Array.isArray(course?.modules) ? course.modules.map(normalizeModule) : [],
  };
}

export default function ModuleCreation() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => { setMessage(""); setType("info"); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const savedCourses = JSON.parse(localStorage.getItem("lms-courses")) || [];
    setCourses(Array.isArray(savedCourses) ? savedCourses : []);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("lms-courses", JSON.stringify(courses));
  }, [courses, isLoaded]);

  const visibleCourses = courses.map(normalizeCourse).filter(c => c.trainerName === (user?.name || ""));
  const selectedCourse = visibleCourses.find(c => String(c.id) === String(selectedCourseId)) || null;

  const tableData = (selectedCourse?.modules || []).map(m => ({ ...m, createdDateLabel: m.createdAt || "Not available" }));

  const isFormDisabled = !selectedCourse;

  const resetForm = () => {
    setModuleTitle(""); setModuleDescription(""); setVideoUrl(""); setEditingModuleId(null);
  };

  const handleCourseChange = (e) => {
    setSelectedCourseId(e.target.value); resetForm();
  };

  const handleEdit = (module) => {
    setModuleTitle(module.moduleTitle || ""); setModuleDescription(module.moduleDescription || "");
    setVideoUrl(module.videoUrl || ""); setEditingModuleId(module.id);
  };

  const handleDelete = (moduleId) => {
    if (!selectedCourse) return;
    const updatedCourses = courses.map(course => {
      if (String(course?.id) !== String(selectedCourse.id)) return course;
      const normalized = normalizeCourse(course);
      return { ...normalized, modules: normalized.modules.filter(m => String(m.id) !== String(moduleId)) };
    });
    setCourses(updatedCourses);
    if (String(editingModuleId) === String(moduleId)) resetForm();
    setMessage("Module deleted successfully."); setType("success");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const tTitle = moduleTitle.trim(); const tDesc = moduleDescription.trim(); const tVid = videoUrl.trim();
    if (!selectedCourse) { setMessage("Please select a course first."); setType("danger"); return; }
    if (!tTitle || !tDesc || !tVid) { setMessage("Please fill in all required fields."); setType("danger"); return; }

    const updatedCourses = courses.map(course => {
      if (String(course?.id) !== String(selectedCourse.id)) return course;
      const normalized = normalizeCourse(course);
      if (editingModuleId) {
        return {
          ...normalized,
          modules: normalized.modules.map(m => String(m.id) === String(editingModuleId) ? { ...m, moduleTitle: tTitle, moduleDescription: tDesc, videoUrl: tVid } : m)
        };
      }
      return { ...normalized, modules: [...normalized.modules, { id: Date.now(), moduleTitle: tTitle, moduleDescription: tDesc, videoUrl: tVid, createdAt: new Date().toLocaleString() }] };
    });

    setCourses(updatedCourses); resetForm();
    setMessage(editingModuleId ? "Module updated successfully." : "Module added successfully."); setType("success");
  };

  return (
    <div className="container-fluid py-4 px-lg-4 dashboard-main">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 className="h2 fw-bold mb-1 text-gradient">Course Builder</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create and manage learning modules for your courses.</p>
        </div>
        {selectedCourse && (
          <div className="d-flex gap-4">
            <div className="text-center">
              <h3 className="mb-0 fw-bold">{tableData.length}</h3>
              <small className="text-muted text-uppercase" style={{ letterSpacing: '1px' }}>Total Modules</small>
            </div>
          </div>
        )}
      </div>

      {message && <AlertMessage message={message} type={type} />}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card sticky-top" style={{ top: '100px' }}>
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              {editingModuleId ? <><Edit3 size={20} color="var(--accent-color)" /> Edit Module</> : <><PlusCircle size={20} color="var(--accent-color)" /> Create New Module</>}
            </h5>

            {visibleCourses.length === 0 ? (
              <div className="text-center p-4 rounded" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <BookOpen size={40} className="mb-3 opacity-50 text-muted" />
                <h6 className="text-muted">No Courses Available</h6>
                <p className="small text-muted mb-0">You must create a course before adding modules.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label small text-muted">Select Course</label>
                  <div className="position-relative">
                    <Book className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <select className="modern-input ps-5" value={selectedCourseId} onChange={handleCourseChange} required>
                      <option value="" disabled>Choose a course to edit...</option>
                      {visibleCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label small text-muted">Module Title</label>
                  <div className="position-relative">
                    <Layers className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="text" className="modern-input ps-5" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} placeholder="e.g., Introduction to React" disabled={isFormDisabled} required />
                  </div>
                </div>

                <div>
                  <label className="form-label small text-muted">Description</label>
                  <div className="position-relative">
                    <AlignLeft className="position-absolute top-0 mt-3 ms-3" size={16} color="var(--text-secondary)" />
                    <textarea className="modern-input ps-5" rows={4} value={moduleDescription} onChange={e => setModuleDescription(e.target.value)} placeholder="What will students learn in this module?" disabled={isFormDisabled} required />
                  </div>
                </div>

                <div>
                  <label className="form-label small text-muted">Video URL</label>
                  <div className="position-relative">
                    <Video className="position-absolute top-50 translate-middle-y ms-3" size={16} color="var(--text-secondary)" />
                    <input type="url" className="modern-input ps-5" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." disabled={isFormDisabled} required />
                  </div>
                  <small className="text-muted mt-2 d-block" style={{ fontSize: '0.75rem' }}>Direct MP4 or YouTube links supported.</small>
                </div>

                <div className="d-flex gap-3 mt-2">
                  <button type="submit" disabled={isFormDisabled} className="btn btn-danger flex-grow-1 py-3 rounded-3 fw-bold d-flex justify-content-center align-items-center gap-2">
                    {editingModuleId ? <><Edit3 size={18}/> Update</> : <><PlusCircle size={18}/> Add Module</>}
                  </button>
                  {editingModuleId && (
                    <button type="button" onClick={resetForm} className="btn glass-panel py-3 rounded-3 fw-bold px-4">Cancel</button>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        </div>

        <div className="col-12 col-lg-7">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card h-100">
            <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <Layers size={20} color="var(--accent-color)" /> Course Timeline
            </h5>

            {!selectedCourse ? (
              <div className="text-center p-5 rounded h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', minHeight: '400px' }}>
                <BookOpen size={64} color="var(--text-secondary)" className="mb-4 opacity-50" />
                <h5 className="fw-bold mb-2">No Course Selected</h5>
                <p className="text-muted mb-0">Select a course from the dropdown to view its modules.</p>
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-center p-5 rounded h-100 d-flex flex-column justify-content-center align-items-center" style={{ background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', minHeight: '400px' }}>
                <Layers size={64} color="var(--text-secondary)" className="mb-4 opacity-50" />
                <h5 className="fw-bold mb-2">No Modules Created Yet</h5>
                <p className="text-muted mb-0">Use the form to create your first learning module.</p>
              </div>
            ) : (
              <div className="timeline-container ps-3 pt-2">
                {tableData.map((module, index) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} key={module.id} className="position-relative pb-4 mb-4" style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: '2rem' }}>
                    <div className="position-absolute rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '32px', height: '32px', background: 'var(--accent-color)', left: '-17px', top: '0' }}>
                      <span className="text-white fw-bold small">{index + 1}</span>
                    </div>

                    <div className="p-4 rounded-4" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0 text-white">{module.moduleTitle}</h5>
                        <div className="d-flex gap-2">
                          <button onClick={() => handleEdit(module)} className="btn btn-sm btn-icon text-muted" style={{ background: 'transparent', border: 'none' }} title="Edit"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(module.id)} className="btn btn-sm btn-icon text-danger" style={{ background: 'transparent', border: 'none' }} title="Delete"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      
                      <p className="text-muted small mb-3">{module.moduleDescription}</p>
                      
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <Calendar size={14} /> {module.createdDateLabel}
                        </div>
                        {module.videoUrl && (
                          <a href={module.videoUrl} target="_blank" rel="noreferrer" className="btn btn-sm text-decoration-none d-flex align-items-center gap-1" style={{ color: 'var(--accent-color)', background: 'var(--accent-hover)', borderRadius: '20px', padding: '0.25rem 1rem' }}>
                            <PlayCircle size={14} /> Watch Video
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}


