import React from 'react';

export default function Logo({ showText = true, className = "", size = "md" }) {
  const sizeMap = {
    sm: { svg: "32", text: "fs-5" },
    md: { svg: "42", text: "fs-4" },
    lg: { svg: "56", text: "fs-2" },
    xl: { svg: "80", text: "display-5" }
  };
  
  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`d-flex align-items-center gap-2 ${className}`}>
      <svg width={currentSize.svg} height={currentSize.svg} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="80" height="80" rx="20" fill="var(--bg-secondary)" stroke="var(--glass-border)" strokeWidth="2" style={{ transition: 'all var(--transition-fast)' }}/>
        <path d="M30 30H50C61.0457 30 70 38.9543 70 50C70 61.0457 61.0457 70 50 70H30V30Z" fill="var(--accent-color)" style={{ transition: 'all var(--transition-fast)' }}/>
        <path d="M40 40H50C55.5228 40 60 44.4772 60 50C60 55.5228 55.5228 60 50 60H40V40Z" fill="var(--text-inverse)" style={{ transition: 'all var(--transition-fast)' }}/>
      </svg>
      {showText && (
        <span className={`fw-bold text-uppercase lh-sm mb-0 ${currentSize.text}`} style={{ color: 'var(--text-primary)', transition: 'color var(--transition-fast)' }}>
          <span style={{ color: 'var(--accent-color)', transition: 'color var(--transition-fast)' }}>Dani</span> LMS
        </span>
      )}
    </div>
  );
}
