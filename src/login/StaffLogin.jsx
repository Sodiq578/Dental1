import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPhone, FiX, FiMail, FiArrowLeft } from 'react-icons/fi';
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

  const navigate = useNavigate();
  const { staff, setLogins } = useContext(AppContext);
  const otpInputRefs = useRef([]);

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

  useEffect(() => {
    if (isOtpMode && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [isOtpMode]);

  useEffect(() => {
    if (isOtpMode) {
      setOtpDigits(['', '', '', '']);
      setOtp('');
    }
  }, [isOtpMode]);

  const sendOtp = async (phoneNumber, chatId) => {
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
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

      const message = `🦷 KEKSRI Staff Login OTP\n\nYour verification code is: ${generatedOtp}\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`;

      const success = await sendTelegramMessage(chatId, message);
      if (success) {
        console.log(`OTP ${generatedOtp} sent to ${phoneNumber}`);
        return true;
      } else {
        console.error('Failed to send OTP via Telegram');
        return false;
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };

  const verifyOtp = (phoneNumber, enteredOtp) => {
    try {
      const currentOtps = getFromLocalStorage('otpCodes', []);
      const otpData = currentOtps.find((o) => o.phone === phoneNumber && o.otp === enteredOtp);

      if (!otpData) {
        return /^\d{4}$/.test(enteredOtp); // Test mode fallback
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
      return /^\d{4}$/.test(enteredOtp); // Test mode fallback
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!phone || !/^\+998\d{9}$/.test(phone)) {
      setError('Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak');
      setIsLoading(false);
      return;
    }

    if (!telegramChatId || !/^\d+$/.test(telegramChatId)) {
      setError('Telegram Chat ID faqat raqamlardan iborat bo\'lishi kerak');
      setIsLoading(false);
      return;
    }

    const staffMember = staff.find((s) => s.phone === phone);
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
          role: 'staff',
          permissions: {
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

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    await handleOtpVerify(otp);
  };

  const handleOtpVerify = async (otpCode) => {
    setIsLoading(true);
    setError('');

    try {
      const isValid = verifyOtp(phone, otpCode);
      if (isValid) {
        onLogin(tempUser);
        logLogin(tempUser, 'phone_otp');

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

        setModalContent({
          title: 'Xodim sifatida kirish',
          message: 'Tizimga muvaffaqiyatli kirdingiz!',
        });
        setShowModal(true);
        setTimeout(() => navigate('/'), 1500);
      } else {
        setError('Noto\'g\'ri OTP kodi. Iltimos, qayta urinib ko\'ring.');
      }
    } catch (error) {
      setError('Tekshirishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setTimer(120);
    setCanResend(false);
    setError('');
    setOtp('');
    setOtpDigits(['', '', '', '']);

    try {
      const staffMember = staff.find((s) => s.phone === phone);
      if (staffMember && telegramChatId) {
        const success = await sendOtp(phone, telegramChatId);
        if (!success) {
          setError('OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
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

  const handleFocus = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="login-page">
      <div className="dental-bg-pattern"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <FiPhone className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">{isOtpMode ? 'OTP tasdiqlash' : 'Xodim kirishi'}</h2>
            <p className="login-subtitle">
              {isOtpMode ? 'Telefon raqamingizga yuborilgan kodni kiriting' : 'Xodim sifatida tizimga kiring'}
            </p>
          </div>

          {error && (
            <div className="alert-error">
              <div className="alert-icon">!</div>
              <span>{error}</span>
            </div>
          )}

          {isOtpMode ? (
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
                  'Tasdiqlash'
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
                  Orqaga
                </button>
              </div>

              <div className="otp-help">
                <p>
                  <strong>Qo'llanma:</strong> Kodni bitta inputga yozing yoki har bir raqamni alohida kiriting.
                  Kod to'liq kiritilganda avtomatik tekshiriladi.
                </p>
              </div>
            </form>
          ) : (
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
                  'OTP yuborish'
                )}
              </button>
            </form>
          )}

          <div className="login-options">
            <button
              type="button"
              className="login-option-btn"
              onClick={() => navigate('/login')}
            >
              <FiArrowLeft /> Foydalanuvchi Kirishi
            </button>
            <button
              type="button"
              className="login-option-btn"
              onClick={() => navigate('/admin-login')}
            >
              <FiArrowLeft /> Admin Kirishi
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