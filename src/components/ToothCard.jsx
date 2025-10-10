import React, { useState } from "react";
import { FaTooth, FaBrain, FaBone, FaHeart } from "react-icons/fa";
import { MdInfoOutline, MdScience, MdBiotech } from "react-icons/md";
import "./Tooth.css";

const ToothCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Model yuklanishini simulyatsiya qilish
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const relatedTopics = [
    {
      icon: <FaBrain />,
      title: "Tish Nerv Sistemasi",
      description: "Tishning nerv tolalari va ularning organizm bilan bog'liqligi"
    },
    {
      icon: <FaBone />,
      title: "Tish Tuzilishi",
      description: "Emal, dentin va sement qatlamlarining tuzilishi"
    },
    {
      icon: <MdScience />,
      title: "Tish Kasalliklari",
      description: "Karies, paradontoz va boshqa tish kasalliklari"
    },
    {
      icon: <MdBiotech />,
      title: "Zamonaviy Davolash",
      description: "Eng yangi stomatologik texnologiyalar va usullar"
    }
  ];

  return (
    <div className={`tish-anatomiya-konteyner ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Sarlavha qismi */}
      <header className="tish-sarlavha">
        <div className="konteyner">
          <div className="sarlavha-mazmuni">
            <h1 className="asosiy-sarlavha">
              <FaTooth className="tish-ikona" />
              Tish Anatomiyasi 3D Modeli
            </h1>
            <p className="sarlavha-tavsifi">
              Inson tishining murakkab ichki tuzilishini interaktiv 3D model 
              orqali chuqur o'rganing. Har bir qismni batafsil ko'rib chiqing.
            </p>
          </div>
        </div>
      </header>

      {/* Asosiy kontent */}
      <div className="konteyner">
        <main className="asosiy-kontent">
          {/* Kontent sarlavhasi */}
          <div className="kontent-sarlavha">
            <h2 className="model-sarlavha">
              <MdInfoOutline className="malumot-ikona" />
              Tishning Ichki Qismi - Interaktiv Tadqiqot
            </h2>
            <p className="model-tavsifi">
              Quyidagi interaktiv 3D model sizga tishning ichki tuzilishini 
              to'liq o'rganish imkoniyatini beradi. Modelni aylantiring, 
              yaqinlashtiring va har bir qismni tanlab batafsil ma'lumot oling. 
              Professional stomatologlar uchun mo'ljallangan ushbu vosita 
              tish anatomiyasini chuqur tushunishga yordam beradi.
            </p>
          </div>

          {/* 3D model oynasi */}
          <div className={`model-konteyner ${isLoading ? 'yuklanmoqda' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="model-controls">
              <button 
                className="fullscreen-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Kichiklashtirish" : "To'liq ekran"}
              >
                {isFullscreen ? "✕" : "⛶"}
              </button>
            </div>
            
            <iframe
              className="model-iframe"
              src="https://human.biodigital.com/widget/?be=2W7q&background.colors=255,255,255,1,51,64,77,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3bH1u"
              title="Tish anatomiyasi 3D modeli"
              sandbox="allow-modals allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
              onLoad={() => setIsLoading(false)}
            />
            
            {isLoading && (
              <div className="loading-indicator">
                <div className="loading-spinner"></div>
                <p>3D Model yuklanmoqda...</p>
              </div>
            )}
          </div>

          {/* Tegishli mavzular */}
          {!isFullscreen && (
            <section className="qoshimcha-malumotlar">
              <h3 className="mavzular-sarlavha">
                <FaHeart />
                Tegishli Anatomiya Mavzulari
              </h3>
              <div className="mavzular-roʻyxati">
                {relatedTopics.map((topic, index) => (
                  <div key={index} className="mavzu-karta" tabIndex={0}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '8px' 
                    }}>
                      <span style={{ 
                        color: 'var(--primary-blue)', 
                        fontSize: '1.25rem' 
                      }}>
                        {topic.icon}
                      </span>
                      <h4>{topic.title}</h4>
                    </div>
                    <p>{topic.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default ToothCard;