import React from "react";
import "./Spinner.css";

const Spinner = ({ showText = false }) => {
  return (
    <div className="spinner-overlay">
      <div className="spinner-circle"></div>
      {showText && <p className="spinner-text">Yuklanmoqda...</p>}
    </div>
  );
};

export default Spinner;
