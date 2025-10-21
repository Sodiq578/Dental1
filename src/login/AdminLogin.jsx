import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiX, FiMail, FiShield, FiPhone, FiEye, FiEyeOff, FiArrowLeft, FiMoreVertical, FiUser } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { AppContext } from '../App';
import { logLogin, getFromLocalStorage, saveToLocalStorage, savePendingAdminRequest, sendTelegramMessage } from '../utils';
import './AdminLogin.css';


const AdminLogin = ({ onLogin }) => {
  const [authMethod, setAuthMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminRequestMode, setIsAdminRequestMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [tempUser, setTempUser] = useState(null);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({});
  const [showAdminSecretLogin, setShowAdminSecretLogin] = useState(false);
  const [showAdminList, setShowAdminList] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const navigate = useNavigate();
  const { setLogins, pendingAdmins, setPendingAdmins } = useContext(AppContext);
  const otpInputRefs = useRef([]);
  const additionalOptionsRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isOtpMode && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (additionalOptionsRef.current && !additionalOptionsRef.current.contains(event.target)) {
        setShowAdditionalOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      const message = `🦷 KEKSRI Admin Login OTP\n\nYour verification code is: ${generatedOtp}\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`;

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

  const handleFocus = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
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

  const handleOtpVerify = async (otpCode) => {
    setIsLoading(true);
    setError('');

    try {
      const isValid = verifyOtp(phone, otpCode);
      if (isValid) {
        if (isAdminRequestMode) {
          const updatedPendingAdmins = [...pendingAdmins, tempUser];
          setPendingAdmins(updatedPendingAdmins);
          saveToLocalStorage('pendingAdmins', updatedPendingAdmins);
        }

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
          title: isAdminRequestMode ? "Admin so'rovi yuborildi" : 'Admin sifatida kirish',
          message: isAdminRequestMode
            ? "Sizning admin sifatida ro'yxatdan o'tish so'rovingiz yuborildi."
            : 'Tizimga muvaffaqiyatli kirdingiz!',
        });
        setShowModal(true);
        setTimeout(() => {
          navigate(isAdminRequestMode ? '/login' : '/admin');
        }, 1500);
      } else {
        setError("Noto'g'ri OTP kodi. Iltimos, qayta urinib ko'ring.");
      }
    } catch (error) {
      setError("Tekshirishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
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
      const admin = getFromLocalStorage('admins', []).find((a) => a.phone === phone);
      if (admin && telegramChatId) {
        const success = await sendOtp(phone, telegramChatId);
        if (!success) {
          setError("OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        }
      } else {
        setError("Admin uchun Telegram chat ID topilmadi yoki admin topilmadi");
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecretAdminLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (secretKey === 'Sodiqjon123') {
      const admins = getFromLocalStorage('admins', []);
      setShowAdminList(true);
      setShowAdminSecretLogin(false);
    } else {
      setError("Noto'g'ri sirli kalit");
    }
    setIsLoading(false);
  };

  const handleAdminSelect = (admin) => {
    setSelectedAdmin(admin);
    const adminUser = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: 'admin',
      permissions: {
        patients: true,
        appointments: true,
        medications: true,
        billing: true,
        inventory: true,
        reports: true,
        admin: true,
      },
      branchId: admin.branchId || null,
      loginMethod: 'secret_key',
    };

    onLogin(adminUser);
    logLogin(adminUser);
    setLogins((prevLogins) => {
      const newLogins = [
        ...prevLogins,
        {
          id: Date.now(),
          userId: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          phone: adminUser.phone,
          role: adminUser.role,
          timestamp: new Date().toISOString(),
          loginMethod: 'secret_key',
        },
      ];
      saveToLocalStorage('logins', newLogins);
      return newLogins;
    });

    setModalContent({
      title: 'Admin sifatida kirish',
      message: `${admin.name} sifatida tizimga kirdingiz!`,
    });
    setShowModal(true);
    setTimeout(() => {
      navigate('/admin');
    }, 1500);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (authMethod === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Noto'g'ri email formati");
        setIsLoading(false);
        return;
      }
      if (!password) {
        setError("Parol kiritilishi shart");
        setIsLoading(false);
        return;
      }

      const admins = getFromLocalStorage('admins', []);
      const admin = admins.find((a) => a.email === email && a.password === password);

      if (admin) {
        const adminUser = {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: 'admin',
          permissions: {
            patients: true,
            appointments: true,
            medications: true,
            billing: true,
            inventory: true,
            reports: true,
            admin: true,
          },
          branchId: admin.branchId || null,
          loginMethod: 'admin',
        };

        onLogin(adminUser);
        logLogin(adminUser);
        setLogins((prevLogins) => {
          const newLogins = [
            ...prevLogins,
            {
              id: Date.now(),
              userId: adminUser.id,
              name: adminUser.name,
              email: adminUser.email,
              phone: adminUser.phone,
              role: adminUser.role,
              timestamp: new Date().toISOString(),
              loginMethod: 'admin',
            },
          ];
          saveToLocalStorage('logins', newLogins);
          return newLogins;
        });
        setModalContent({
          title: 'Admin sifatida kirish',
          message: 'Tizimga muvaffaqiyatli kirdingiz!',
        });
        setShowModal(true);
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } else {
        setError("Noto'g'ri email yoki parol");
      }
    } else {
      if (!/^\+998\d{9}$/.test(phone)) {
        setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
        setIsLoading(false);
        return;
      }
      if (!telegramChatId || !/^\d+$/.test(telegramChatId)) {
        setError("Telegram Chat ID faqat raqamlardan iborat bo'lishi kerak");
        setIsLoading(false);
        return;
      }

      const admins = getFromLocalStorage('admins', []);
      const admin = admins.find((a) => a.phone === phone);
      if (admin) {
        setTempUser({
          id: admin.id,
          name: admin.name,
          email: admin.email || '',
          phone: admin.phone,
          role: 'admin',
          permissions: {
            patients: true,
            appointments: true,
            medications: true,
            billing: true,
            inventory: true,
            reports: true,
            admin: true,
          },
          branchId: admin.branchId || null,
          loginMethod: 'phone_otp',
        });
        sendOtp(phone, telegramChatId).then((success) => {
          if (success) {
            setIsOtpMode(true);
            setTimer(120);
            setCanResend(false);
          } else {
            setError("OTP yuborishda xatolik. Iltimos, qayta urinib ko'ring.");
          }
        });
      } else {
        setError("Bu telefon raqami bilan admin topilmadi.");
      }
    }
    setIsLoading(false);
  };

  const handleAdminRequest = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name || !email || !phone || !password) {
      setError("Barcha maydonlar to'ldirilishi kerak");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }

    if (!/^\+998\d{9}$/.test(phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    const admins = getFromLocalStorage('admins', []);
    if (admins.find((a) => a.email === email || a.phone === phone)) {
      setError("Bu email yoki telefon raqami allaqachon ro'yxatdan o'tgan");
      setIsLoading(false);
      return;
    }

    const adminRequest = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      role: 'admin',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTempUser(adminRequest);
    if (authMethod === 'phone') {
      sendOtp(phone, telegramChatId).then((success) => {
        if (success) {
          setIsOtpMode(true);
          setTimer(120);
          setCanResend(false);
        } else {
          setError("OTP yuborishda xatolik. Iltimos, qayta urinib ko'ring.");
        }
      });
    } else {
      savePendingAdminRequest(adminRequest);
      setPendingAdmins([...pendingAdmins, adminRequest]);
      setModalContent({
        title: "Admin so'rovi yuborildi",
        message: "Sizning admin sifatida ro'yxatdan o'tish so'rovingiz yuborildi.",
      });
      setShowModal(true);
      setTimeout(() => {
        setIsAdminRequestMode(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setTelegramChatId('');
        setShowModal(false);
        navigate('/login');
      }, 2000);
    }
    setIsLoading(false);
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
              <FaCrown className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">
              {isOtpMode
                ? 'OTP tasdiqlash'
                : showAdminSecretLogin
                ? 'Sirli kalit orqali kirish'
                : isAdminRequestMode
                ? "Admin sifatida ro'yxatdan o'tish"
                : 'Admin Kirishi'}
            </h2>
            <p className="login-subtitle">
              {isOtpMode
                ? 'Telefon raqamingizga yuborilgan kodni kiriting'
                : showAdminSecretLogin
                ? 'Sirli kalitni kiriting'
                : isAdminRequestMode
                ? 'Admin sifatida ro\'yxatdan o\'ting'
                : 'Admin sifatida tizimga kiring'}
            </p>
            {!isOtpMode && !showAdminSecretLogin && !isAdminRequestMode && (
              <div className="additional-options">
                <button
                  type="button"
                  className="more-options-btn"
                  onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
                >
                  <FiMoreVertical />
                </button>
                {showAdditionalOptions && (
                  <div className="options-dropdown" ref={additionalOptionsRef}>
                    <button
                      className="option-item"
                      onClick={() => {
                        setShowAdminSecretLogin(true);
                        setShowAdditionalOptions(false);
                      }}
                    >
                      <FiShield /> Sirli kalit orqali kirish
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="alert-error">
              <div className="alert-icon">!</div>
              <span>{error}</span>
            </div>
          )}

          {showAdminList ? (
            <div className="admin-list">
              <h3>Adminni tanlang</h3>
              {getFromLocalStorage('admins', []).map((admin) => (
                <button
                  key={admin.id}
                  className="admin-select-btn"
                  onClick={() => handleAdminSelect(admin)}
                >
                  {admin.name} ({admin.email})
                </button>
              ))}
              <button
                className="back-button"
                onClick={() => {
                  setShowAdminList(false);
                  setShowAdminSecretLogin(true);
                  setSecretKey('');
                }}
              >
                Orqaga
              </button>
            </div>
          ) : showAdminSecretLogin ? (
            <form onSubmit={handleSecretAdminLogin} className="login-form">
              <div className={`input-group ${isFocused.secretKey ? 'focused' : ''}`}>
                <FiShield className="input-icon" />
                <input
                  type="password"
                  placeholder="Sirli kalit"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  onFocus={() => handleFocus('secretKey')}
                  onBlur={() => handleBlur('secretKey')}
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
                    Tekshirilmoqda...
                  </>
                ) : (
                  'Kirish'
                )}
              </button>
              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setShowAdminSecretLogin(false);
                  setSecretKey('');
                }}
              >
                Orqaga
              </button>
            </form>
          ) : isOtpMode ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOtpVerify(otp);
              }}
              className="login-form"
            >
              <div className="otp-info">
                <p className="otp-message">
                  Telegram orqali yuborilgan 4 xonali kodni kiriting
                </p>
                <p
                  className="otp-hint"
                  dangerouslySetInnerHTML={{ __html: '(Test rejimida: <strong>1234</strong>)' }}
                />
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
          ) : isAdminRequestMode ? (
            <form onSubmit={handleAdminRequest} className="login-form">
              <div className="selection-group">
                <label className="section-label">Autentifikatsiya usuli:</label>
                <div className="auth-method-selection">
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="email"
                      checked={authMethod === 'email'}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiMail className="option-icon" />
                    Email
                  </label>
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="phone"
                      checked={authMethod === 'phone'}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiPhone className="option-icon" />
                    Telefon
                  </label>
                </div>
              </div>

              <div className={`input-group ${isFocused.name ? 'focused' : ''}`}>
                <FiUser className="input-icon" />
                <input
                  type="text"
                  placeholder="To'liq ism"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => handleFocus('name')}
                  onBlur={() => handleBlur('name')}
                  className="input-field"
                  required
                  autoComplete="name"
                />
              </div>

              <div className={`input-group ${isFocused.email ? 'focused' : ''}`}>
                <FiMail className="input-icon" />
                <input
                  type="email"
                  placeholder="Elektron pochta"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  className="input-field"
                  required
                  autoComplete="email"
                />
              </div>

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

              {authMethod === 'phone' && (
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
              )}

              <div className={`input-group ${isFocused.password ? 'focused' : ''}`}>
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  className="input-field"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <button
                type="submit"
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Yuborilmoqda...
                  </>
                ) : (
                  "Admin so'rovini yuborish"
                )}
              </button>

              <button
                type="button"
                className="back-to-login"
                onClick={() => {
                  setIsAdminRequestMode(false);
                  setName('');
                  setEmail('');
                  setPhone('');
                  setPassword('');
                  setTelegramChatId('');
                }}
              >
                <FiArrowLeft /> Kirishga qaytish
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="login-form">
              <div className="selection-group">
                <label className="section-label">Autentifikatsiya usuli:</label>
                <div className="auth-method-selection">
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="email"
                      checked={authMethod === 'email'}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiMail className="option-icon" />
                    Email
                  </label>
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="phone"
                      checked={authMethod === 'phone'}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiPhone className="option-icon" />
                    Telefon
                  </label>
                </div>
              </div>

              {authMethod === 'email' ? (
                <div className={`input-group ${isFocused.email ? 'focused' : ''}`}>
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    className="input-field"
                    required
                    autoComplete="username"
                  />
                </div>
              ) : (
                <>
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
                </>
              )}

              {authMethod === 'email' && (
                <div className={`input-group ${isFocused.password ? 'focused' : ''}`}>
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Parol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    className="input-field"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    Kirilmoqda...
                  </>
                ) : (
                  <>
                    <FaCrown /> Kirish
                  </>
                )}
              </button>

              <button
                type="button"
                className="register-btn"
                onClick={() => setIsAdminRequestMode(true)}
              >
                Admin sifatida ro'yxatdan o'tish
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

export default AdminLogin;