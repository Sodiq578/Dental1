import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiEye, FiEyeOff, FiArrowLeft, FiUser, FiPhone, FiX, FiCheck, FiClock, FiBell } from 'react-icons/fi';
import { FaTooth, FaStethoscope, FaUserMd, FaShieldAlt } from 'react-icons/fa';
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
  const [showTestNumbers, setShowTestNumbers] = useState(false);

  const navigate = useNavigate();
  const { users, setUsers, setLogins, setCurrentUser } = useContext(AppContext);
  const otpInputs = useRef([]);

  const TEST_PHONES = [
    { number: '+998901234567', name: 'Test 1' },
    { number: '+998999999999', name: 'Test 2' },
    { number: '+998123456789', name: 'Test 3' }
  ];

  useEffect(() => {
    // Saved users ni yuklash
    const saved = getFromLocalStorage('savedUsers', []);
    setSavedUsers(saved);
    
    // Remember me ma'lumotlarini yuklash
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

    // Welcome modalni faqat birinchi marta ko'rsatish
    const hasSeenWelcome = getFromLocalStorage('hasSeenWelcome', false);
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

  // Timer uchun useEffect
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

  // OTP mode ga o'tganda inputlarni tozalash
  useEffect(() => {
    if (isOtpMode) {
      setOtpDigits(['', '', '', '']);
      setOtp('');
      otpInputs.current[0]?.focus();
    }
  }, [isOtpMode]);

  // Form inputlarini boshqarish
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xatolarni tozalash
    if (error) setError('');
  };

  // Foydalanuvchini saqlash
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
    
    // Takroriy kirishlarni oldini olish
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
    
    // Remember me ma'lumotlarini saqlash
    saveToLocalStorage('rememberMe', {
      rememberMe: true,
      user: userToSave,
      token: `rm_${Date.now()}_${userToSave.id}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };

  // Saqlangan foydalanuvchini o'chirish
  const removeSavedUser = (userId, e) => {
    if (e) e.stopPropagation();
    const updatedUsers = savedUsers.filter(user => user.id !== userId);
    setSavedUsers(updatedUsers);
    saveToLocalStorage('savedUsers', updatedUsers);
    
    // Agar o'chirilgan foydalanuvchi current bo'lsa, rememberMe dan ham o'chirish
    const rememberData = getFromLocalStorage('rememberMe', null);
    if (rememberData && rememberData.user && rememberData.user.id === userId) {
      saveToLocalStorage('rememberMe', null);
      setRememberMe(false);
    }
  };

  // Barcha saqlanganlarni tozalash
  const clearSavedUsers = () => {
    setSavedUsers([]);
    saveToLocalStorage('savedUsers', []);
    saveToLocalStorage('rememberMe', null);
    setShowSaved(false);
    setRememberMe(false);
  };

  // Saqlangan foydalanuvchini tanlash
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

  // OTP yuborish
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

      // OTP ni saqlash
      const currentOtps = getFromLocalStorage('otpCodes', []);
      const filteredOtps = currentOtps.filter((o) => o.phone !== phoneNumber);
      filteredOtps.push(otpData);
      saveToLocalStorage('otpCodes', filteredOtps);

      // Telegramga xabar yuborish
      const message = `🦷 SDK DENTAL kirish kodi: ${generatedOtp}\n\nKod 10 daqiqa amal qiladi.\nHech kimga bermang!`;
      
      let success = true;
      if (chatId) {
        success = await sendTelegramMessage(chatId, message);
      }

      // Agar Telegram xatolik bo'lsa ham, test rejimida davom etish
      if (!success && process.env.NODE_ENV === 'development') {
        console.log('Test OTP:', generatedOtp);
        success = true;
      }

      return success;
    } catch (error) {
      console.error('OTP yuborishda xatolik:', error);
      // Test rejimida har doim true qaytarish
      return process.env.NODE_ENV === 'development';
    }
  };

  // OTP ni tekshirish
  const verifyOtp = (phoneNumber, enteredOtp) => {
    try {
      const currentOtps = getFromLocalStorage('otpCodes', []);
      const otpData = currentOtps.find((o) => o.phone === phoneNumber);
      
      if (!otpData) return false;
      
      // Muddatni tekshirish
      const isExpired = new Date(otpData.expiresAt) < new Date();
      if (isExpired) {
        // Muddat o'tgan OTP larni tozalash
        const validOtps = currentOtps.filter(o => new Date(o.expiresAt) > new Date());
        saveToLocalStorage('otpCodes', validOtps);
        return false;
      }
      
      // Urinishlar sonini tekshirish
      if (otpData.attempts >= 3) {
        return false;
      }
      
      // OTP ni tekshirish
      const isValid = otpData.otp === enteredOtp;
      
      if (isValid) {
        // Muvaffaqiyatli tekshiruvdan keyin OTP ni o'chirish
        const updatedOtps = currentOtps.filter(o => o.phone !== phoneNumber);
        saveToLocalStorage('otpCodes', updatedOtps);
        return true;
      } else {
        // Noto'g'ri urinish - attempts ni oshirish
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

  // OTP inputlarini boshqarish
  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    // Keyingi inputga o'tish
    if (value && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
    
    // OTP ni birlashtirish
    const fullOtp = newOtpDigits.join('');
    setOtp(fullOtp);
    
    // Avtomatik tasdiqlash
    if (fullOtp.length === 4) {
      setTimeout(() => handleOtpVerify(fullOtp), 300);
    }
  };

  // OTP inputlarida klavish bosish
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Oldingi inputga o'tish
        otpInputs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        // Joriy inputni tozalash
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

  // OTP ni tasdiqlash
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
          // Yangi foydalanuvchini qo'shish
          const newUser = {
            ...tempUser,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            isVerified: true
          };
          
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          saveToLocalStorage('users', updatedUsers);
          
          // Tasdiqlash muvaffaqiyatli
          setModalContent({
            title: "Tabriklaymiz!",
            message: "Ro'yxatdan muvaffaqiyatli o'tdingiz",
            type: 'success'
          });
          setShowModal(true);
          
          // Login qilish
          onLogin(newUser);
          saveUser(newUser);
          
          // Login logini
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
          
          // Foydalanuvchi sahifasiga o'tish
          setTimeout(() => {
            navigate('/foydalanuvchi');
          }, 1500);
        } else {
          // Login qilish
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
        // OTP inputlarini qizil rangga o'zgartirish
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

  // OTP ni qayta yuborish
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
        
        // Birinchi inputga focus
        setTimeout(() => {
          otpInputs.current[0]?.focus();
        }, 100);
      } else {
        setError("Kod yuborishda xatolik. Iltimos, Chat ID ni tekshiring.");
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  // Login qilish
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (authMethod === 'email') {
        // Email orqali login
        if (!formData.email || !formData.password) {
          setError("Iltimos, barcha maydonlarni to'ldiring");
          setIsLoading(false);
          return;
        }
        
        const user = users.find((u) => 
          u.email === formData.email && 
          u.password === formData.password && 
          u.role === 'patient'
        );
        
        if (user) {
          // Login muvaffaqiyatli
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
          
          setLogins((prevLogins) => {
            const newLogins = [
              ...prevLogins,
              {
                id: Date.now(),
                userId: userData.id,
                name: userData.name,
                email: userData.email,
                phone: user.phone,
                role: userData.role,
                timestamp: new Date().toISOString(),
                loginMethod: 'email',
                status: 'success'
              },
            ];
            saveToLocalStorage('logins', newLogins);
            return newLogins;
          });
          
          navigate('/foydalanuvchi');
        } else {
          setError("Noto'g'ri email yoki parol");
        }
      } else {
        // Telefon orqali login
        if (!/^\+998\d{9}$/.test(formData.phone)) {
          setError("Iltimos, to'g'ri telefon raqamini kiriting");
          setIsLoading(false);
          return;
        }
        
        // Test raqamlarini tekshirish
        const testPhone = TEST_PHONES.find(t => t.number === formData.phone);
        if (testPhone) {
          // Test foydalanuvchi uchun
          let testUser = users.find((u) => u.phone === formData.phone);
          
          if (!testUser) {
            testUser = {
              id: Date.now(),
              name: testPhone.name,
              email: `${testPhone.number.replace('+', '')}@test.sdkdental`,
              phone: formData.phone,
              password: 'test123',
              role: 'patient',
              isTest: true
            };
            const updatedUsers = [...users, testUser];
            setUsers(updatedUsers);
            saveToLocalStorage('users', updatedUsers);
          }
          
          const userData = {
            id: testUser.id,
            name: testUser.name,
            email: testUser.email,
            phone: testUser.phone,
            role: 'patient',
            loginMethod: 'phone_direct_test',
            isTest: true
          };
          
          onLogin(userData);
          saveUser(userData);
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
                status: 'success'
              },
            ];
            saveToLocalStorage('logins', newLogins);
            return newLogins;
          });
          
          navigate('/foydalanuvchi');
          setIsLoading(false);
          return;
        }
        
        // Haqiqiy foydalanuvchi uchun
        if (!formData.telegramChatId) {
          setError("Iltimos, Telegram Chat ID ni kiriting");
          setIsLoading(false);
          return;
        }
        
        const user = users.find((u) => u.phone === formData.phone && u.role === 'patient');
        if (user) {
          // OTP yuborish
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
            setError("Kod yuborishda xatolik. Chat ID ni tekshiring.");
          }
        } else {
          setError("Bu raqam ro'yxatdan o'tmagan. Iltimos, ro'yxatdan o'ting.");
        }
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      console.error('Login xatosi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ro'yxatdan o'tish
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Validatsiya
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError("Iltimos, barcha maydonlarni to'ldiring");
        setIsLoading(false);
        return;
      }
      
      // Email validatsiya
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Iltimos, to'g'ri email manzilini kiriting");
        setIsLoading(false);
        return;
      }
      
      // Telefon validatsiya
      if (!/^\+998\d{9}$/.test(formData.phone)) {
        setError("Iltimos, to'g'ri telefon raqamini kiriting (+998XXXXXXXXX formatida)");
        setIsLoading(false);
        return;
      }
      
      // Parol validatsiya (kamida 6 belgi)
      if (formData.password.length < 6) {
        setError("Parol kamida 6 belgidan iborat bo'lishi kerak");
        setIsLoading(false);
        return;
      }
      
      // Foydalanuvchi mavjudligini tekshirish
      const existingUser = users.find((u) => u.email === formData.email || u.phone === formData.phone);
      if (existingUser) {
        setError("Bu email yoki telefon raqam allaqachon ro'yxatdan o'tgan");
        setIsLoading(false);
        return;
      }
      
      const userRequest = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        telegramChatId: formData.telegramChatId,
        role: 'patient',
        status: 'pending',
        createdAt: new Date().toISOString(),
        isVerified: false
      };
      
      setTempUser(userRequest);
      
      if (authMethod === 'phone' && formData.telegramChatId) {
        // Telefon orqali ro'yxatdan o'tish - OTP yuborish
        const success = await sendOtp(formData.phone, formData.telegramChatId);
        if (success) {
          setIsOtpMode(true);
          setTimer(120);
          setCanResend(false);
          setSuccess("Telefon raqamingizga tasdiqlash kodi yuborildi!");
        } else {
          setError("Kod yuborishda xatolik. Chat ID ni tekshiring.");
        }
      } else {
        // Email orqali ro'yxatdan o'tish
        const pendingUsers = getFromLocalStorage('pendingUsers', []);
        pendingUsers.push(userRequest);
        saveToLocalStorage('pendingUsers', pendingUsers);
        
        setModalContent({
          title: "So'rov muvaffaqiyatli yuborildi!",
          message: "Ro'yxatdan o'tish so'rovingiz administrator tomonidan ko'rib chiqilmoqda. Tasdiqlash haqida sizga xabar beramiz.",
          type: 'success'
        });
        setShowModal(true);
        
        // Formani tozalash
        setTimeout(() => {
          setIsRegisterMode(false);
          setFormData({
            email: '',
            phone: '',
            password: '',
            name: '',
            telegramChatId: ''
          });
          setShowModal(false);
        }, 3000);
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      console.error('Register xatosi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modalni yopish
  const closeModal = () => {
    setShowModal(false);
  };

  // Welcome modalni yopish
  const closeWelcome = () => {
    setShowWelcome(false);
    saveToLocalStorage('hasSeenWelcome', true);
  };

  // Test raqamini tanlash
  const handleTestNumberClick = (phoneNumber) => {
    setFormData(prev => ({ ...prev, phone: phoneNumber }));
    setShowTestNumbers(false);
  };

  // Formani tozalash
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

  // Tab o'zgartirish
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsRegisterMode(tab === 'register');
    setIsOtpMode(false);
    resetForm();
  };

  // Orqaga qaytish
  const handleGoBack = () => {
    if (isOtpMode) {
      setIsOtpMode(false);
      resetForm();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="login-page">
      {/* Background Animation */}
      <div className="bg-animation">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`wave wave-${i + 1}`}></div>
        ))}
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <FaTooth className="floating-icon tooth" />
        <FaStethoscope className="floating-icon stethoscope" />
        <FaUserMd className="floating-icon doctor" />
        <FaShieldAlt className="floating-icon shield" />
      </div>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="welcome-modal-overlay">
          <div className="welcome-modal">
            <div className="welcome-modal-content">
              <button className="welcome-close" onClick={closeWelcome}>
                <FiX />
              </button>
              
              <div className="welcome-header">
                <FaTooth className="welcome-icon" />
                <h2>SDK DENTAL</h2>
                <p className="welcome-subtitle">Professional stomatologiya klinikasi</p>
              </div>
              
              <div className="welcome-body">
                <p className="welcome-text">
                  <strong>Yangi asr texnologiyalari</strong> va <strong>tajribali mutaxassislar</strong> bilan. 
                  Sog'lig'ingiz - bizning mas'uliyatimiz.
                </p>
                
                <div className="welcome-features">
                  <div className="feature-item">
                    <div className="feature-icon">
                      <FiClock />
                    </div>
                    <div className="feature-text">
                      <h4>24/7 qo'llab-quvvatlash</h4>
                      <p>Har qanday vaqtda yordam oling</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <FaUserMd />
                    </div>
                    <div className="feature-text">
                      <h4>Tajribali shifokorlar</h4>
                      <p>Yuqori malakali mutaxassislar</p>
                    </div>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">
                      <FiBell />
                    </div>
                    <div className="feature-text">
                      <h4>Eslatma xizmati</h4>
                      <p>Navbatlarni eslab qolamiz</p>
                    </div>
                  </div>
                </div>
                
                <div className="welcome-security">
                  <FaShieldAlt className="security-icon" />
                  <p>Barcha ma'lumotlaringiz xavfsiz saqlanadi</p>
                </div>
              </div>
              
              <div className="welcome-footer">
                <button className="welcome-continue-btn" onClick={closeWelcome}>
                  Tushunarli, davom etish
                </button>
                <p className="welcome-note">Bu xabar faqat birinchi marta ko'rsatiladi</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="login-container">
        {/* Back Button */}
        <button className="back-button" onClick={handleGoBack}>
          <FiArrowLeft /> Orqaga
        </button>

        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="logo-section">
              <div className="logo-wrapper">
                <FaTooth className="main-logo" />
                <div className="logo-pulse"></div>
              </div>
              <div className="logo-text">
                <h1>SDK DENTAL</h1>
                <p className="tagline">Sog'lig'ingiz - bizning mas'uliyatimiz</p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="login-tabs">
              <button 
                className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => handleTabChange('login')}
              >
                Kirish
              </button>
              <button 
                className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => handleTabChange('register')}
              >
                Ro'yxatdan o'tish
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="success-message">
              <FiCheck className="success-icon" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <div className="error-icon">!</div>
              <span>{error}</span>
            </div>
          )}

          {/* Content */}
          <div className="login-content">
            {isOtpMode ? (
              /* OTP Form */
              <form onSubmit={(e) => { e.preventDefault(); handleOtpVerify(otp); }} className="login-form">
                <div className="otp-header">
                  <h3>📱 Telefon raqamingizga kod yuborildi</h3>
                  <p>Telegram orqali yuborilgan 4 xonali kodni kiriting</p>
                  <p className="otp-hint">
                    <strong>Test rejimi:</strong> <code>1234</code> kodini ishlatishingiz mumkin
                  </p>
                </div>

                <div className="otp-inputs-container">
                  <div className="otp-inputs">
                    {[0, 1, 2, 3].map((index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={otpDigits[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onFocus={(e) => e.target.select()}
                        className={`otp-input ${otpDigits[index] ? 'filled' : ''}`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <div className="otp-dots">
                    {[0, 1, 2, 3].map((index) => (
                      <div 
                        key={index} 
                        className={`otp-dot ${otpDigits[index] ? 'active' : ''}`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="otp-timer">
                  <FiClock className="timer-icon" />
                  <span>
                    Kod amal qilish muddati: 
                    <strong> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  className={`submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || otp.length !== 4}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Tekshirilmoqda...
                    </>
                  ) : (
                    'Tasdiqlash'
                  )}
                </button>

                <div className="otp-actions">
                  <button
                    type="button"
                    className={`resend-btn ${canResend ? 'active' : 'disabled'}`}
                    onClick={handleResendOtp}
                    disabled={!canResend || isLoading}
                  >
                    {canResend ? 'Kodni qayta yuborish' : 'Kutish...'}
                  </button>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => {
                      setIsOtpMode(false);
                      setOtpDigits(['', '', '', '']);
                      setOtp('');
                      setTimer(120);
                      setCanResend(false);
                    }}
                    disabled={isLoading}
                  >
                    Orqaga
                  </button>
                </div>
              </form>
            ) : isRegisterMode ? (
              /* Register Form */
              <form onSubmit={handleRegister} className="login-form">
                <div className="form-section">
                  <h3 className="section-title">Shaxsiy ma'lumotlar</h3>
                  
                  <div className="input-group">
                    <FiUser className="input-icon" />
                    <input
                      type="text"
                      name="name"
                      placeholder="To'liq ismingiz"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      autoComplete="name"
                    />
                    <div className="input-hint">Ism familiyangizni kiriting</div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">Kirish usuli</h3>
                  
                  <div className="auth-method-selector">
                    <div className="method-buttons">
                      <button
                        type="button"
                        className={`method-btn ${authMethod === 'email' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('email')}
                      >
                        <FiMail className="method-icon" />
                        <span>Email orqali</span>
                        <div className="method-badge">Tavsiya etiladi</div>
                      </button>
                      <button
                        type="button"
                        className={`method-btn ${authMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => setAuthMethod('phone')}
                      >
                        <FiPhone className="method-icon" />
                        <span>Telefon orqali</span>
                        <div className="method-badge">Tezkor</div>
                      </button>
                    </div>
                  </div>

                  {authMethod === 'email' ? (
                    <div className="input-group">
                      <FiMail className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email manzilingiz"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        autoComplete="email"
                      />
                      <div className="input-hint">example@email.com</div>
                    </div>
                  ) : (
                    <>
                      <div className="input-group">
                        <FiPhone className="input-icon" />
                        <input
                          type="tel"
                          name="phone"
                          placeholder="+998 XX XXX XX XX"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          autoComplete="tel"
                        />
                        <button
                          type="button"
                          className="test-numbers-btn"
                          onClick={() => setShowTestNumbers(!showTestNumbers)}
                        >
                          Test raqamlar
                        </button>
                        
                        {showTestNumbers && (
                          <div className="test-numbers-dropdown">
                            {TEST_PHONES.map((test, index) => (
                              <div
                                key={index}
                                className="test-number-item"
                                onClick={() => handleTestNumberClick(test.number)}
                              >
                                <span className="test-number">{test.number}</span>
                                <span className="test-name">{test.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="input-group">
                        <FiMail className="input-icon" />
                        <input
                          type="text"
                          name="telegramChatId"
                          placeholder="Telegram Chat ID"
                          value={formData.telegramChatId}
                          onChange={handleInputChange}
                          required={authMethod === 'phone'}
                          autoComplete="off"
                        />
                        <div className="input-hint">
                          @BotFather dan olingan ID raqami
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="form-section">
                  <h3 className="section-title">Xavfsizlik</h3>
                  
                  <div className="input-group password-group">
                    <FiLock className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Parol"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                    <div className="password-strength">
                      <div 
                        className={`strength-bar ${formData.password.length >= 6 ? 'strong' : 'weak'}`}
                      ></div>
                      <span className="strength-text">
                        {formData.password.length >= 6 ? 'Kuchli parol' : 'Kamida 6 belgi'}
                      </span>
                    </div>
                  </div>

                  <div className="remember-section">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      <span className="checkbox-label">
                        Ma'lumotlarimni eslab qolish
                        <span className="hint">(30 kun davomida)</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="terms-agreement">
                  <label className="checkbox-container">
                    <input type="checkbox" required />
                    <span className="checkmark"></span>
                    <span className="checkbox-label">
                      Men <a href="/terms" target="_blank" rel="noopener noreferrer">foydalanish shartlari</a> va 
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">maxfiylik siyosati</a>ga roziman
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className={`submit-btn register-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Jo'natilmoqda...
                    </>
                  ) : (
                    <>
                      <FaTooth className="btn-icon" />
                      Ro'yxatdan o'tish
                    </>
                  )}
                </button>

                <div className="switch-mode">
                  <p>
                    Allaqachon hisobingiz bormi?{' '}
                    <button
                      type="button"
                      className="switch-btn"
                      onClick={() => handleTabChange('login')}
                    >
                      Kirish
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* Login Form */
              <form onSubmit={handleLogin} className="login-form">
                {/* Saved Users */}
                {savedUsers.length > 0 && (
                  <div className="saved-users-section">
                    <div 
                      className="saved-toggle"
                      onClick={() => setShowSaved(!showSaved)}
                    >
                      <div className="saved-toggle-left">
                        <span className="saved-icon">👤</span>
                        <span>Saqlangan foydalanuvchilar ({savedUsers.length})</span>
                      </div>
                      <span className={`toggle-arrow ${showSaved ? 'up' : 'down'}`}>
                        {showSaved ? '▲' : '▼'}
                      </span>
                    </div>
                    
                    {showSaved && (
                      <div className="saved-list">
                        <div className="saved-header">
                          <span>Avvalgi kirishlar</span>
                          <button 
                            type="button" 
                            className="clear-btn"
                            onClick={clearSavedUsers}
                            title="Barchasini o'chirish"
                          >
                            <FiX /> Tozalash
                          </button>
                        </div>
                        <div className="saved-items">
                          {savedUsers.map((user) => (
                            <div 
                              key={user.id} 
                              className="saved-item"
                              onClick={() => handleSavedUserClick(user)}
                              title={`${user.name} bilan kirish`}
                            >
                              <div 
                                className="user-avatar"
                                style={{ backgroundColor: user.avatarColor || '#4CAF50' }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="saved-info">
                                <div className="saved-name">{user.name}</div>
                                <div className="saved-detail">
                                  {user.email || user.phone}
                                </div>
                                <div className="saved-time">
                                  {new Date(user.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="remove-btn"
                                onClick={(e) => removeSavedUser(user.id, e)}
                                title="O'chirish"
                              >
                                <FiX />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="auth-method-selector">
                  <div className="method-buttons">
                    <button
                      type="button"
                      className={`method-btn ${authMethod === 'email' ? 'active' : ''}`}
                      onClick={() => setAuthMethod('email')}
                    >
                      <FiMail className="method-icon" />
                      Email
                    </button>
                    <button
                      type="button"
                      className={`method-btn ${authMethod === 'phone' ? 'active' : ''}`}
                      onClick={() => setAuthMethod('phone')}
                    >
                      <FiPhone className="method-icon" />
                      Telefon
                    </button>
                  </div>
                </div>

                {authMethod === 'email' ? (
                  <>
                    <div className="input-group">
                      <FiMail className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="input-group password-group">
                      <FiLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Parol"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="input-group">
                      <FiPhone className="input-icon" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="+998 XX XXX XX XX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        autoComplete="tel"
                      />
                      <button
                        type="button"
                        className="test-numbers-btn"
                        onClick={() => setShowTestNumbers(!showTestNumbers)}
                      >
                        Test raqamlar
                      </button>
                      
                      {showTestNumbers && (
                        <div className="test-numbers-dropdown">
                          {TEST_PHONES.map((test, index) => (
                            <div
                              key={index}
                              className="test-number-item"
                              onClick={() => handleTestNumberClick(test.number)}
                            >
                              <span className="test-number">{test.number}</span>
                              <span className="test-name">{test.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="input-group">
                      <FiMail className="input-icon" />
                      <input
                        type="text"
                        name="telegramChatId"
                        placeholder="Telegram Chat ID"
                        value={formData.telegramChatId}
                        onChange={handleInputChange}
                        required
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}

                <div className="login-options">
                  <div className="options-left">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="checkmark"></span>
                      <span className="checkbox-label">Meni eslab qol</span>
                    </label>
                  </div>
                  
                  <div className="options-right">
                    {authMethod === 'email' && (
                      <button 
                        type="button" 
                        className="forgot-btn"
                        onClick={() => {
                          setModalContent({
                            title: 'Parolni tiklash',
                            message: 'Parolni tiklash uchun iltimos, administrator bilan bog\'laning:\n📞 +998 90 123 45 67\n✉️ support@sdkdental.uz',
                            type: 'info'
                          });
                          setShowModal(true);
                        }}
                      >
                        Parolni unutdingizmi?
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`submit-btn login-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner"></div>
                      Kirilmoqda...
                    </>
                  ) : (
                    <>
                      <FaTooth className="btn-icon" />
                      Tizimga kirish
                    </>
                  )}
                </button>

                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => handleTestNumberClick(TEST_PHONES[0].number)}
                  >
                    Test rejimida kirish
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn outline"
                    onClick={() => navigate('/admin/login')}
                  >
                    Admin paneli
                  </button>
                </div>

                <div className="switch-mode">
                  <p>
                    Hisobingiz yo'qmi?{' '}
                    <button
                      type="button"
                      className="switch-btn"
                      onClick={() => handleTabChange('register')}
                    >
                      Ro'yxatdan o'tish
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <FaShieldAlt className="security-icon" />
          <p>Barcha ma'lumotlaringiz SSL shifrlash orqali himoyalangan</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className={`modal-title ${modalContent.type}`}>
                {modalContent.type === 'success' ? '✅ ' : 'ℹ️ '}
                {modalContent.title}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p>{modalContent.message}</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn primary" onClick={closeModal}>
                Tushunarli
              </button>
              {modalContent.type === 'info' && (
                <button 
                  className="modal-btn secondary"
                  onClick={() => {
                    navigator.clipboard.writeText('+998901234567');
                    setSuccess('Raqam nusxalandi!');
                    closeModal();
                  }}
                >
                  Raqamni nusxalash
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="login-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/about">Loyiha haqida</a>
            <a href="/contact">Bog'lanish</a>
            <a href="/privacy">Maxfiylik</a>
            <a href="/terms">Foydalanish shartlari</a>
          </div>
          <p className="copyright">© 2024 SDK DENTAL. Barcha huquqlar himoyalangan.</p>
          <p className="contact-info">
            📞 Qo'llab-quvvatlash: <a href="tel:+998901234567">+998 90 123 45 67</a> | 
            ✉️ Email: <a href="mailto:info@sdkdental.uz">info@sdkdental.uz</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;