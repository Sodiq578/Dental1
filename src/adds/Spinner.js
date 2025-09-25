import React from "react";
import "./Spinner.css";

const Spinner = ({ showText = false }) => {
  return (
    <div className="spinner">
      <svg className="dental-animation" viewBox="0 0 100 60" width="80" height="60">
        {/* Bemor (o'ng tomonda, og'riqdan qiynalgan ko'rinish) */}
        <g className="patient-group">
          <circle cx="75" cy="30" r="15" fill="#f39c12" className="patient-head" />
          <path d="M75 45 L70 55 L80 55 Z" fill="#e67e22" className="patient-body" />
          <circle cx="70" cy="25" r="2" fill="#2c3e50" className="patient-eye-left" />
          <circle cx="80" cy="25" r="2" fill="#2c3e50" className="patient-eye-right" />
          <path d="M72 35 Q75 40 78 35" stroke="#2c3e50" strokeWidth="2" fill="none" className="patient-mouth" />
        </g>
        
        {/* Tish (chap tomonda, chiqarilish animatsiyasi) */}
        <g className="tooth-group">
          <rect x="10" y="35" width="10" height="15" rx="2" fill="#ecf0f1" className="tooth-body" />
          <rect x="15" y="20" width="0" height="15" rx="1" fill="#bdc3c7" className="tooth-root" />
          <circle cx="15" cy="15" r="3" fill="#3498db" className="extraction-tool" /> {/* Tish chiqaruvchi asbob */}
        </g>
        
        {/* Animatsiya chizig'i (tishdan bemorga) */}
        <line x1="25" y1="30" x2="65" y2="30" stroke="#e74c3c" strokeWidth="2" className="pain-line" />
      </svg>
      {showText && <p className="spinner-text">Yuklanmoqda...</p>}
    </div>
  );
};

export default Spinner;