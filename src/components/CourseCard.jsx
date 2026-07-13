import React from "react";
import { motion } from "framer-motion";
import { Play, Star, Clock, User, Award } from "lucide-react";

export default function CourseCard({ 
  title, 
  instructor, 
  progress = 0, 
  rating = 4.8, 
  duration = "4h 30m",
  image = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop",
  category = "Development"
}) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-card overflow-hidden p-0 h-100 d-flex flex-column"
    >
      <div className="position-relative">
        <div style={{ height: "180px", overflow: "hidden" }}>
          <img 
            src={image} 
            alt={title} 
            className="w-100 h-100 object-fit-cover" 
            style={{ transition: "transform 0.3s ease" }}
          />
        </div>
        <div className="position-absolute top-0 end-0 m-3">
          <span className="premium-badge bg-black bg-opacity-50 text-white backdrop-blur">
            {category}
          </span>
        </div>
        <div className="position-absolute bottom-0 start-0 m-3">
          <div className="bg-white bg-opacity-75 text-dark rounded-pill px-2 py-1 small fw-bold d-flex align-items-center gap-1 backdrop-blur">
            <Star size={14} color="#D4AF37" fill="#D4AF37" /> {rating}
          </div>
        </div>
      </div>
      
      <div className="p-4 d-flex flex-column flex-grow-1">
        <h5 className="fw-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h5>
        <div className="d-flex align-items-center gap-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
          <User size={14} /> <span className="small">{instructor}</span>
          <span className="opacity-50">•</span>
          <Clock size={14} /> <span className="small">{duration}</span>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="small fw-semibold" style={{ color: 'var(--text-secondary)' }}>Progress</span>
            <span className="small fw-bold">{progress}%</span>
          </div>
          <div className="premium-progress mb-4">
            <div className="premium-progress-bar" style={{ width: `${progress}%` }} />
          </div>
          
          <button className="btn btn-danger w-100 rounded-pill py-2 fw-bold d-flex justify-content-center align-items-center gap-2">
            {progress === 100 ? (
              <><Award size={18} /> View Certificate</>
            ) : (
              <><Play size={18} fill="currentColor" /> Continue Learning</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
