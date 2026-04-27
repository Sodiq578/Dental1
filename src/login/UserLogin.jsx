import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiLock, FiMail, FiEye, FiEyeOff, FiArrowLeft, FiUser, 
  FiPhone, FiX, FiCheck, FiClock, FiBell, FiShield, 
  FiSmartphone, FiCalendar, FiChevronDown, FiChevronUp,
  FiAlertCircle, FiLogIn, FiUserPlus, FiSend
} from 'react-icons/fi';
import { FaTooth, FaStethoscope, FaUserMd, FaShieldAlt, FaHeartbeat, FaSmile, FaGoogle, FaApple, FaFacebook } from 'react-icons/fa';
import { AppContext } from '../App';
import { getFromLocalStorage, saveToLocalStorage, logLogin, sendTelegramMessage } from '../utils';
import './UserLogin.css';

const UserLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    name: '',
    telegramChatId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' });
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [authMethod, setAuthMethod] = useState('email');
  const [rememberMe, setRememberMe] = useState(false);
  const [savedUsers, setSavedUsers] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState('login');

  const navigate = useNavigate();
  const { users, setUsers, setLogins, setCurrentUser } = useContext(AppContext);
  const otpInputs = useRef([]);

  // TEST MODE - Oson kirish uchun demo hisoblar
  const DEMO_ACCOUNTS = {
    email: {
      email: 'demo@sdkdental.uz',
      password: 'demo123',
      name: 'Demo Foydalanuvchi',
      phone: '+998901234567'
    },
    phone: {
      phone: '+998901234567',
      name: 'Demo Foydalanuvchi',
      email: 'demo@sdkdental.uz'
    }
  };

  // Test rejimida tezkor kirish
  const quickLogin = (type) => {
    if (type === 'email') {
      setFormData(prev => ({
        ...prev,
        email: DEMO_ACCOUNTS.email.email,
        password: DEMO_ACCOUNTS.email.password
      }));
      setAuthMethod('email');
      // Avtomatik kirish
      setTimeout(() => {
        const demoUser = {
          id: Date.now(),
          name: DEMO_ACCOUNTS.email.name,
          email: DEMO_ACCOUNTS.email.email,
          phone: DEMO_ACCOUNTS.email.phone,
          role: 'patient',
          isDemo: true
        };
        onLogin(demoUser);
        saveUser(demoUser);
        navigate('/foydalanuvchi');
      }, 100);
    } else if (type === 'phone') {
      setFormData(prev => ({
        ...prev,
        phone: DEMO_ACCOUNTS.phone.phone
      }));
      setAuthMethod('phone');
      // Avtomatik kirish
      setTimeout(() => {
        const demoUser = {
          id: Date.now() + 1,
          name: DEMO_ACCOUNTS.phone.name,
          email: DEMO_ACCOUNTS.phone.email,
          phone: DEMO_ACCOUNTS.phone.phone,
          role: 'patient',
          isDemo: true
        };
        onLogin(demoUser);
        saveUser(demoUser);
        navigate('/foydalanuvchi');
      }, 100);
    }
  };

  useEffect(() => {
    const saved = getFromLocalStorage('savedUsers', []);
    setSavedUsers(saved);
    
    const rememberData = getFromLocalStorage('rememberMe', null);
    if (rememberData && rememberData.user) {
      setRememberMe(true);
      const user = rememberData.user;
      if (user.email) {
        setFormData(prev => ({ ...prev, email: user.email }));
        setAuthMethod('email');
      } else if (user.phone) {
        setFormData(prev => ({ ...prev, phone: user.phone }));
        setAuthMethod('phone');
      }
    }

    const hasSeenWelcome = getFromLocalStorage('hasSeenWelcome', false);
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

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
    if (isOtpMode) {
      setOtpDigits(['', '', '', '']);
      setOtp('');
      otpInputs.current[0]?.focus();
    }
  }, [isOtpMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const saveUser = (userData) => {
    if (!rememberMe) return;
    
    const userToSave = {
      id: userData.id,
      name: userData.name,
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role,
      timestamp: new Date().toISOString(),
      avatarColor: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
    
    const existingIndex = savedUsers.findIndex(u => 
      (u.email && u.email === userToSave.email) || 
      (u.phone && u.phone === userToSave.phone)
    );
    
    let updatedUsers;
    if (existingIndex > -1) {
      updatedUsers = [...savedUsers];
      updatedUsers[existingIndex] = userToSave;
    } else {
      updatedUsers = [userToSave, ...savedUsers].slice(0, 5);
    }
    
    setSavedUsers(updatedUsers);
    saveToLocalStorage('savedUsers', updatedUsers);
    
    saveToLocalStorage('rememberMe', {
      rememberMe: true,
      user: userToSave,
      token: `rm_${Date.now()}_${userToSave.id}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  const removeSavedUser = (userId, e) => {
    if (e) e.stopPropagation();
    const updatedUsers = savedUsers.filter(user => user.id !== userId);
    setSavedUsers(updatedUsers);
    saveToLocalStorage('savedUsers', updatedUsers);
    
    const rememberData = getFromLocalStorage('rememberMe', null);
    if (rememberData && rememberData.user && rememberData.user.id === userId) {
      saveToLocalStorage('rememberMe', null);
      setRememberMe(false);
    }
  };

  const clearSavedUsers = () => {
    setSavedUsers([]);
    saveToLocalStorage('savedUsers', []);
    saveToLocalStorage('rememberMe', null);
    setShowSaved(false);
    setRememberMe(false);
  };

  const handleSavedUserClick = (user) => {
    if (user.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
      setAuthMethod('email');
    } else if (user.phone) {
      setFormData(prev => ({ ...prev, phone: user.phone }));
      setAuthMethod('phone');
    }
    setShowSaved(false);
  };

  const sendOtp = async (phoneNumber, chatId) => {
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      
      const otpData = {
        phone: phoneNumber,
        otp: generatedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        attempts: 0
      };

      const currentOtps = getFromLocalStorage('otpCodes', []);
      const filteredOtps = currentOtps.filter((o) => o.phone !== phoneNumber);
      filteredOtps.push(otpData);
      saveToLocalStorage('otpCodes', filteredOtps);

      const message = `🦷 SDK DENTAL kirish kodi: ${generatedOtp}\n\nKod 10 daqiqa amal qiladi.`;
      
      let success = true;
      if (chatId) {
        success = await sendTelegramMessage(chatId, message);
      }

      if (!success && process.env.NODE_ENV === 'development') {
        console.log('Test OTP:', generatedOtp);
        success = true;
      }

      return success;
    } catch (error) {
      console.error('OTP yuborishda xatolik:', error);
      return process.env.NODE_ENV === 'development';
    }
  };

  const verifyOtp = (phoneNumber, enteredOtp) => {
    try {
      const currentOtps = getFromLocalStorage('otpCodes', []);
      const otpData = currentOtps.find((o) => o.phone === phoneNumber);
      
      if (!otpData) return false;
      
      const isExpired = new Date(otpData.expiresAt) < new Date();
      if (isExpired) {
        const validOtps = currentOtps.filter(o => new Date(o.expiresAt) > new Date());
        saveToLocalStorage('otpCodes', validOtps);
        return false;
      }
      
      if (otpData.attempts >= 3) {
        return false;
      }
      
      const isValid = otpData.otp === enteredOtp;
      
      if (isValid) {
        const updatedOtps = currentOtps.filter(o => o.phone !== phoneNumber);
        saveToLocalStorage('otpCodes', updatedOtps);
        return true;
      } else {
        otpData.attempts += 1;
        const updatedOtps = currentOtps.map(o => 
          o.phone === phoneNumber ? otpData : o
        );
        saveToLocalStorage('otpCodes', updatedOtps);
        return false;
      }
    } catch (error) {
      console.error('OTP tekshirishda xatolik:', error);
      return false;
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    if (value && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
    
    const fullOtp = newOtpDigits.join('');
    setOtp(fullOtp);
    
    if (fullOtp.length === 4) {
      setTimeout(() => handleOtpVerify(fullOtp), 300);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = '';
        setOtpDigits(newOtpDigits);
        setOtp(newOtpDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpVerify = async (otpCode) => {
    if (otpCode.length !== 4) {
      setError("Iltimos, 4 xonali kodni kiriting");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const isValid = verifyOtp(formData.phone, otpCode) || otpCode === '1234';
      
      if (isValid) {
        if (isRegisterMode) {
          const newUser = {
            ...tempUser,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            isVerified: true
          };
          
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          saveToLocalStorage('users', updatedUsers);
          
          setModalContent({
            title: "Tabriklaymiz!",
            message: "Ro'yxatdan muvaffaqiyatli o'tdingiz",
            type: 'success'
          });
          setShowModal(true);
          
          onLogin(newUser);
          saveUser(newUser);
          logLogin(newUser);
          
          setLogins((prevLogins) => {
            const newLogins = [
              ...prevLogins,
              {
                id: Date.now(),
                userId: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                timestamp: new Date().toISOString(),
                loginMethod: 'phone_otp',
                status: 'success'
              },
            ];
            saveToLocalStorage('logins', newLogins);
            return newLogins;
          });
          
          setTimeout(() => {
            navigate('/foydalanuvchi');
          }, 1500);
        } else {
          onLogin(tempUser);
          saveUser(tempUser);
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
                status: 'success'
              },
            ];
            saveToLocalStorage('logins', newLogins);
            return newLogins;
          });
          
          navigate('/foydalanuvchi');
        }
      } else {
        setError("Noto'g'ri kod. Qayta urinib ko'ring.");
        otpInputs.current.forEach(input => {
          if (input) {
            input.classList.add('error');
            setTimeout(() => {
              input.classList.remove('error');
            }, 1000);
          }
        });
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      console.error('OTP tasdiqlash xatosi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError('');
    setOtp('');
    setOtpDigits(['', '', '', '']);
    setTimer(120);
    setCanResend(false);
    
    try {
      const success = await sendOtp(formData.phone, formData.telegramChatId);
      if (success) {
        setSuccess("Yangi kod yuborildi!");
        setTimeout(() => setSuccess(''), 3000);
        
        setTimeout(() => {
          otpInputs.current[0]?.focus();
        }, 100);
      } else {
        setError("Kod yuborishda xatolik.");
      }
    } catch (error) {
      setError("Xatolik yuz berdi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (authMethod === 'email') {
        if (!formData.email || !formData.password) {
          setError("Iltimos, email va parolni kiriting");
          setIsLoading(false);
          return;
        }
        
        // TEST MODE - Demo hisob bilan tekshirish
        if (formData.email === DEMO_ACCOUNTS.email.email && formData.password === DEMO_ACCOUNTS.email.password) {
          const demoUser = {
            id: Date.now(),
            name: DEMO_ACCOUNTS.email.name,
            email: DEMO_ACCOUNTS.email.email,
            phone: DEMO_ACCOUNTS.email.phone,
            role: 'patient',
            isDemo: true,
            lastLogin: new Date().toISOString()
          };
          
          onLogin(demoUser);
          saveUser(demoUser);
          logLogin(demoUser);
          navigate('/foydalanuvchi');
          setIsLoading(false);
          return;
        }
        
        const user = users.find((u) => 
          u.email === formData.email && 
          u.password === formData.password && 
          u.role === 'patient'
        );
        
        if (user) {
          const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: 'patient',
            loginMethod: 'email',
            lastLogin: new Date().toISOString()
          };
          
          onLogin(userData);
          saveUser(userData);
          logLogin(userData);
          navigate('/foydalanuvchi');
        } else {
          setError("Email yoki parol noto'g'ri");
        }
      } else {
        if (!formData.phone) {
          setError("Telefon raqamni kiriting");
          setIsLoading(false);
          return;
        }
        
        // TEST MODE - Demo telefon bilan tekshirish
        if (formData.phone === DEMO_ACCOUNTS.phone.phone) {
          const demoUser = {
            id: Date.now() + 1,
            name: DEMO_ACCOUNTS.phone.name,
            email: DEMO_ACCOUNTS.phone.email,
            phone: DEMO_ACCOUNTS.phone.phone,
            role: 'patient',
            isDemo: true,
            lastLogin: new Date().toISOString()
          };
          
          onLogin(demoUser);
          saveUser(demoUser);
          logLogin(demoUser);
          navigate('/foydalanuvchi');
          setIsLoading(false);
          return;
        }
        
        const user = users.find((u) => u.phone === formData.phone && u.role === 'patient');
        if (user) {
          setTempUser({
            id: user.id,
            name: user.name,
            email: user.email || '',
            phone: user.phone,
            role: 'patient',
            loginMethod: 'phone_otp'
          });
          
          const success = await sendOtp(formData.phone, formData.telegramChatId);
          if (success) {
            setIsOtpMode(true);
            setTimer(120);
            setCanResend(false);
            setSuccess("Telefon raqamingizga kod yuborildi!");
          } else {
            setError("Kod yuborishda xatolik.");
          }
        } else {
          setError("Bu raqam ro'yxatdan o'tmagan");
        }
      }
    } catch (error) {
      setError("Xatolik yuz berdi");
      console.error('Login xatosi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError("Barcha maydonlarni to'ldiring");
        setIsLoading(false);
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("To'g'ri email kiriting");
        setIsLoading(false);
        return;
      }
      
      if (!/^\+998\d{9}$/.test(formData.phone)) {
        setError("To'g'ri telefon raqam kiriting (+998XXXXXXXXX)");
        setIsLoading(false);
        return;
      }
      
      if (formData.password.length < 6) {
        setError("Parol kamida 6 belgi bo'lishi kerak");
        setIsLoading(false);
        return;
      }
      
      const existingUser = users.find((u) => u.email === formData.email || u.phone === formData.phone);
      if (existingUser) {
        setError("Bu email yoki telefon allaqachon ro'yxatdan o'tgan");
        setIsLoading(false);
        return;
      }
      
      const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        telegramChatId: formData.telegramChatId,
        role: 'patient',
        createdAt: new Date().toISOString(),
        isVerified: true
      };
      
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveToLocalStorage('users', updatedUsers);
      
      setModalContent({
        title: "Tabriklaymiz!",
        message: "Ro'yxatdan muvaffaqiyatli o'tdingiz",
        type: 'success'
      });
      setShowModal(true);
      
      onLogin(newUser);
      saveUser(newUser);
      logLogin(newUser);
      
      setTimeout(() => {
        navigate('/foydalanuvchi');
      }, 1500);
      
    } catch (error) {
      setError("Xatolik yuz berdi");
      console.error('Register xatosi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeWelcome = () => {
    setShowWelcome(false);
    saveToLocalStorage('hasSeenWelcome', true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      phone: '',
      password: '',
      name: '',
      telegramChatId: ''
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsRegisterMode(tab === 'register');
    setIsOtpMode(false);
    resetForm();
  };

  const handleGoBack = () => {
    if (isOtpMode) {
      setIsOtpMode(false);
      resetForm();
    } else {
      navigate(-1);
    }
  };

  // Demo hisobni to'ldirish
  const fillDemoAccount = () => {
    setFormData(prev => ({
      ...prev,
      email: DEMO_ACCOUNTS.email.email,
      password: DEMO_ACCOUNTS.email.password
    }));
    setAuthMethod('email');
    setSuccess("Demo hisob ma'lumotlari to'ldirildi!");
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="app-wrapper">
      {/* Background */}
      <div className="bg-gradient-layer"></div>
      <div className="float-shape shape-1"></div>
      <div className="float-shape shape-2"></div>
      <div className="float-shape shape-3"></div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="welcome-screen">
          <div className="welcome-card">
            <button className="welcome-close" onClick={closeWelcome}>
              <FiX />
            </button>
            <div className="welcome-icon-box">
              <FaTooth />
            </div>
            <h2 className="welcome-title">SDK DENTAL</h2>
            <p className="welcome-sub">Professional stomatologiya</p>
            <p className="welcome-desc">
              <strong>Zamonaviy texnologiyalar</strong> va <strong>tajribali shifokorlar</strong>
            </p>
            <div className="welcome-features">
              <div className="welcome-feat">
                <div className="feat-icon"><FiClock /></div>
                <div><h4>24/7 Yordam</h4><p>Har vaqt</p></div>
              </div>
              <div className="welcome-feat">
                <div className="feat-icon"><FaUserMd /></div>
                <div><h4>Mutaxassislar</h4><p>Malakali</p></div>
              </div>
              <div className="welcome-feat">
                <div className="feat-icon"><FiBell /></div>
                <div><h4>Eslatmalar</h4><p>Navbatlar</p></div>
              </div>
            </div>
            <button className="welcome-btn" onClick={closeWelcome}>Boshlash</button>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="main-panel">
        <button className="nav-back-btn" onClick={handleGoBack}>
          <FiArrowLeft /> Orqaga
        </button>

        <div className="panel-header">
          <div className="logo-block">
            <div className="logo-icon">
              <FaTooth />
            </div>
            <div>
              <h1 className="logo-text">SDK DENTAL</h1>
              <p className="logo-slogan">Sog'lig'ingiz ishonchda</p>
            </div>
          </div>

          <div className="tab-switch">
            <button 
              className={`tab-item ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Kirish
            </button>
            <button 
              className={`tab-item ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Ro'yxatdan o'tish
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="msg-box msg-success">
            <FiCheck /> <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="msg-box msg-error">
            <FiAlertCircle /> <span>{error}</span>
          </div>
        )}

        <div className="panel-body">
          {isOtpMode ? (
            // OTP Form
            <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify(otp); }} className="auth-form">
              <div className="otp-head">
                <h3>Tasdiqlash kodi</h3>
                <p>Telegram orqali 4 xonali kod keldi</p>
                <div className="otp-hint">
                  <FiSmartphone />
                  <span>Test: <code>1234</code> kodini ishlating</span>
                </div>
              </div>

              <div className="otp-fields">
                {[0, 1, 2, 3].map((idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputs.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    value={otpDigits[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`otp-field ${otpDigits[idx] ? 'filled' : ''}`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div className="otp-timer">
                <FiClock /> <span>Muddati: <strong>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</strong></span>
              </div>

              <button type="submit" className={`action-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading || otp.length !== 4}>
                {isLoading ? <div className="loader"></div> : 'Tasdiqlash'}
              </button>

              <div className="otp-footer">
                <button type="button" className={`resend-link ${canResend ? 'ready' : ''}`} onClick={handleResendOtp} disabled={!canResend}>
                  {canResend ? 'Kodni qayta yuborish' : `Kuting ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`}
                </button>
                <button type="button" className="back-link" onClick={() => { setIsOtpMode(false); resetForm(); }}>
                  Orqaga
                </button>
              </div>
            </form>
          ) : isRegisterMode ? (
            // Register Form
            <form onSubmit={handleRegister} className="auth-form">
              <div className="input-row">
                <label><FiUser /> Ism familiya</label>
                <input type="text" name="name" placeholder="To'liq ismingiz" value={formData.name} onChange={handleInputChange} required />
              </div>

              <div className="input-row">
                <label>Kirish usuli</label>
                <div className="method-group">
                  <button type="button" className={`method ${authMethod === 'email' ? 'selected' : ''}`} onClick={() => setAuthMethod('email')}>
                    <FiMail /> Email
                  </button>
                  <button type="button" className={`method ${authMethod === 'phone' ? 'selected' : ''}`} onClick={() => setAuthMethod('phone')}>
                    <FiPhone /> Telefon
                  </button>
                </div>
              </div>

              {authMethod === 'email' ? (
                <div className="input-row">
                  <label><FiMail /> Email</label>
                  <input type="email" name="email" placeholder="example@email.com" value={formData.email} onChange={handleInputChange} required />
                </div>
              ) : (
                <>
                  <div className="input-row">
                    <label><FiPhone /> Telefon</label>
                    <input type="tel" name="phone" placeholder="+998 XX XXX XX XX" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="input-row">
                    <label><FiSend /> Telegram Chat ID</label>
                    <input type="text" name="telegramChatId" placeholder="Chat ID" value={formData.telegramChatId} onChange={handleInputChange} />
                    <small className="field-note">@BotFather dan oling</small>
                  </div>
                </>
              )}

              <div className="input-row">
                <label><FiLock /> Parol</label>
                <div className="pass-wrap">
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Parol" value={formData.password} onChange={handleInputChange} required />
                  <button type="button" className="pass-eye" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <label className="check-item">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="check-mark"></span>
                <span>Meni eslab qol</span>
              </label>

              <label className="check-item">
                <input type="checkbox" required />
                <span className="check-mark"></span>
                <span><a href="/terms">Shartlar</a> va <a href="/privacy">maxfiylik</a>ga roziman</span>
              </label>

              <button type="submit" className={`action-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                {isLoading ? <div className="loader"></div> : 'Ro\'yxatdan o\'tish'}
              </button>

              <div className="switch-prompt">
                Hisobingiz bormi? <button type="button" className="switch-link" onClick={() => handleTabChange('login')}>Kirish</button>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="auth-form">
              {/* TEST MODE - Quick Demo Access */}
              <div className="demo-section">
                <div className="demo-title">
                  <FaSmile /> Test rejimi
                </div>
                <div className="demo-buttons">
                  <button type="button" className="demo-btn" onClick={() => quickLogin('email')}>
                    <FiMail /> Demo Email
                  </button>
                  <button type="button" className="demo-btn" onClick={() => quickLogin('phone')}>
                    <FiPhone /> Demo Telefon
                  </button>
                  <button type="button" className="demo-btn fill" onClick={fillDemoAccount}>
                    <FiUser /> To'ldirish
                  </button>
                </div>
                <p className="demo-note">⚡ Bir tugma bilan kirish! Parol: <code>demo123</code></p>
              </div>

              {/* Saved Users */}
              {savedUsers.length > 0 && (
                <div className="saved-wrap">
                  <div className="saved-toggle" onClick={() => setShowSaved(!showSaved)}>
                    <span>👤 Saqlangan ({savedUsers.length})</span>
                    {showSaved ? <FiChevronUp /> : <FiChevronDown />}
                  </div>
                  {showSaved && (
                    <div className="saved-list">
                      <div className="saved-list-header">
                        <span>Avvalgi kirishlar</span>
                        <button type="button" onClick={clearSavedUsers}><FiX /> Tozalash</button>
                      </div>
                      {savedUsers.map(user => (
                        <div key={user.id} className="saved-item" onClick={() => handleSavedUserClick(user)}>
                          <div className="saved-avatar" style={{ background: user.avatarColor || '#d6e9ff' }}>
                            {user.name[0]}
                          </div>
                          <div className="saved-info">
                            <div className="saved-name">{user.name}</div>
                            <div className="saved-contact">{user.email || user.phone}</div>
                          </div>
                          <button type="button" className="saved-remove" onClick={(e) => removeSavedUser(user.id, e)}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Auth Method */}
              <div className="method-group full">
                <button type="button" className={`method ${authMethod === 'email' ? 'selected' : ''}`} onClick={() => setAuthMethod('email')}>
                  <FiMail /> Email
                </button>
                <button type="button" className={`method ${authMethod === 'phone' ? 'selected' : ''}`} onClick={() => setAuthMethod('phone')}>
                  <FiPhone /> Telefon
                </button>
              </div>

              {authMethod === 'email' ? (
                <>
                  <div className="input-row">
                    <input type="email" name="email" placeholder="Email manzil" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="input-row">
                    <div className="pass-wrap">
                      <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Parol" value={formData.password} onChange={handleInputChange} required />
                      <button type="button" className="pass-eye" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-row">
                    <input type="tel" name="phone" placeholder="+998 XX XXX XX XX" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="input-row">
                    <input type="text" name="telegramChatId" placeholder="Telegram Chat ID (ixtiyoriy)" value={formData.telegramChatId} onChange={handleInputChange} />
                  </div>
                </>
              )}

              <div className="login-extra">
                <label className="check-item">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span className="check-mark"></span>
                  <span>Eslab qol</span>
                </label>
                {authMethod === 'email' && (
                  <button type="button" className="forgot-link" onClick={() => {
                    setModalContent({ title: 'Yordam', message: 'Administratorga murojaat qiling:\n📞 +998 90 123 45 67', type: 'info' });
                    setShowModal(true);
                  }}>
                    Parol unutdingizmi?
                  </button>
                )}
              </div>

              <button type="submit" className={`action-btn login-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                {isLoading ? <div className="loader"></div> : <><FiLogIn /> Tizimga kirish</>}
              </button>

              <div className="admin-link">
                <button type="button" className="admin-btn" onClick={() => navigate('/admin/login')}>
                  Admin panel
                </button>
              </div>

              <div className="switch-prompt">
                Hisobingiz yo'qmi? <button type="button" className="switch-link" onClick={() => handleTabChange('register')}>Ro'yxatdan o'tish</button>
              </div>
            </form>
          )}
        </div>

        <div className="panel-footer">
          <FaShieldAlt /> <span>SSL shifrlangan xavfsiz tizim</span>
        </div>
      </div>

      {/* Footer */}
      <div className="global-footer">
        <div className="footer-links">
          <a href="/about">Loyiha haqida</a>
          <a href="/contact">Bog'lanish</a>
          <a href="/privacy">Maxfiylik</a>
        </div>
        <p>© 2024 SDK DENTAL</p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{modalContent.type === 'success' ? '✅' : 'ℹ️'} {modalContent.title}</h3>
              <button onClick={closeModal}><FiX /></button>
            </div>
            <div className="modal-body">{modalContent.message}</div>
            <div className="modal-foot">
              <button className="modal-btn primary" onClick={closeModal}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLogin;