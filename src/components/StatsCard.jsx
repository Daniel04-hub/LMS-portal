import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, count, icon: Icon, trend }) {
  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: "var(--glass-shadow)" }}
      className="glass-card position-relative overflow-hidden"
    >
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="p-2 rounded-3" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          {Icon && <Icon size={24} color="var(--accent-color)" />}
        </div>
        {trend && (
          <span className={`premium-badge ${trend.startsWith('+') ? 'text-success' : 'text-danger'}`} style={{ background: 'transparent' }}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h6 style={{ color: 'var(--text-secondary)' }} className="mb-1">{title}</h6>
        <h3 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>{count}</h3>
      </div>
      <div className="position-absolute bottom-0 end-0 p-3 opacity-10">
        {Icon && <Icon size={64} color="var(--accent-color)" />}
      </div>
    </motion.div>
  );
}
