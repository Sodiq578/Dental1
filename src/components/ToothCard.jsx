import React from "react";
import { FaTooth } from "react-icons/fa";
import { MdInfoOutline } from "react-icons/md";
import "./Tooth.css";

const ToothCard = () => {
  return (
    <div className="tooth-container">
      {/* Sarlavha qismi */}
      <header className="tooth-header">
        <div className="container">
          <h1 className="header-title">
            <FaTooth className="tooth-icon" />
            Tish Anatomiyasi 3D Modeli
          </h1>
          <p className="header-subtitle">
            Inson tishining ichki tuzilishini interaktiv 3D model orqali o'rganing
          </p>
        </div>
      </header>

      {/* Asosiy kontent */}
      <div className="container">
        {/* Yo'l navigatsiyasi (breadcrumb) */}
 

        {/* Asosiy kontent */}
        <main className="">
          <div className="content-header">
            <h2 className="model-title">
              <MdInfoOutline className="info-icon" />
              Tishning Ichki Qismi - Interaktiv Ko'rgazma
            </h2>
            <p className="model-description">
              Quyidagi interaktiv model yordamida tishning ichki qismini har tomondan ko'rib,
              aylantirib va yaqinlashtirib o'rganishingiz mumkin. Modelning turli qismlarini
              tanlab, ular haqida qo'shimcha ma'lumot olishingiz mumkin.
            </p>
          </div>

          {/* 3D model oynasi */}
          <div className="model-container">
            <iframe
              className="model-iframe"
              src="https://human.biodigital.com/widget/?be=2W7q&background.colors=255,255,255,1,51,64,77,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3bH1u"
              title="Tish ichi"
              sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            ></iframe>
          </div>

          {/* Tegishli mavzular */}
         
        </main>
      </div>
 
    </div>
  );
};

export default ToothCard;