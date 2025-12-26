import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiEye, FiEyeOff, FiArrowLeft, FiUser, FiPhone, FiX } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { AppContext } from '../App';
import { getFromLocalStorage, saveToLocalStorage, logLogin, sendTelegramMessage } from '../utils';
import './UserLogin.css';

const UserLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({});
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);
  const [tempUser, setTempUser] = useState(null);
  const [authMethod, setAuthMethod] = useState('email');

  const navigate = useNavigate();
  const { users, setUsers, setLogins } = useContext(AppContext);

  // Test rejimi uchun telefon raqamlar (o‘zgartirishingiz mumkin)
  const TEST_PHONES = ['+998901234567', '+998999999999', '+998123456789'];

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
    if (isOtpMode) {
      setOtpDigits(['', '', '', '']);
      setOtp('');
    }
  }, [isOtpMode]);

  const handleFocus = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

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

      const message = `🦷 KEKSRI Tizimiga kirish kodi\n\nSizning tasdiqlash kodingiz: ${generatedOtp}\nBu kod 10 daqiqa amal qiladi.\n\nHech kimga bu kodni bermang.`;

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

  const handleOtpChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }

    const fullOtp = newOtpDigits.join('');
    setOtp(fullOtp);

    if (fullOtp.length === 4 && autoVerify) {
      setTimeout(() => handleOtpVerify(fullOtp), 500);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      document.getElementById(`otp-${index + 1}`)?.focus();
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
    document.getElementById(`otp-${lastFilledIndex}`)?.focus();

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
        if (isRegisterMode) {
          const updatedUsers = [...users, tempUser];
          setUsers(updatedUsers);
          saveToLocalStorage('users', updatedUsers);
        }

        onLogin(tempUser);
        logLogin(tempUser);

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
          title: isRegisterMode ? "Muvaffaqiyatli ro'yxatdan o'tish" : "Foydalanuvchi sifatida kirish",
          message: "Bemor portaliga xush kelibsiz!",
        });
        setShowModal(true);
        setTimeout(() => {
          navigate('/foydalanuvchi');
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
      const user = users.find((u) => u.phone === phone);
      if (user && telegramChatId) {
        const success = await sendOtp(phone, telegramChatId);
        if (!success) {
          setError("OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        }
      } else {
        setError("Foydalanuvchi uchun Telegram chat ID topilmadi");
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
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

      const user = users.find((u) => u.email === email && u.password === password && u.role === 'patient');
      if (user) {
        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: 'patient',
          loginMethod: 'email',
        };

        onLogin(userData);
        logLogin(userData);
        setLogins((prevLogins) => {
          const newLogins = [
            ...prevLogins,
            {
              id: Date.now(),
              userId: userData.id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
              timestamp: new Date().toISOString(),
              loginMethod: 'email',
            },
          ];
          saveToLocalStorage('logins', newLogins);
          return newLogins;
        });
        setModalContent({
          title: 'Foydalanuvchi sifatida kirish',
          message: 'Bemor portaliga xush kelibsiz!',
        });
        setShowModal(true);
        setTimeout(() => {
          navigate('/foydalanuvchi');
        }, 1500);
      } else {
        setError("Noto'g'ri email yoki parol");
      }
      setIsLoading(false);
    } else {
      // TELEFON AUTH
      if (!/^\+998\d{9}$/.test(phone)) {
        setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
        setIsLoading(false);
        return;
      }

      // *** YANGI: TEST REJIMI - OTP SO‘RAMASDAN TO‘G‘RIDAN KIRISH ***
      if (TEST_PHONES.includes(phone)) {
        let testUser = users.find((u) => u.phone === phone);

        // Agar baza da yo‘q bo‘lsa, avtomatik yaratib qo‘yamiz (test uchun)
        if (!testUser) {
          testUser = {
            id: Date.now(),
            name: 'Test Foydalanuvchi',
            email: 'test@example.com',
            phone: phone,
            password: 'test123',
            role: 'patient',
          };
          const updatedUsers = [...users, testUser];
          setUsers(updatedUsers);
          saveToLocalStorage('users', updatedUsers);
        }

        const userData = {
          id: testUser.id,
          name: testUser.name,
          email: testUser.email || '',
          phone: testUser.phone,
          role: 'patient',
          loginMethod: 'phone_direct_test',
        };

        onLogin(userData);
        logLogin(userData);

        setLogins((prevLogins) => {
          const newLogins = [
            ...prevLogins,
            {
              id: Date.now(),
              userId: userData.id,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
              timestamp: new Date().toISOString(),
              loginMethod: 'phone_direct_test',
            },
          ];
          saveToLocalStorage('logins', newLogins);
          return newLogins;
        });

        setModalContent({
          title: 'Test rejimida kirish',
          message: 'Bemor portaliga xush kelibsiz! (OTP siz)',
        });
        setShowModal(true);
        setTimeout(() => {
          navigate('/foydalanuvchi');
        }, 1500);

        setIsLoading(false);
        return;
      }
      // *** TEST REJIMI TUGADI ***

      if (!telegramChatId || !/^\d+$/.test(telegramChatId)) {
        setError("Telegram Chat ID faqat raqamlardan iborat bo'lishi kerak");
        setIsLoading(false);
        return;
      }

      const user = users.find((u) => u.phone === phone && u.role === 'patient');
      if (user) {
        setTempUser({
          id: user.id,
          name: user.name,
          email: user.email || '',
          phone: user.phone,
          role: 'patient',
          loginMethod: 'phone_otp',
        });
        sendOtp(phone, telegramChatId).then((success) => {
          if (success) {
            setIsOtpMode(true);
            setTimer(120);
            setCanResend(false);
          } else {
            setError("OTP yuborishda xatolik. Iltimos, qayta urinib ko'ring.");
            setIsLoading(false);
          }
        });
      } else {
        setError("Bu telefon raqami ro'yxatdan o'tmagan.");
        setIsLoading(false);
      }
    }
  };

  const handleRegister = (e) => {
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

    if (users.find((u) => u.email === email || u.phone === phone)) {
      setError("Bu email yoki telefon raqami allaqachon ro'yxatdan o'tgan");
      setIsLoading(false);
      return;
    }

    const userRequest = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      role: 'patient',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTempUser(userRequest);
    if (authMethod === 'phone') {
      sendOtp(phone, telegramChatId).then((success) => {
        if (success) {
          setIsOtpMode(true);
          setTimer(120);
          setCanResend(false);
        } else {
          setError("OTP yuborishda xatolik. Iltimos, qayta urinib ko'ring.");
          setIsLoading(false);
        }
      });
    } else {
      const pendingUsers = getFromLocalStorage('pendingUsers', []);
      pendingUsers.push(userRequest);
      saveToLocalStorage('pendingUsers', pendingUsers);

      setModalContent({
        title: "Ro'yxatdan o'tish so'rovi yuborildi",
        message: "Sizning ro'yxatdan o'tish so'rovingiz admin tomonidan ko'rib chiqiladi.",
      });
      setShowModal(true);
      setIsLoading(false);
      setTimeout(() => {
        setIsRegisterMode(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setTelegramChatId('');
        setShowModal(false);
      }, 2000);
    }
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
                : isRegisterMode
                ? "Foydalanuvchi sifatida ro'yxatdan o'tish"
                : 'Foydalanuvchi Kirishi'}
            </h2>
            <p className="login-subtitle">
              {isOtpMode
                ? 'Telefon raqamingizga yuborilgan kodni kiriting'
                : isRegisterMode
                ? 'Bemor sifatida ro\'yxatdan o\'ting'
                : 'Bemor portaliga kirish'}
            </p>
          </div>

          {error && (
            <div className="alert-error">
              <div className="alert-icon">!</div>
              <span>{error}</span>
            </div>
          )}

          {/* Qolgan JSX qismi o‘zgarmadi – to‘liq kodni saqlab qoldim */}
          {isOtpMode ? (
            <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify(otp); }} className="login-form">
              <div className="otp-info">
                <p className="otp-message">
                  Telegram orqali yuborilgan 4 xonali kodni kiriting
                </p>
                <p className="otp-hint" dangerouslySetInnerHTML={{ __html: "(Test rejimida: <strong>1234</strong>)" }} />
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
                      id={`otp-${index}`}
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
          ) : isRegisterMode ? (
            <form onSubmit={handleRegister} className="login-form">
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
                  "Ro'yxatdan o'tish so'rovini yuborish"
                )}
              </button>

              <button
                type="button"
                className="back-to-login"
                onClick={() => setIsRegisterMode(false)}
              >
                <FiArrowLeft /> Kirishga qaytish
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="login-form">
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
                onClick={() => setIsRegisterMode(true)}
              >
                Ro'yxatdan o'tish
              </button>
            </form>
          )}

          <div className="login-options"></div>
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

export default UserLogin;