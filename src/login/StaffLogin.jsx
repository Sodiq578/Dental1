import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiX, FiMail, FiArrowLeft, FiUser, FiShield, FiKey, FiCheck, FiAlertCircle, FiPhoneCall, FiSmartphone } from 'react-icons/fi';
import { AppContext } from '../App';
import { logLogin, getFromLocalStorage, saveToLocalStorage, sendTelegramMessage } from '../utils';
import './StaffLogin.css';

const StaffLogin = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [isFocused, setIsFocused] = useState({});
  const [autoVerify, setAutoVerify] = useState(true);
  const [tempUser, setTempUser] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStaffList, setDemoStaffList] = useState([
    { id: 1, name: "Hamshira Zuhra Karimova", phone: "+998901234567", position: "Katta hamshira", chatId: "123456789" },
    { id: 2, name: "Admin Botir Xo'jayev", phone: "+998902345678", position: "Admin", chatId: "987654321" },
    { id: 3, name: "Xodim Nigora To'xtayeva", phone: "+998903456789", position: "Hisobchi", chatId: "555555555" },
    { id: 4, name: "Dr. Ali Valiyev", phone: "+998904567890", position: "Bosh shifokor", chatId: "111111111" }
  ]);
  const [selectedDemoStaff, setSelectedDemoStaff] = useState(null);

  const navigate = useNavigate();
  const { staff, setLogins, setCurrentUser } = useContext(AppContext);
  const otpInputRefs = useRef([]);

  // Tizim xodimlari ro'yxati
  const systemStaff = Array.isArray(staff) && staff.length > 0 ? staff : demoStaffList.map(s => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: `${s.name.toLowerCase().replace(/\s/g, '')}@clinic.uz`,
    role: s.position === 'Admin' ? 'admin' : s.position === 'Bosh shifokor' ? 'doctor' : 'staff',
    permissions: {
      patients: true,
      appointments: true,
      medications: true,
      billing: s.position === 'Admin' || s.position === 'Hisobchi',
      inventory: true,
      reports: s.position === 'Admin' || s.position === 'Bosh shifokor',
      admin: s.position === 'Admin'
    },
    branchId: 1,
    telegram: s.chatId
  }));

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isOtpMode && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isOtpMode, timer]);

  // Focus first OTP input when OTP mode activates
  useEffect(() => {
    if (isOtpMode && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [isOtpMode]);

  // Reset OTP digits when OTP mode activates
  useEffect(() => {
    if (isOtpMode) {
      setOtpDigits(['', '', '', '']);
      setOtp('');
    }
  }, [isOtpMode]);

  // Demo mode uchun demo staff tanlash
  const handleDemoStaffSelect = (staffMember) => {
    setSelectedDemoStaff(staffMember);
    setPhone(staffMember.phone);
    setTelegramChatId(staffMember.chatId);
    setDemoMode(true);
  };

  // Demo rejimida tezkor kirish
  const handleDemoLogin = () => {
    if (!selectedDemoStaff) {
      setError("Iltimos, demo xodimni tanlang!");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const demoUser = {
        id: selectedDemoStaff.id,
        name: selectedDemoStaff.name,
        email: `${selectedDemoStaff.name.toLowerCase().replace(/\s/g, '')}@clinic.uz`,
        phone: selectedDemoStaff.phone,
        role: selectedDemoStaff.position === 'Admin' ? 'admin' : 
               selectedDemoStaff.position === 'Bosh shifokor' ? 'doctor' : 'staff',
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: selectedDemoStaff.position === 'Admin' || selectedDemoStaff.position === 'Hisobchi',
          inventory: true,
          reports: selectedDemoStaff.position === 'Admin' || selectedDemoStaff.position === 'Bosh shifokor',
          admin: selectedDemoStaff.position === 'Admin'
        },
        branchId: 1,
        loginMethod: 'demo'
      };
      
      if (onLogin) onLogin(demoUser);
      if (setCurrentUser) setCurrentUser(demoUser);
      
      logLogin(demoUser, 'demo');
      
      if (setLogins) {
        setLogins((prevLogins) => {
          const newLogins = [
            ...prevLogins,
            {
              id: Date.now(),
              userId: demoUser.id,
              name: demoUser.name,
              email: demoUser.email,
              phone: demoUser.phone,
              role: demoUser.role,
              timestamp: new Date().toISOString(),
              loginMethod: 'demo',
            },
          ];
          saveToLocalStorage('logins', newLogins);
          return newLogins;
        });
      }
      
      setModalContent({
        title: 'Demo rejimida kirish',
        message: `👋 Xush kelibsiz, ${selectedDemoStaff.name}!\n\n📋 Lavozim: ${selectedDemoStaff.position}\n🎮 Demo rejimida tizimga kirdingiz.`,
      });
      setShowModal(true);
      setTimeout(() => navigate('/'), 1500);
      setIsLoading(false);
    }, 1000);
  };

  // Send OTP via Telegram
  const sendOtp = async (phoneNumber, chatId) => {
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Demo rejimda test OTP ko'rsatish
      if (demoMode || chatId === '123456789' || phoneNumber === '+998901234567') {
        const testOtp = '1234';
        const otpData = {
          phone: phoneNumber,
          otp: testOtp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        const currentOtps = getFromLocalStorage('otpCodes', []);
        const filteredOtps = currentOtps.filter((o) => o.phone !== phoneNumber);
        filteredOtps.push(otpData);
        saveToLocalStorage('otpCodes', filteredOtps);
        
        setModalContent({
          title: 'Test OTP kodi',
          message: `🔑 Demo rejimda: OTP kodingiz: ${testOtp}\n\n💡 Haqiqiy tizimda OTP Telegram orqali yuboriladi.`,
        });
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        return true;
      }

      const otpData = {
        phone: phoneNumber,
        otp: generatedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const currentOtps = getFromLocalStorage('otpCodes', []);
      const filteredOtps = currentOtps.filter((o) => o.phone !== phoneNumber);
      filteredOtps.push(otpData);
      saveToLocalStorage('otpCodes', filteredOtps);

      const message = `🦷 SDK DENTAL Xodim Login OTP\n\nSizning tasdiqlash kodingiz: ${generatedOtp}\n\nKod 10 daqiqa amal qiladi.\n\n⚠️ Bu kodni hech kim bilan baham ko'rmang!`;

      const success = await sendTelegramMessage(chatId, message);
      return success;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

  // Verify OTP
  const verifyOtp = (phoneNumber, enteredOtp) => {
    try {
      // Demo rejimda test OTP tekshiruvi
      if (demoMode || enteredOtp === '1234') {
        return true;
      }
      
      const currentOtps = getFromLocalStorage('otpCodes', []);
      const otpData = currentOtps.find((o) => o.phone === phoneNumber && o.otp === enteredOtp);

      if (!otpData) {
        return false;
      }

      const now = new Date();
      const expiresAt = new Date(otpData.expiresAt);

      if (now > expiresAt) {
        const filteredOtps = currentOtps.filter((o) => o.phone !== phoneNumber);
        saveToLocalStorage('otpCodes', filteredOtps);
        return false;
      }

      const filteredOtps = currentOtps.filter((o) => o.phone !== phoneNumber);
      saveToLocalStorage('otpCodes', filteredOtps);
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return enteredOtp === '1234';
    }
  };

  // Handle phone submission
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!phone || !/^\+998\d{9}$/.test(phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    if (!telegramChatId || !/^\d+$/.test(telegramChatId)) {
      setError('Telegram Chat ID faqat raqamlardan iborat bo\'lishi kerak');
      setIsLoading(false);
      return;
    }

    const staffMembers = systemStaff;
    const staffMember = staffMembers.find((s) => s.phone === phone);
    if (!staffMember) {
      setError('Bu telefon raqami bilan xodim topilmadi');
      setIsLoading(false);
      return;
    }

    try {
      const success = await sendOtp(phone, telegramChatId);
      if (success) {
        setTempUser({
          id: staffMember.id,
          name: staffMember.name,
          email: staffMember.email || '',
          phone: staffMember.phone,
          role: staffMember.role || 'staff',
          permissions: staffMember.permissions || {
            patients: true,
            appointments: true,
            medications: true,
            billing: false,
            inventory: true,
            reports: false,
            admin: false,
          },
          branchId: staffMember.branchId || null,
          loginMethod: 'phone_otp',
        });
        setIsOtpMode(true);
        setTimer(120);
        setCanResend(false);
      } else {
        setError('OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      }
    } catch (error) {
      setError('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpVerify = async (otpCode) => {
    setIsLoading(true);
    setError('');

    try {
      const isValid = verifyOtp(phone, otpCode);
      if (isValid && tempUser) {
        if (onLogin) onLogin(tempUser);
        if (setCurrentUser) setCurrentUser(tempUser);
        
        logLogin(tempUser, 'phone_otp');

        if (setLogins) {
          setLogins((prevLogins) => {
            const newLogins = [
              ...prevLogins,
              {
                id: Date.now(),
                userId: tempUser.id,
                name: tempUser.name,
                email: tempUser.email,
                phone: tempUser.phone,
                role: tempUser.role,
                timestamp: new Date().toISOString(),
                loginMethod: 'phone_otp',
              },
            ];
            saveToLocalStorage('logins', newLogins);
            return newLogins;
          });
        }

        setModalContent({
          title: 'Xodim sifatida kirish',
          message: `✅ Tizimga muvaffaqiyatli kirdingiz!\n\n👤 Xush kelibsiz, ${tempUser.name}!`,
        });
        setShowModal(true);
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError("Noto'g'ri OTP kodi. Iltimos, qayta urinib ko'ring.");
      }
    } catch (error) {
      setError('Tekshirishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP form submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    await handleOtpVerify(otp);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setTimer(120);
    setCanResend(false);
    setError('');
    setOtp('');
    setOtpDigits(['', '', '', '']);

    try {
      const staffMember = systemStaff.find((s) => s.phone === phone);
      if (staffMember && telegramChatId) {
        const success = await sendOtp(phone, telegramChatId);
        if (!success) {
          setError('OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        } else {
          setSuccessMessage("OTP kodi qayta yuborildi!");
        }
      } else {
        setError('Xodim uchun Telegram chat ID topilmadi');
      }
    } catch (error) {
      setError('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // OTP input change handler
  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const fullOtp = newOtpDigits.join('');
    setOtp(fullOtp);

    if (fullOtp.length === 4 && autoVerify) {
      setTimeout(() => handleOtpVerify(fullOtp), 500);
    }
  };

  // OTP key down handler
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Paste handler for OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const numbers = pasteData.replace(/\D/g, '').slice(0, 4);

    const newOtpDigits = [...otpDigits];
    numbers.split('').forEach((num, index) => {
      if (index < 4) newOtpDigits[index] = num;
    });

    setOtpDigits(newOtpDigits);
    setOtp(numbers);

    const lastFilledIndex = Math.min(numbers.length - 1, 3);
    if (otpInputRefs.current[lastFilledIndex]) {
      otpInputRefs.current[lastFilledIndex].focus();
    }

    if (numbers.length === 4 && autoVerify) {
      setTimeout(() => handleOtpVerify(numbers), 500);
    }
  };

  // Focus handlers
  const handleFocus = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="staff-login-page">
      <div className="dental-bg-pattern"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <FiUser className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">
              {isOtpMode ? 'OTP tasdiqlash' : demoMode ? 'Demo rejim - Xodim tanlash' : 'Xodim kirishi'}
            </h2>
            <p className="login-subtitle">
              {isOtpMode 
                ? 'Telefon raqamingizga yuborilgan kodni kiriting' 
                : demoMode 
                ? 'Demo rejimda kirish uchun xodimni tanlang'
                : 'Xodim sifatida tizimga kiring'}
            </p>
          </div>

          {error && (
            <div className="alert-error">
              <FiAlertCircle className="alert-icon-custom" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-success">
              <FiCheck className="alert-icon-custom" />
              <span>{successMessage}</span>
            </div>
          )}

          {demoMode && !isOtpMode ? (
            <div className="demo-staff-selector">
              <div className="demo-staff-list">
                {demoStaffList.map((staffMember) => (
                  <div
                    key={staffMember.id}
                    className={`demo-staff-card ${selectedDemoStaff?.id === staffMember.id ? 'selected' : ''}`}
                    onClick={() => handleDemoStaffSelect(staffMember)}
                  >
                    <div className="demo-staff-avatar">
                      <FiUser size={32} />
                    </div>
                    <div className="demo-staff-info">
                      <h4>{staffMember.name}</h4>
                      <p>{staffMember.position}</p>
                      <small>{staffMember.phone}</small>
                    </div>
                    {selectedDemoStaff?.id === staffMember.id && (
                      <div className="demo-staff-check">
                        <FiCheck />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="demo-actions">
                <button
                  className="demo-login-btn"
                  onClick={handleDemoLogin}
                  disabled={!selectedDemoStaff || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Kirilmoqda...
                    </>
                  ) : (
                    <>
                      <FiSmartphone /> Demo rejimda kirish
                    </>
                  )}
                </button>
                <button
                  className="back-button"
                  onClick={() => {
                    setDemoMode(false);
                    setSelectedDemoStaff(null);
                    setPhone('');
                    setTelegramChatId('');
                  }}
                >
                  <FiArrowLeft /> Oddiy rejimga o'tish
                </button>
              </div>
            </div>
          ) : isOtpMode ? (
            <form onSubmit={handleOtpSubmit} className="login-form">
              <div className="otp-info">
                <p className="otp-message">
                  Telegram orqali yuborilgan 4 xonali kodni kiriting
                </p>
                <p className="otp-hint" dangerouslySetInnerHTML={{ __html: '(Test rejimida: <strong>1234</strong>)' }} />
                <div className="auto-verify-option">
                  <label className="auto-verify-label">
                    <input
                      type="checkbox"
                      checked={autoVerify}
                      onChange={(e) => setAutoVerify(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Kod to'liq kiritilganda avtomatik tekshirish
                  </label>
                </div>
              </div>

              <div className="otp-inputs-container">
                <div className="otp-inputs-group">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handlePaste}
                      onFocus={() => handleFocus(`otp-${index}`)}
                      onBlur={() => handleBlur(`otp-${index}`)}
                      className={`otp-digit-input ${otpDigits[index] ? 'filled' : ''} ${
                        isFocused[`otp-${index}`] ? 'focused' : ''
                      }`}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <div className="otp-digits-display">
                  {otpDigits.map((digit, index) => (
                    <span
                      key={index}
                      className={`otp-digit ${digit ? 'active' : ''} ${
                        isFocused[`otp-${index}`] ? 'focused' : ''
                      }`}
                    >
                      {digit || '•'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="otp-timer">
                <div className="countdown-timer">
                  <span>Qayta yuborish: </span>
                  <span className="timer-display">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || otp.length !== 4}
              >
                {isLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Tekshirilmoqda...
                  </>
                ) : (
                  <><FiCheck /> Tasdiqlash</>
                )}
              </button>

              <div className="otp-actions">
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOtp}
                  disabled={!canResend}
                >
                  Kodni qayta yuborish
                </button>
                <button
                  type="button"
                  className="back-button"
                  onClick={() => {
                    setIsOtpMode(false);
                    setOtpDigits(['', '', '', '']);
                    setOtp('');
                    setTimer(120);
                    setCanResend(false);
                  }}
                >
                  <FiArrowLeft /> Orqaga
                </button>
              </div>

              <div className="otp-help">
                <p>
                  <strong>💡 Qo'llanma:</strong> Kodni bitta inputga yozing yoki har bir raqamni alohida kiriting.
                  Kod to'liq kiritilganda avtomatik tekshiriladi.
                </p>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handlePhoneSubmit} className="login-form">
                <div className={`input-group ${isFocused.phone ? 'focused' : ''}`}>
                  <FiPhone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="+998 XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => handleFocus('phone')}
                    onBlur={() => handleBlur('phone')}
                    className="input-field"
                    required
                    autoComplete="tel"
                  />
                </div>

                <div className={`input-group ${isFocused.telegram ? 'focused' : ''}`}>
                  <FiMail className="input-icon" />
                  <input
                    type="text"
                    placeholder="Telegram Chat ID"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    onFocus={() => handleFocus('telegram')}
                    onBlur={() => handleBlur('telegram')}
                    className="input-field"
                    required
                    autoComplete="off"
                  />
                </div>

                <button
                  type="submit"
                  className={`submit-button ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      OTP yuborilmoqda...
                    </>
                  ) : (
                    <><FiPhoneCall /> OTP yuborish</>
                  )}
                </button>

                <div className="login-hint">
                  <p>📌 Ma'lumot:</p>
                  <ul>
                    <li>Telefon raqami tizimda ro'yxatdan o'tgan bo'lishi kerak</li>
                    <li>Telegram Chat ID ni kiriting</li>
                    <li>OTP kodi Telegram orqali yuboriladi</li>
                    <li>Test rejimida <strong>1234</strong> kodidan foydalaning</li>
                  </ul>
                </div>
              </form>

              <div className="login-divider">
                <span>yoki</span>
              </div>

              <button
                className="demo-mode-btn"
                onClick={() => setDemoMode(true)}
              >
                <FiSmartphone /> Demo rejimda sinab ko'rish
              </button>
            </>
          )}

          <div className="login-options">
            <button
              type="button"
              className="login-option-btn"
              onClick={() => navigate('/login')}
            >
              <FiArrowLeft /> Foydalanuvchi kirishi
            </button>
            <button
              type="button"
              className="login-option-btn"
              onClick={() => navigate('/admin-login')}
            >
              <FiShield /> Admin kirishi
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{modalContent.title}</h2>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <div className="modal-content">
              <p>{modalContent.message}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-primary" onClick={closeModal}>
                Davom etish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffLogin;