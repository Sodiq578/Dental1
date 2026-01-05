import React, { useRef, useState, useEffect } from 'react';
import "./Attendance.css";


const FaceRecognition = ({ onFaceDetected, onRegisterFace, employees = [] }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [detectedFace, setDetectedFace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanMode, setScanMode] = useState('checkin');
  const [employeeName, setEmployeeName] = useState('');
  const [employeePosition, setEmployeePosition] = useState('');

  // Kamerani yoqish
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error('Kamerani ochishda xato:', err);
      alert('Kamerani ochishda xato. Iltimos, kamera ruxsatini tekshiring.');
    }
  };

  // Kamerani o'chirish
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
    }
  };

  // Yuzni aniqlash (simulyatsiya)
  const detectFace = () => {
    setIsLoading(true);
    
    // Simulyatsiya: 2 soniya kutib, keyin yuz aniqladi deb qabul qilamiz
    setTimeout(() => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        
        // Yuz koordinatalari (simulyatsiya)
        context.beginPath();
        context.lineWidth = 3;
        context.strokeStyle = '#00ff00';
        context.rect(200, 150, 240, 240);
        context.stroke();
        
        // Avvalo, yuzi ro'yxatdan o'tgan xodimlarni aniqlash
        const registeredEmployees = employees.filter(emp => emp.faceRegistered);
        
        if (registeredEmployees.length > 0) {
          // Tasodifiy aniqlangan xodim (simulyatsiya)
          const randomEmployee = registeredEmployees[Math.floor(Math.random() * registeredEmployees.length)];
          setDetectedFace(randomEmployee);
          
          // Ota komponentga yuz aniqlanganligini bildirish
          if (onFaceDetected) {
            onFaceDetected(randomEmployee);
          }
        } else {
          // Agar hech kimning yuzi ro'yxatdan o'tmagan bo'lsa
          setDetectedFace({
            id: Date.now(),
            name: "Yangi Xodim",
            position: "Lavozimi aniqlanmadi",
            faceRegistered: false
          });
        }
        
        setIsLoading(false);
      }
    }, 2000);
  };

  // Yuzni ro'yxatdan o'tkazish
  const registerFace = () => {
    if (!employeeName.trim()) {
      alert('Iltimos, xodim ismini kiriting');
      return;
    }
    
    const newEmployee = {
      id: Date.now(),
      name: employeeName,
      position: employeePosition || "Yangi xodim",
      faceData: detectedFace,
      registeredAt: new Date().toISOString()
    };
    
    if (onRegisterFace) {
      onRegisterFace(newEmployee);
    }
    
    // Tozalash
    setEmployeeName('');
    setEmployeePosition('');
    setDetectedFace(null);
    alert(`${employeeName} yuz ma'lumotlari muvaffaqiyatli saqlandi!`);
  };

  // Komponent yuklanganida kamerani yoqish
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="face-recognition-container">
      <div className="camera-section">
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="camera-video"
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="face-canvas"
          />
        </div>
        
        <div className="camera-controls">
          <button
            className={`camera-btn ${isCameraOn ? 'active' : ''}`}
            onClick={isCameraOn ? stopCamera : startCamera}
          >
            {isCameraOn ? '📷 Kamera O\'chirish' : '📷 Kamerani Yoqish'}
          </button>
          
          <button
            className="scan-btn"
            onClick={detectFace}
            disabled={isLoading || !isCameraOn}
          >
            {isLoading ? '🔍 Yuz Aniqlanmoqda...' : '🔍 Yuzni Aniqlash'}
          </button>
        </div>
      </div>
      
      {detectedFace && (
        <div className="detection-result">
          <h3>✅ Yuz Aniqlandi!</h3>
          <div className="employee-info">
            <div className="employee-avatar">
              {detectedFace.name.charAt(0)}
            </div>
            <div className="employee-details">
              <h4>{detectedFace.name}</h4>
              <p>Lavozim: {detectedFace.position}</p>
              <p>Yuzi ro'yxatdan o'tgan: {detectedFace.faceRegistered ? '✅ Ha' : '❌ Yo\'q'}</p>
            </div>
          </div>
          
          {!detectedFace.faceRegistered && (
            <div className="register-form">
              <div className="form-group">
                <label>Xodimning to'liq ismi:</label>
                <input
                  type="text"
                  placeholder="Ism Familiya"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="name-input"
                />
              </div>
              
              <div className="form-group">
                <label>Lavozimi:</label>
                <select
                  value={employeePosition}
                  onChange={(e) => setEmployeePosition(e.target.value)}
                  className="position-select"
                >
                  <option value="">Lavozimni tanlang</option>
                  <option value="Shifokor">Shifokor</option>
                  <option value="Hamshira">Hamshira</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Texnik xodim">Texnik xodim</option>
                  <option value="Boshqaruvchi">Boshqaruvchi</option>
                  <option value="Yangi xodim">Yangi xodim</option>
                </select>
              </div>
              
              <button
                className="register-btn"
                onClick={registerFace}
              >
                ✅ Yuzni Ro'yxatga Olish
              </button>
            </div>
          )}
          
          <div className="action-buttons">
            <button
              className="retry-btn"
              onClick={() => {
                setDetectedFace(null);
                setEmployeeName('');
                setEmployeePosition('');
              }}
            >
              🔄 Qayta Urinish
            </button>
          </div>
        </div>
      )}
      
      <div className="instructions">
        <h4>Qo'llanma:</h4>
        <ul>
          <li>📸 Kamerani yoqing va yuzingizni ramkaga joylashtiring</li>
          <li>🔍 "Yuzni Aniqlash" tugmasini bosing</li>
          <li>✅ Aniqlangan yuz ma'lumotlarini tekshiring</li>
          <li>💾 Agar yangi xodim bo'lsa, ma'lumotlarini kiriting va ro'yxatdan o'tkazing</li>
          <li>⏰ Kirish/chiqish vaqti avtomatik belgilanadi</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceRecognition;