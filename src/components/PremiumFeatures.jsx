import React from "react";
import { motion } from "framer-motion";

export default function PremiumFeatures() {
  const features = [
    { icon: "🤖", title: "AI Study Assistant", desc: "Get 24/7 personalized tutoring and automated grading." },
    { icon: "🚀", title: "Smart Recommendations", desc: "Machine-learning driven course suggestions based on your learning style." },
    { icon: "🎤", title: "Voice Learning", desc: "Interact with courses using advanced voice commands." },
    { icon: "🏆", title: "Gamification", desc: "Earn points, badges, and compete on global leaderboards." },
    { icon: "📜", title: "Blockchain Certificates", desc: "Verifiable, tamper-proof certificates on the blockchain." },
    { icon: "🌐", title: "Virtual Classroom", desc: "Immersive VR/AR classroom experiences." }
  ];

  return (
    <div className="mt-5 pt-4 border-top" style={{ borderColor: 'var(--glass-border) !important' }}>
      <div className="d-flex align-items-center gap-3 mb-4">
        <h3 className="fw-bold mb-0 text-gradient">Coming Soon</h3>
        <span className="badge rounded-pill" style={{ background: 'var(--accent-hover)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }}>Enterprise Features</span>
      </div>

      <div className="row g-4">
        {features.map((feature, index) => (
          <div key={index} className="col-12 col-md-6 col-xl-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card position-relative overflow-hidden h-100"
              style={{ opacity: 0.7, pointerEvents: 'none' }}
            >
              {/* Coming Soon Overlay */}
              <div className="position-absolute top-0 end-0 mt-3 me-3 z-1">
                <span className="badge rounded-pill bg-dark text-white border" style={{ borderColor: 'var(--glass-border)', fontSize: '0.65rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Coming Soon
                </span>
              </div>

              <div className="d-flex align-items-start gap-3 p-4">
                <div className="rounded-4 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', fontSize: '1.5rem' }}>
                  {feature.icon}
                </div>
                <div>
                  <h6 className="fw-bold text-white mb-2">{feature.title}</h6>
                  <p className="small text-muted mb-0 lh-sm">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
