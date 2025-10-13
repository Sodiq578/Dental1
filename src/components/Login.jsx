import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiX, FiMail, FiShield, FiKey, FiPhone, FiEye, FiEyeOff, FiArrowLeft } from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import { AppContext } from "../App";
import { logLogin, getFromLocalStorage, saveToLocalStorage, savePendingAdminRequest, sendTelegramMessage } from "../utils";
import "./Login.css";

const Login = ({ onLogin, onOpenTokenLogin }) => {
  const [authMethod, setAuthMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isAdminRequestMode, setIsAdminRequestMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [tempUser, setTempUser] = useState(null);
  const [timer, setTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({});
  const [showTokenLogin, setShowTokenLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPhoneLogin, setShowAdminPhoneLogin] = useState(false);
  const [autoVerify, setAutoVerify] = useState(true);
  const [token, setToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const navigate = useNavigate();
  const { users, setUsers, setLogins, staff } = useContext(AppContext);
  const otpInputRefs = useRef([]);

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

  // OTP yuborish funksiyasi
  const sendOtp = async (phoneNumber, chatId, isAdmin = false) => {
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpData = {
        phone: phoneNumber,
        otp: generatedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      const currentOtps = getFromLocalStorage('otpCodes', []);
      const filteredOtps = currentOtps.filter(o => o.phone !== phoneNumber);
      filteredOtps.push(otpData);
      saveToLocalStorage('otpCodes', filteredOtps);

      const message = isAdmin
        ? `🦷 KEKSRI Admin Login OTP\n\nYour verification code is: ${generatedOtp}\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.`
        : `🦷 KEKSRI Tizimiga kirish kodi\n\nSizning tasdiqlash kodingiz: ${generatedOtp}\nBu kod 10 daqiqa amal qiladi.\n\nHech kimga bu kodni bermang.`;

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

  // OTP tekshirish funksiyasi
  const verifyOtp = (phoneNumber, enteredOtp) => {
    try {
      const currentOtps = getFromLocalStorage('otpCodes', []);
      const otpData = currentOtps.find(o => o.phone === phoneNumber && o.otp === enteredOtp);

      if (!otpData) {
        // Test mode fallback: accept any 4-digit code
        return /^\d{4}$/.test(enteredOtp);
      }

      const now = new Date();
      const expiresAt = new Date(otpData.expiresAt);

      if (now > expiresAt) {
        const filteredOtps = currentOtps.filter(o => o.phone !== phoneNumber);
        saveToLocalStorage('otpCodes', filteredOtps);
        return false;
      }

      const filteredOtps = currentOtps.filter(o => o.phone !== phoneNumber);
      saveToLocalStorage('otpCodes', filteredOtps);
      return true;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return /^\d{4}$/.test(enteredOtp); // Test mode fallback
    }
  };

  const handleResendOtp = async () => {
    if (canResend) {
      setIsLoading(true);
      setTimer(120);
      setCanResend(false);
      setError("");
      setOtp("");
      setOtpDigits(['', '', '', '']);

      try {
        let success = false;
        if (showAdminPhoneLogin || role === "staff") {
          const user = role === "staff" ? staff.find(s => s.phone === phone) : users.find(u => u.phone === phone);
          if (user && user.telegram) {
            success = await sendOtp(phone, user.telegram, showAdminPhoneLogin);
          } else {
            setError("Foydalanuvchi uchun Telegram chat ID topilmadi");
          }
        } else if (authMethod === "phone") {
          const user = users.find(u => u.phone === phone);
          if (user && user.telegram) {
            success = await sendOtp(phone, user.telegram);
          } else {
            setError("Foydalanuvchi uchun Telegram chat ID topilmadi");
          }
        }

        if (success) {
          setError("");
        } else {
          setError("OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        }
      } catch (error) {
        setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      } finally {
        setIsLoading(false);
      }
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
      setTimeout(() => {
        if (showAdminPhoneLogin || role === "staff") {
          handleAdminPhoneOtpVerify(fullOtp);
        } else {
          handleAutoVerify(fullOtp);
        }
      }, 500);
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
      if (index < 4) {
        newOtpDigits[index] = num;
      }
    });

    setOtpDigits(newOtpDigits);
    setOtp(numbers);

    const lastFilledIndex = Math.min(numbers.length - 1, 3);
    if (otpInputRefs.current[lastFilledIndex]) {
      otpInputRefs.current[lastFilledIndex].focus();
    }

    if (numbers.length === 4 && autoVerify) {
      setTimeout(() => {
        if (showAdminPhoneLogin || role === "staff") {
          handleAdminPhoneOtpVerify(numbers);
        } else {
          handleAutoVerify(numbers);
        }
      }, 500);
    }
  };

  const handleAutoVerify = async (otpCode) => {
    setIsLoading(true);

    try {
      let isValid = false;

      if (authMethod === "phone") {
        isValid = verifyOtp(phone, otpCode);
      } else {
        isValid = /^\d{4}$/.test(otpCode); // Test mode for email
      }

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
            },
          ];
          saveToLocalStorage('logins', newLogins);
          return newLogins;
        });

        setModalContent({
          title: isRegisterMode ? "Muvaffaqiyatli ro'yxatdan o'tish" : "Muvaffaqiyatli kirish",
          message: "Tizimga muvaffaqiyatli kirdingiz!",
        });
        setShowModal(true);

        setTimeout(() => {
          if (tempUser.role === "patient") {
            navigate("/foydalanuvchi");
          } else {
            navigate("/");
          }
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

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const admins = getFromLocalStorage('admins', []);
    const admin = admins.find(a => a.email === email && a.password === password);

    if (admin) {
      const adminUser = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: "admin",
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
          },
        ];
        saveToLocalStorage('logins', newLogins);
        return newLogins;
      });
      setModalContent({
        title: "Admin sifatida kirish",
        message: "Administrator paneliga xush kelibsiz!",
      });
      setShowModal(true);
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } else {
      setError("Noto'g'ri admin email yoki parol");
    }
    setIsLoading(false);
  };

  const handleAdminPhoneLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!phone || !/^\+998\d{9}$/.test(phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    if (!telegramChatId || !/^\d+$/.test(telegramChatId)) {
      setError("Telegram Chat ID faqat raqamlardan iborat bo'lishi kerak");
      setIsLoading(false);
      return;
    }

    const staffMember = staff.find(s => s.phone === phone);
    const admins = getFromLocalStorage('admins', []);
    const admin = admins.find(a => a.phone === phone);

    if (!staffMember && !admin) {
      setError("Bu telefon raqami bilan foydalanuvchi topilmadi");
      setIsLoading(false);
      return;
    }

    const user = staffMember || admin;
    const role = staffMember ? "staff" : "admin";

    try {
      const success = await sendOtp(phone, telegramChatId, role === "admin");
      if (success) {
        setTempUser({
          id: user.id,
          name: user.name,
          email: user.email || "",
          phone: user.phone,
          role: role,
          permissions: role === "admin" ? {
            patients: true,
            appointments: true,
            medications: true,
            billing: true,
            inventory: true,
            reports: true,
            admin: true,
          } : {
            patients: true,
            appointments: true,
            medications: true,
            billing: false,
            inventory: true,
            reports: false,
            admin: false,
          },
          branchId: user.branchId || null,
          loginMethod: 'phone_otp',
        });

        setIsOtpMode(true);
        setTimer(120);
        setCanResend(false);
        setError("");
      } else {
        setError("OTP yuborishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPhoneOtpVerify = async (otpCode) => {
    setIsLoading(true);
    setError("");

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
          title: tempUser.role === "admin" ? "Admin sifatida kirish" : "Xodim sifatida kirish",
          message: tempUser.role === "admin" ? "Administrator paneliga xush kelibsiz!" : "Xodim sifatida tizimga kirdingiz!",
        });
        setShowModal(true);

        setTimeout(() => {
          navigate(tempUser.role === "admin" ? "/admin" : "/");
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

  const handleTokenLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!token?.trim()) {
      setError("Token kiritilishi shart");
      setIsLoading(false);
      return;
    }

    const admins = getFromLocalStorage('admins', []);
    const staffMembers = getFromLocalStorage('staff', []);
    const patients = getFromLocalStorage('users', []).filter(u => u.role === "patient");

    const admin = admins.find(a => a.token === token && a.tokenExpiry && new Date() < new Date(a.tokenExpiry));
    const staffMember = staffMembers.find(s => s.token === token && s.tokenExpiry && new Date() < new Date(s.tokenExpiry));
    const patient = patients.find(p => p.token === token && p.tokenExpiry && new Date() < new Date(p.tokenExpiry));

    if (admin) {
      const adminUser = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: "admin",
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: true,
          inventory: true,
          reports: true,
          admin: true,
        },
        loginMethod: 'token',
      };

      onLogin(adminUser);
      logLogin(adminUser, 'token');
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
            loginMethod: 'token',
          },
        ];
        saveToLocalStorage('logins', newLogins);
        return newLogins;
      });
      setModalContent({
        title: "Admin sifatida kirish",
        message: "Administrator paneliga xush kelibsiz!",
      });
      setShowModal(true);
      setTimeout(() => {
        navigate("/admin");
        setIsLoading(false);
      }, 1500);
    } else if (staffMember) {
      const staffUser = {
        id: staffMember.id,
        name: staffMember.name,
        email: staffMember.email || "",
        role: "staff",
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: false,
          inventory: true,
          reports: false,
          admin: false,
        },
        staffData: staffMember,
        loginMethod: 'token',
      };

      onLogin(staffUser);
      logLogin(staffUser, 'token');
      setLogins((prevLogins) => {
        const newLogins = [
          ...prevLogins,
          {
            id: Date.now(),
            userId: staffUser.id,
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
            timestamp: new Date().toISOString(),
            loginMethod: 'token',
          },
        ];
        saveToLocalStorage('logins', newLogins);
        return newLogins;
      });
      setModalContent({
        title: "Xodim sifatida kirish",
        message: "Xodim sifatida tizimga kirdingiz!",
      });
      setShowModal(true);
      setTimeout(() => {
        navigate("/");
        setIsLoading(false);
      }, 1500);
    } else if (patient) {
      const patientUser = {
        id: patient.id,
        name: patient.name,
        email: patient.email || "",
        phone: patient.phone || "",
        role: "patient",
        patientId: patient.patientId,
        permissions: {
          patients: false,
          appointments: true,
          medications: false,
          billing: false,
          inventory: false,
          reports: false,
          admin: false,
        },
        loginMethod: 'token',
      };

      onLogin(patientUser);
      logLogin(patientUser, 'token');
      setLogins((prevLogins) => {
        const newLogins = [
          ...prevLogins,
          {
            id: Date.now(),
            userId: patientUser.id,
            name: patientUser.name,
            email: patientUser.email,
            phone: patientUser.phone,
            role: patientUser.role,
            timestamp: new Date().toISOString(),
            loginMethod: 'token',
          },
        ];
        saveToLocalStorage('logins', newLogins);
        return newLogins;
      });
      setModalContent({
        title: "Mijoz sifatida kirish",
        message: "Shaxsiy kabinetingizga xush kelibsiz!",
      });
      setShowModal(true);
      setTimeout(() => {
        navigate("/foydalanuvchi");
        setIsLoading(false);
      }, 1500);
    } else {
      setError("Noto'g'ri yoki muddati o'tgan token");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const admins = getFromLocalStorage('admins', []);
    if (admins.find(a => a.email === email && a.password === password)) {
      handleAdminLogin(e);
      return;
    }

    if (authMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Noto'g'ri email formati");
      setIsLoading(false);
      return;
    }
    if (authMethod === "phone" && !/^\+998\d{9}$/.test(phone)) {
      setError("Telefon raqami +998XXXXXXXXX formatida bo'lishi kerak");
      setIsLoading(false);
      return;
    }
    if (authMethod === "email" && !password) {
      setError("Parol kiritilishi shart");
      setIsLoading(false);
      return;
    }

    try {
      if (isRegisterMode) {
        if (authMethod === "email" && users.find((u) => u.email === email)) {
          setError("Bu email allaqachon ro'yxatdan o'tgan");
          setIsLoading(false);
          return;
        }
        if (authMethod === "phone" && users.find((u) => u.phone === phone)) {
          setError("Bu telefon raqami allaqachon ro'yxatdan o'tgan");
          setIsLoading(false);
          return;
        }

        const newUser = {
          id: Date.now(),
          name,
          email: authMethod === "email" ? email : "",
          phone: authMethod === "phone" ? phone : "",
          password: authMethod === "email" ? password : "",
          role,
          patientId: role === "patient" ? Date.now() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setTempUser(newUser);

        if (authMethod === "phone") {
          const success = await sendOtp(phone, telegramChatId || "5838205785");
          if (success) {
            setIsOtpMode(true);
            setTimer(120);
            setCanResend(false);
          } else {
            setError("OTP yuborishda xatolik. Iltimos, qayta urinib ko'ring.");
          }
        } else {
          // Email registration: directly save user without OTP
          const updatedUsers = [...users, newUser];
          setUsers(updatedUsers);
          saveToLocalStorage('users', updatedUsers);
          onLogin(newUser);
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
              },
            ];
            saveToLocalStorage('logins', newLogins);
            return newLogins;
          });
          setModalContent({
            title: "Muvaffaqiyatli ro'yxatdan o'tish",
            message: "Tizimga muvaffaqiyatli kirdingiz!",
          });
          setShowModal(true);
          setTimeout(() => {
            navigate(role === "patient" ? "/foydalanuvchi" : "/");
          }, 1500);
        }
      } else {
        const user = users.find((u) =>
          (authMethod === "email"
            ? u.email === email && u.password === password
            : u.phone === phone) && u.role === role
        );

        if (user) {
          setTempUser(user);
          if (authMethod === "phone" && user.telegram) {
            const success = await sendOtp(phone, user.telegram);
            if (success) {
              setIsOtpMode(true);
              setTimer(120);
              setCanResend(false);
            } else {
              setError("OTP yuborishda xatolik. Iltimos, qayta urinib ko'ring.");
            }
          } else if (authMethod === "email") {
            // Email login: directly authenticate without OTP
            onLogin(user);
            logLogin(user);
            setLogins((prevLogins) => {
              const newLogins = [
                ...prevLogins,
                {
                  id: Date.now(),
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  role: user.role,
                  timestamp: new Date().toISOString(),
                },
              ];
              saveToLocalStorage('logins', newLogins);
              return newLogins;
            });
            setModalContent({
              title: "Muvaffaqiyatli kirish",
              message: "Tizimga muvaffaqiyatli kirdingiz!",
            });
            setShowModal(true);
            setTimeout(() => {
              navigate(user.role === "patient" ? "/foydalanuvchi" : "/");
            }, 1500);
          } else {
            setError("Telegram Chat ID topilmadi. Iltimos, administrator bilan bog'laning.");
          }
        } else {
          setError(
            authMethod === "email"
              ? "Noto'g'ri email yoki parol."
              : "Bu telefon raqami ro'yxatdan o'tmagan."
          );
        }
      }
    } catch (error) {
      setError("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    handleAutoVerify(otp);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError("");
    setEmail("");
    setPhone("");
    setPassword("");
    setName("");
    setRole("patient");
    setIsOtpMode(false);
    setOtp("");
    setOtpDigits(['', '', '', '']);
    setTimer(120);
    setCanResend(false);
    setShowPassword(false);
    setShowTokenLogin(false);
    setShowAdminLogin(false);
    setShowAdminPhoneLogin(false);
    setToken("");
    setTelegramChatId("");
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleAdminRequest = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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

    const adminRequest = {
      id: Date.now(),
      name,
      email,
      phone,
      password,
      role: "admin",
      status: "pending",
      createdAt: new Date().toISOString(),
      telegram: telegramChatId,
    };

    savePendingAdminRequest(adminRequest);
    setModalContent({
      title: "Admin so'rovi yuborildi",
      message: "Sizning admin sifatida ro'yxatdan o'tish so'rovingiz super admin tomonidan ko'rib chiqiladi.",
    });
    setShowModal(true);
    setIsLoading(false);
    setTimeout(() => {
      setIsAdminRequestMode(false);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setTelegramChatId("");
      setShowModal(false);
    }, 2000);
  };

  return (
    <div className="login-page">
      <div className="dental-bg-pattern"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <FiShield className="logo-icon" />
              <span>DentCare</span>
            </div>
            <h2 className="login-title">
              {showTokenLogin ? "Token orqali kirish" : 
               showAdminLogin ? "Admin kirishi" :
               showAdminPhoneLogin ? "Admin telefon orqali kirish" :
               isAdminRequestMode ? "Admin sifatida ro'yxatdan o'tish" :
               isRegisterMode ? "Ro'yxatdan o'tish" : "Tizimga kirish"}
            </h2>
            <p className="login-subtitle">
              {showTokenLogin ? "Xodim yoki admin sifatida tizimga kirish" :
               showAdminLogin ? "Administrator paneliga kirish" :
               showAdminPhoneLogin ? "Telefon orqali admin sifatida kirish" :
               isAdminRequestMode ? "Admin sifatida ro'yxatdan o'ting" :
               isRegisterMode ? "Yangi hisob yarating" : "Hisobingizga kiring"}
            </p>
          </div>

          {error && (
            <div className="alert-error">
              <div className="alert-icon">!</div>
              <span>{error}</span>
            </div>
          )}

          {showAdminLogin ? (
            <div className="admin-login-section">
              <div className="admin-info-card">
                <FaCrown className="admin-icon" />
                <h3>Admin Panel</h3>
                <p>Administrator sifatida tizimga kirish</p>
              </div>

              <form onSubmit={handleAdminLogin} className="login-form">
                <div className={`input-group ${isFocused.adminEmail ? 'focused' : ''}`}>
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    placeholder="Admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus('adminEmail')}
                    onBlur={() => handleBlur('adminEmail')}
                    className="input-field"
                    required
                    autoComplete="username"
                  />
                </div>

                <div className={`input-group ${isFocused.adminPassword ? 'focused' : ''}`}>
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Admin parol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleFocus('adminPassword')}
                    onBlur={() => handleBlur('adminPassword')}
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

                <button 
                  type="submit" 
                  className={`submit-button admin-submit ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Kirilmoqda...
                    </>
                  ) : (
                    <>
                      <FaCrown /> Admin sifatida kirish
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="back-to-login"
                  onClick={() => setShowAdminLogin(false)}
                >
                  <FiArrowLeft /> Oddiy kirishga qaytish
                </button>
              </form>
            </div>
          ) : showAdminPhoneLogin ? (
            <div className="admin-phone-login-section">
              <div className="admin-info-card">
                <FaCrown className="admin-icon" />
                <h3>Admin Telefon Kirishi</h3>
                <p>Telefon raqamingiz orqali OTP bilan tizimga kiring</p>
              </div>

              <form onSubmit={handleAdminPhoneLogin} className="login-form">
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
                  className={`submit-button admin-submit ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      OTP yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <FaCrown /> OTP yuborish
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="back-to-login"
                  onClick={() => setShowAdminPhoneLogin(false)}
                >
                  <FiArrowLeft /> Oddiy kirishga qaytish
                </button>
              </form>
            </div>
          ) : showTokenLogin ? (
            <div className="token-login-section">
              <div className="token-info-card">
                <FiKey className="token-icon" />
                <h3>Xodim, Mijoz yoki Admin kirishi</h3>
                <p>Token orqali tizimga kirish uchun quyidagi formani to'ldiring</p>
              </div>

              <form onSubmit={handleTokenLogin} className="login-form">
                <div className={`input-group ${isFocused.token ? 'focused' : ''}`}>
                  <FiShield className="input-icon" />
                  <input
                    type="text"
                    name="token"
                    placeholder="Token kodini kiriting"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    onFocus={() => handleFocus('token')}
                    onBlur={() => handleBlur('token')}
                    className="input-field token-input"
                    maxLength="12"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                <button 
                  type="submit" 
                  className={`submit-button token-submit ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Kirilmoqda...
                    </>
                  ) : (
                    <>
                      <FiKey /> Token orqali kirish
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="back-to-login"
                  onClick={() => setShowTokenLogin(false)}
                >
                  <FiArrowLeft /> Oddiy kirishga qaytish
                </button>
              </form>
            </div>
          ) : isAdminRequestMode ? (
            <form onSubmit={handleAdminRequest} className="login-form">
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

              <div className={`input-group ${isFocused.password ? 'focused' : ''}`}>
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
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
                onClick={() => setIsAdminRequestMode(false)}
              >
                <FiArrowLeft /> Oddiy kirishga qaytish
              </button>
            </form>
          ) : !isOtpMode ? (
            <form onSubmit={handleSubmit} className="login-form">
              {isRegisterMode && (
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
              )}

              <div className="selection-group">
                <label className="section-label">Autentifikatsiya usuli:</label>
                <div className="auth-method-selection">
                  <label className="auth-method-option">
                    <input
                      type="radio"
                      value="email"
                      checked={authMethod === "email"}
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
                      checked={authMethod === "phone"}
                      onChange={(e) => setAuthMethod(e.target.value)}
                    />
                    <span className="auth-method-custom"></span>
                    <FiPhone className="option-icon" />
                    Telefon
                  </label>
                </div>
              </div>

              <div className="selection-group">
                <label className="section-label">Hisob turi:</label>
                <div className="role-selection">
                  <label className="role-option">
                    <input
                      type="radio"
                      value="patient"
                      checked={role === "patient"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    <FiUser className="option-icon" />
                    Mijoz
                  </label>
                  <label className="role-option">
                    <input
                      type="radio"
                      value="staff"
                      checked={role === "staff"}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span className="radio-custom"></span>
                    <FiShield className="option-icon" />
                    Xodim
                  </label>
                </div>
              </div>

              {authMethod === "email" ? (
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
              ) : (
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
              )}

              {authMethod === "email" && (
                <div className={`input-group ${isFocused.password ? 'focused' : ''}`}>
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Parol"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleFocus('password')}
                    onBlur={() => handleBlur('password')}
                    className="input-field"
                    required
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
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
                    Yuklanmoqda...
                  </>
                ) : isRegisterMode ? (
                  "Ro'yxatdan o'tish"
                ) : (
                  "Kirish"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={showAdminPhoneLogin || role === "staff" ? handleAdminPhoneOtpVerify : handleOtpVerify} className="login-form">
              <div className="otp-info">
                <p className="otp-message">
                  {showAdminPhoneLogin || role === "staff"
                    ? "Telegram orqali yuborilgan 4 xonali kodni kiriting"
                    : authMethod === "email"
                      ? "Elektron pochtangizga yuborilgan 4 xonali kodni kiriting"
                      : "Telefon raqamingizga SMS orqali yuborilgan 4 xonali kodni kiriting"}
                </p>
                <p className="otp-hint" dangerouslySetInnerHTML={{ 
                  __html: showAdminPhoneLogin || role === "staff" 
                    ? "(Test rejimida: har qanday 4 raqamli kod)" 
                    : "(Test rejimida: <strong>1234</strong>)" 
                }} />

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
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
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
                  "Tasdiqlash"
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
                  <strong>Qo'llanma:</strong> Kodni bitta inputga yozishingiz yoki har bir raqamni alohida kiriting.
                  Kod to'liq kiritilganda avtomatik tekshiriladi.
                </p>
              </div>
            </form>
          )}

          {!isOtpMode && !showTokenLogin && !showAdminLogin && !showAdminPhoneLogin && !isAdminRequestMode && (
            <div className="login-footer">
              <p className="toggle-text">
                {isRegisterMode ? "Hisobingiz bormi?" : "Hisobingiz yo'qmi?"}
                <button type="button" onClick={toggleMode} className="toggle-button">
                  {isRegisterMode ? "Kirish" : "Ro'yxatdan o'tish"}
                </button>
              </p>

              {!isRegisterMode && (
                <div className="special-login-options">
                  <div className="separator">
                    <span>Yoki</span>
                  </div>
                  <div className="special-buttons">
                    <button 
                      type="button"
                      onClick={() => setShowTokenLogin(true)} 
                      className="btn-token-login"
                    >
                      <FiKey className="btn-icon" />
                      Token orqali kirish (Xodimlar, Mijozlar yoki Admin)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAdminLogin(true)} 
                      className="btn-admin-login"
                    >
                      <FaCrown className="btn-icon" />
                      Admin kirishi
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAdminPhoneLogin(true)} 
                      className="btn-admin-phone-login"
                    >
                      <FiPhone className="btn-icon" />
                      Admin/Xodim telefon orqali kirish
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAdminRequestMode(true)} 
                      className="btn-admin-request"
                    >
                      <FaCrown className="btn-icon" />
                      Admin sifatida ro'yxatdan o'tish
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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

export default Login;