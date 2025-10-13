// Telegram bot tokenini sozlash
let TELEGRAM_BOT_TOKEN = '8446018868:AAGMBw9ZFI2gDP3a_XA7qpVDX4_ar76IxlU';

// Brauzer muhitida tokenni localStorage'dan olish
if (typeof window !== 'undefined') {
  const savedToken = window.localStorage.getItem('telegramBotToken');
  if (savedToken) {
    TELEGRAM_BOT_TOKEN = savedToken;
  }
}

export const setTelegramBotToken = (token) => {
  if (!token) {
    console.warn('Telegram tokeni bo\'sh bo\'lishi mumkin emas');
    return;
  }
  TELEGRAM_BOT_TOKEN = token;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('telegramBotToken', token);
      console.log('Telegram tokeni saqlandi');
    }
  } catch (e) {
    console.warn('Telegram tokenini saqlashda xato:', e);
  }
};

// Telegram orqali xabar yuborish
export const sendTelegramMessage = async (chatId, message) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Telegram bot tokeni topilmadi');
    return false;
  }
  if (!chatId || !message) {
    console.error('Chat ID yoki xabar bo\'sh bo\'lishi mumkin emas');
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=HTML`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API xatosi:', data.description);
      return false;
    }
    console.log('Telegram xabari muvaffaqiyatli yuborildi:', chatId);
    return true;
  } catch (error) {
    console.error('Telegram xabarini yuborishda xato:', error);
    return false;
  }
};

// OTP yuborish funksiyasi
export const sendOtpToTelegram = async (phone, chatId, isAdmin = false) => {
  try {
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    const otpData = {
      phone,
      otp: generatedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isAdmin
    };

    const currentOtps = getFromLocalStorage('otpCodes', []);
    const filteredOtps = currentOtps.filter(o => o.phone !== phone);
    filteredOtps.push(otpData);
    saveToLocalStorage('otpCodes', filteredOtps);

    const message = isAdmin 
      ? `<b>🦷 KEKSRI Admin Login OTP</b>\n\nSizning tasdiqlash kodingiz: <code>${generatedOtp}</code>\nBu kod 10 daqiqa amal qiladi.\nIltimos, bu kodni hech kimga bermang.`
      : `<b>🦷 KEKSRI Tizimiga kirish kodi</b>\n\nSizning tasdiqlash kodingiz: <code>${generatedOtp}</code>\nBu kod 10 daqiqa amal qiladi.\nIltimos, bu kodni hech kimga bermang.`;

    const success = await sendTelegramMessage(chatId, message);
    if (success) {
      console.log(`OTP ${generatedOtp} ${phone} raqamiga yuborildi`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('OTP yuborishda xato:', error);
    return false;
  }
};

// OTP tekshirish funksiyasi
export const verifyOtpCode = (phone, enteredOtp) => {
  try {
    const currentOtps = getFromLocalStorage('otpCodes', []);
    const otpData = currentOtps.find(o => o.phone === phone && o.otp === enteredOtp);
    
    if (!otpData) {
      console.log('OTP topilmadi yoki noto\'g\'ri:', phone);
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(otpData.expiresAt);
    
    if (now > expiresAt) {
      console.log('OTP muddati tugagan:', phone);
      const filteredOtps = currentOtps.filter(o => o.phone !== phone);
      saveToLocalStorage('otpCodes', filteredOtps);
      return false;
    }

    const filteredOtps = currentOtps.filter(o => o.phone !== phone);
    saveToLocalStorage('otpCodes', filteredOtps);
    
    console.log('OTP muvaffaqiyatli tasdiqlandi:', phone);
    return true;
  } catch (error) {
    console.error('OTP tasdiqlashda xato:', error);
    return false;
  }
};

// Muddat o'tgan OTP'larni tozalash
export const cleanupExpiredOtps = () => {
  try {
    const currentOtps = getFromLocalStorage('otpCodes', []);
    const now = new Date();
    const validOtps = currentOtps.filter(otpData => new Date(otpData.expiresAt) >= now);
    
    if (validOtps.length !== currentOtps.length) {
      saveToLocalStorage('otpCodes', validOtps);
      console.log(`Tozalandi: ${currentOtps.length - validOtps.length} ta muddati o'tgan OTP`);
    }
    
    return validOtps;
  } catch (error) {
    console.error('Muddat o\'tgan OTP\'larni tozalashda xato:', error);
    return [];
  }
};

// Tish holatini normallashtirish
export const normalizeToothStatus = (status) => {
  if (!status && status !== 0) return '';
  let s = String(status).toLowerCase().trim();
  s = s.replace(/[''ʼ`ʻ]/g, "'");
  s = s.replace(/yo[''ʼ`ʻ]q/g, 'yoq');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
};

// Tish holatiga rang moslash
export const getToothStatusColor = (status) => {
  const s = normalizeToothStatus(status);
  const colors = {
    'sog': '#4CAF50',
    'karies': '#FF9800',
    'plomba': '#2196F3',
    'koronka': '#9C27B0',
    'protez': '#607D8B',
    'yoq': '#F44336',
    'davl': '#FFC107',
    'sog\'liq': '#4CAF50',
    'karis': '#FF9800',
    'plomb': '#2196F3'
  };
  return colors[s] || '#CCCCCC';
};

// Bemor ma'lumotlarini tozalash
export const sanitizePatientData = (patient) => {
  const toothChart = Array.isArray(patient?.toothChart)
    ? patient.toothChart.map(tc => {
        const status = normalizeToothStatus(tc?.status || '');
        return {
          ...tc,
          status,
          color: tc?.color || getToothStatusColor(status)
        };
      })
    : [];

  return {
    ...patient,
    name: patient?.name ? String(patient.name).trim() : '',
    phone: patient?.phone ? String(patient.phone).trim() : '',
    address: patient?.address ? String(patient.address).trim() : '',
    note: patient?.note ? String(patient.note).trim() : '',
    gender: patient?.gender || '',
    dob: patient?.dob || '',
    telegram: patient?.telegram ? String(patient.telegram).trim() : '',
    lastVisit: patient?.lastVisit || '',
    prescriptions: Array.isArray(patient?.prescriptions) ? patient.prescriptions : [],
    toothChart,
    createdAt: patient?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// LocalStorage yordamchi funksiyalari
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`localStorage'dan o'qishda xato (${key}):`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`localStorage'ga saqlashda xato (${key}):`, error);
  }
};

// Admin so'rovlarini saqlash
export const savePendingAdminRequest = (requestData, callback) => {
  try {
    const errors = validateAdminRequestData(requestData);
    if (errors.length > 0) {
      if (typeof callback === 'function') {
        callback(false, errors.join(', '));
      }
      return;
    }

    const newId = Date.now();
    const sanitizedRequest = {
      ...requestData,
      id: newId,
      status: requestData.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentRequests = getFromLocalStorage('pendingAdminRequests', []);
    currentRequests.push(sanitizedRequest);
    saveToLocalStorage('pendingAdminRequests', currentRequests);

    console.log('Yangi admin so\'rovi saqlandi:', sanitizedRequest.email);
    if (typeof callback === 'function') {
      callback(true, 'Admin so\'rovi muvaffaqiyatli saqlandi', sanitizedRequest);
    }
  } catch (error) {
    console.error('Admin so\'rovini saqlashda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Admin so\'rovini saqlashda xato');
    }
  }
};

// Kutayotgan admin so'rovlarini olish
export const getPendingAdminRequests = () => {
  return getFromLocalStorage('pendingAdminRequests', []).filter(req => req.status === 'pending');
};

// Admin so'rovini yangilash
export const updatePendingAdminRequest = (requestId, updatedData, callback) => {
  try {
    const currentRequests = getFromLocalStorage('pendingAdminRequests', []);
    const existingIndex = currentRequests.findIndex(req => String(req.id) === String(requestId));
    if (existingIndex === -1) {
      if (typeof callback === 'function') {
        callback(false, 'Admin so\'rovi topilmadi');
      }
      return;
    }

    const existing = currentRequests[existingIndex];
    const merged = {
      ...existing,
      ...updatedData,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };

    const errors = validateAdminRequestData(merged);
    if (errors.length > 0) {
      if (typeof callback === 'function') {
        callback(false, errors.join(', '));
      }
      return;
    }

    currentRequests[existingIndex] = merged;
    saveToLocalStorage('pendingAdminRequests', currentRequests);
    console.log('Admin so\'rovi yangilandi:', requestId);
    if (typeof callback === 'function') {
      callback(true, 'Admin so\'rovi muvaffaqiyatli yangilandi', merged);
    }
  } catch (error) {
    console.error('Admin so\'rovini yangilashda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Admin so\'rovini yangilashda xato');
    }
  }
};

// Admin so'rov ma'lumotlarini tekshirish
export const validateAdminRequestData = (request) => {
  const errors = [];
  if (!request?.email || !validateEmail(request.email)) {
    errors.push('Haqiqiy email talab qilinadi');
  }
  if (!request?.name || String(request.name).trim().length < 2) {
    errors.push('Ism kamida 2 harfdan iborat bo\'lishi kerak');
  }
  if (!request?.phone || !validatePhone(request.phone)) {
    errors.push('Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak');
  }
  if (!request?.telegram || !/^\d+$/.test(String(request.telegram))) {
    errors.push('Telegram Chat ID faqat raqamlardan iborat bo\'lishi kerak');
  }
  return errors;
};

// Validatsiya yordamchilari
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email || ''));
};

export const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

export const validatePhone = (phone) => {
  return /^\+998\d{9}$/.test(String(phone || ''));
};

// Bemor ma'lumotlarini validatsiya qilish
export const validatePatientData = (patient) => {
  const errors = [];
  if (!patient?.name || String(patient.name).trim().length < 2) {
    errors.push('Ism kamida 2 harfdan iborat bo\'lishi kerak');
  }
  if (!patient?.phone || !validatePhone(patient.phone)) {
    errors.push('Telefon raqami +998XXXXXXXXX formatida bo\'lishi kerak');
  }
  if (patient?.dob) {
    const birthDate = new Date(patient.dob);
    if (birthDate > new Date()) {
      errors.push('Tug\'ilgan sana kelajakda bo\'lishi mumkin emas');
    }
  }
  if (patient?.telegram && !/^\d+$/.test(String(patient.telegram))) {
    errors.push('Telegram Chat ID faqat raqamlardan iborat bo\'lishi kerak');
  }
  return errors;
};

export const validateStoredPatients = (patients) => {
  try {
    if (!Array.isArray(patients)) {
      console.error('Bemorlar ma\'lumotlari massiv emas!');
      return [];
    }
    return patients
      .filter(patient =>
        patient &&
        typeof patient === 'object' &&
        (patient.id !== undefined && patient.id !== null) &&
        patient.name &&
        typeof patient.name === 'string' &&
        validatePhone(patient.phone)
      )
      .map(patient => sanitizePatientData(patient));
  } catch (error) {
    console.error('Bemorlar ma\'lumotlarini tekshirishda xato:', error);
    return [];
  }
};

// Boshlang'ich ma'lumotlar
export const initializeData = () => {
  console.log('🦷 Keksri Dental - Ma\'lumotlarni boshlash...');

  const keksriInitialData = {
    patients: [
      {
        id: 1,
        name: 'Ali Valiev',
        phone: '+998901234567',
        gender: 'Erkak',
        address: 'Toshkent shahri, Yunusobod tumani',
        dob: '1990-05-15',
        telegram: '123456789',
        note: 'Qandli diabet kasalligi bor, mahalliy behushlikka sezgir',
        prescriptions: [
          {
            id: 1,
            date: '2024-01-15',
            medication: 'Amoxicillin 500mg',
            dosage: '1 tabletka, kuniga 3 marta, 7 kun',
            notes: 'Infeksiyadan himoyalanish'
          }
        ],
        lastVisit: '2024-01-15',
        toothChart: [
          { tooth: 16, status: 'plomba', color: '#2196F3' },
          { tooth: 36, status: 'karies', color: '#FF9800' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // ... boshqa bemorlar (oldingi kodda bor)
    ],
    appointments: [
      {
        id: 1,
        patientId: 1,
        patientName: 'Ali Valiev',
        date: '2024-09-01',
        time: '10:00',
        procedure: 'Tish tozalash',
        status: 'yakunlandi',
        notes: 'Yaxshi holat, 6 oydan keyin tekshiruv',
        prescription: 'Tish pastasi va ip tavsiya qilindi',
        duration: '45',
        doctor: 'Dr. Aziza',
        cost: '150000',
        nextVisit: '2025-03-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // ... boshqa uchrashuvlar
    ],
    medications: [
      {
        id: 1,
        name: 'Amoxicillin 500mg',
        type: 'antibiotik',
        dosage: '500mg',
        form: 'tabletka',
        stock: 150,
        price: 2500,
        description: 'Keng spektrli antibiotik',
        sideEffects: 'Ko\'ngil aynishi, allergiya',
        contraindications: 'Penitsillin allergiyasi'
      },
      // ... boshqa dori vositalari
    ],
    users: [
      {
        id: 1,
        name: 'Keksri Admin',
        email: 'admin@keksri.uz',
        password: 'keksri123',
        role: 'admin',
        phone: '+998901112233',
        specialty: 'Bosh stomatolog',
        bio: '15 yillik tajriba, implantologiya mutaxassisi',
        createdAt: new Date().toISOString()
      },
      // ... boshqa foydalanuvchilar
    ],
    billings: [
      {
        id: 1,
        patientId: 1,
        patientName: 'Ali Valiev',
        date: '2024-09-01',
        services: [
          { name: 'Tish tozalash', cost: 150000 },
          { name: 'Maslahat', cost: 50000 }
        ],
        total: 200000,
        paid: 200000,
        status: 'to\'langan',
        paymentMethod: 'naqd',
        notes: 'To\'liq to\'langan'
      },
      // ... boshqa hisob-kitoblar
    ],
    inventory: [
      {
        id: 1,
        name: "Colgate tish pastasi",
        category: "gigiyena",
        stock: 45,
        minStock: 10,
        price: 15000,
        supplier: "Medtex Group"
      },
      // ... boshqa inventar
    ],
    staff: [
      {
        id: 1,
        name: 'Dilobar',
        email: 'dilobar@keksri.uz',
        role: 'nurse',
        phone: '+998904445566',
        salary: '4000000',
        branchId: 1,
        joinDate: '2023-01-15',
        status: 'faol',
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: true,
          inventory: true,
          reports: false
        }
      },
      {
        id: 2,
        name: 'Farid',
        email: 'farid@keksri.uz',
        role: 'admin',
        phone: '+998905556677',
        salary: '3500000',
        branchId: 1,
        joinDate: '2023-03-20',
        status: 'faol',
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: true,
          inventory: true,
          reports: true
        }
      },
      {
        id: 3,
        name: 'Zarina',
        email: 'zarina@keksri.uz',
        role: 'nurse',
        phone: '+998906667788',
        salary: '3800000',
        branchId: 2,
        joinDate: '2023-06-10',
        status: 'faol',
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: false,
          inventory: true,
          reports: false
        }
      },
      {
        id: 4,
        name: 'Dr. Aziza',
        email: 'aziza@keksri.uz',
        role: 'doctor',
        phone: '+998902223344',
        salary: '6000000',
        branchId: 3,
        joinDate: '2022-11-01',
        status: 'faol',
        permissions: {
          patients: true,
          appointments: true,
          medications: true,
          billing: true,
          inventory: false,
          reports: true
        }
      }
    ],
    admins: [
      {
        id: 1,
        name: 'Keksri Admin',
        email: 'admin@keksri.uz',
        password: 'keksri123',
        phone: '+998901112233',
        token: 'ABC1234567',
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isAdminToken: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        telegram: '123456789'
      }
    ],
    pendingAdminRequests: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@keksri.uz',
        phone: '+998901234568',
        role: 'xodim',
        status: 'kutilmoqda',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        telegram: '987654321'
      }
    ],
    logins: [
      {
        id: 1,
        userId: 1,
        name: 'Keksri Admin',
        email: 'admin@keksri.uz',
        phone: '+998901112233',
        role: 'admin',
        loginMethod: 'email',
        timestamp: '2025-10-04T10:00:00.000Z'
      }
    ],
    sidebarOpen: false,
    darkMode: false,
    fontSize: 16,
    layout: 'normal',
    keksri_initialized: true
  };

  Object.keys(keksriInitialData).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(keksriInitialData[key]));
      console.log(`✅ ${key} ma'lumotlari boshlandi`);
    }
  });
};

// Bemor qo'shish
export const addNewPatient = (patientData, callback) => {
  try {
    const errors = validatePatientData(patientData);
    if (errors.length > 0) {
      if (typeof callback === 'function') {
        callback(false, errors.join(', '));
      }
      return;
    }

    const newId = Date.now();
    const sanitizedPatient = sanitizePatientData({
      ...patientData,
      id: newId,
      prescriptions: patientData.prescriptions || [],
      toothChart: patientData.toothChart || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const currentPatients = getFromLocalStorage('patients', []);
    currentPatients.push(sanitizedPatient);
    saveToLocalStorage('patients', currentPatients);

    console.log('Yangi bemor qo\'shildi:', sanitizedPatient.name);
    if (typeof callback === 'function') {
      callback(true, 'Bemor muvaffaqiyatli qo\'shildi', sanitizedPatient);
    }
  } catch (error) {
    console.error('Bemor qo\'shishda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Bemor qo\'shishda xato');
    }
  }
};

// Bemor yangilash
export const updatePatient = (patientId, updatedData, callback) => {
  try {
    const currentPatients = getFromLocalStorage('patients', []);
    const existingIndex = currentPatients.findIndex(p => String(p.id) === String(patientId));
    if (existingIndex === -1) {
      if (typeof callback === 'function') {
        callback(false, 'Bemor topilmadi');
      }
      return;
    }

    const existing = currentPatients[existingIndex];
    const merged = {
      ...existing,
      ...updatedData,
      id: existing.id,
      prescriptions: updatedData.prescriptions !== undefined ? updatedData.prescriptions : existing.prescriptions,
      toothChart: updatedData.toothChart !== undefined ? updatedData.toothChart : existing.toothChart,
      updatedAt: new Date().toISOString()
    };

    const errors = validatePatientData(merged);
    if (errors.length > 0) {
      if (typeof callback === 'function') {
        callback(false, errors.join(', '));
      }
      return;
    }

    const sanitizedData = sanitizePatientData(merged);
    currentPatients[existingIndex] = sanitizedData;

    saveToLocalStorage('patients', currentPatients);
    console.log('Bemor ma\'lumotlari yangilandi:', patientId);
    if (typeof callback === 'function') {
      callback(true, 'Bemor ma\'lumotlari muvaffaqiyatli yangilandi', sanitizedData);
    }
  } catch (error) {
    console.error('Bemor ma\'lumotlarini yangilashda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Bemor ma\'lumotlarini yangilashda xato');
    }
  }
};

// Uchrashuvni bekor qilish
export const cancelAppointment = (appointmentId, callback) => {
  try {
    const appointments = getFromLocalStorage('appointments', []);
    const appointment = appointments.find(app => String(app.id) === String(appointmentId));

    if (!appointment) {
      if (typeof callback === 'function') {
        callback(false, 'Uchrashuv topilmadi');
      }
      return;
    }

    const updatedAppointments = appointments.map(app =>
      String(app.id) === String(appointmentId)
        ? { ...app, status: 'bekor qilingan', updatedAt: new Date().toISOString() }
        : app
    );

    saveToLocalStorage('appointments', updatedAppointments);

    const patients = getFromLocalStorage('patients', []);
    const patient = patients.find(p => String(p.id) === String(appointment.patientId));
    if (patient && patient.telegram) {
      const message = `<b>🦷 KEKSRI: Uchrashuv bekor qilindi</b>\nBemor: ${patient.name}\nSana: ${appointment.date} ${appointment.time}\nProtsedura: ${appointment.procedure}`;
      sendTelegramMessage(patient.telegram, message);
    }

    console.log('Uchrashuv bekor qilindi:', appointmentId);
    if (typeof callback === 'function') {
      callback(true, 'Uchrashuv muvaffaqiyatli bekor qilindi');
    }
  } catch (error) {
    console.error('Uchrashuvni bekor qilishda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Uchrashuvni bekor qilishda xato');
    }
  }
};

// Tish diagrammasi generatsiyasi
export const generateToothChart = () => {
  const teeth = [];
  // Upper right (1-8)
  for (let i = 1; i <= 8; i++) teeth.push({ number: i, quadrant: 1 });
  // Upper left (9-16)
  for (let i = 9; i <= 16; i++) teeth.push({ number: i, quadrant: 2 });
  // Lower left (17-24)
  for (let i = 17; i <= 24; i++) teeth.push({ number: i, quadrant: 3 });
  // Lower right (25-32)
  for (let i = 25; i <= 32; i++) teeth.push({ number: i, quadrant: 4 });
  return teeth;
};

// Ma'lumotlarni eksport qilish
export const exportPatientsData = () => {
  try {
    const patients = getFromLocalStorage('patients', []);
    const blob = new Blob([JSON.stringify(patients, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keksri_patients_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ Bemorlar ma\'lumotlari eksport qilindi');
    return true;
  } catch (e) {
    console.error('Bemorlar ma\'lumotlarini eksport qilishda xato:', e);
    alert('Bemorlar ma\'lumotlarini eksport qilishda xato');
    return false;
  }
};

export const exportAppointmentsData = () => {
  try {
    const appointments = getFromLocalStorage('appointments', []);
    const blob = new Blob([JSON.stringify(appointments, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keksri_appointments_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ Uchrashuvlar ma\'lumotlari eksport qilindi');
    return true;
  } catch (e) {
    console.error('Uchrashuvlar ma\'lumotlarini eksport qilishda xato:', e);
    alert('Uchrashuvlar ma\'lumotlarini eksport qilishda xato');
    return false;
  }
};

// Ma'lumotlarni import qilish
export const importPatientsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedPatients = JSON.parse(e.target.result);
      if (!Array.isArray(importedPatients)) {
        if (typeof callback === 'function') {
          callback(false, 'Noto\'g\'ri import fayl formati');
        }
        return;
      }

      const validatedPatients = importedPatients
        .filter(patient =>
          patient && patient.id && patient.name && patient.phone && validatePhone(patient.phone)
        )
        .map(patient => sanitizePatientData(patient));

      if (validatedPatients.length === 0) {
        if (typeof callback === 'function') {
          callback(false, 'Faylda haqiqiy bemor ma\'lumotlari topilmadi');
        }
        return;
      }

      const currentPatients = getFromLocalStorage('patients', []);
      const mergedPatients = [...currentPatients];

      validatedPatients.forEach(newPatient => {
        const existingIndex = mergedPatients.findIndex(p => String(p.id) === String(newPatient.id));
        if (existingIndex >= 0) {
          mergedPatients[existingIndex] = newPatient;
        } else {
          mergedPatients.push(newPatient);
        }
      });

      saveToLocalStorage('patients', mergedPatients);
      console.log(`✅ ${validatedPatients.length} bemor import qilindi`);
      if (typeof callback === 'function') {
        callback(true, `${validatedPatients.length} bemor muvaffaqiyatli import qilindi`);
      }
    } catch (err) {
      console.error('Bemorlar ma\'lumotlarini import qilishda xato:', err);
      if (typeof callback === 'function') {
        callback(false, 'Faylni o\'qishda xato. JSON formatini tekshiring.');
      }
    }
  };
  reader.readAsText(file);
};

export const importAppointmentsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedAppointments = JSON.parse(e.target.result);
      if (!Array.isArray(importedAppointments)) {
        if (typeof callback === 'function') {
          callback(false, 'Noto\'g\'ri import fayl formati');
        }
        return;
      }

      const validatedAppointments = importedAppointments
        .filter(app =>
          app && app.id && app.patientId && app.date && app.time && app.procedure && app.status
        )
        .map(app => ({
          ...app,
          createdAt: app.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      if (validatedAppointments.length === 0) {
        if (typeof callback === 'function') {
          callback(false, 'Faylda haqiqiy uchrashuv ma\'lumotlari topilmadi');
        }
        return;
      }

      const currentAppointments = getFromLocalStorage('appointments', []);
      const mergedAppointments = [...currentAppointments];

      validatedAppointments.forEach(newApp => {
        const existingIndex = mergedAppointments.findIndex(a => String(a.id) === String(newApp.id));
        if (existingIndex >= 0) {
          mergedAppointments[existingIndex] = newApp;
        } else {
          mergedAppointments.push(newApp);
        }
      });

      saveToLocalStorage('appointments', mergedAppointments);
      console.log(`✅ ${validatedAppointments.length} uchrashuv import qilindi`);
      if (typeof callback === 'function') {
        callback(true, `${validatedAppointments.length} uchrashuv muvaffaqiyatli import qilindi`);
      }
    } catch (err) {
      console.error('Uchrashuvlar ma\'lumotlarini import qilishda xato:', err);
      if (typeof callback === 'function') {
        callback(false, 'Faylni o\'qishda xato. JSON formatini tekshiring.');
      }
    }
  };
  reader.readAsText(file);
};

// Formatlash funksiyalari
export const formatKeksriDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
};

export const formatKeksriTime = (timeString) => {
  return timeString || '';
};

export const formatKeksriCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS'
  }).format(Number(amount) || 0);
};

// Qidiruv funksiyalari
export const searchPatients = (query, patients) => {
  if (!query) return patients;

  const lowerQuery = String(query).toLowerCase();
  return (patients || []).filter(patient =>
    (patient.name || '').toLowerCase().includes(lowerQuery) ||
    (patient.phone || '').includes(query) ||
    (patient.address || '').toLowerCase().includes(lowerQuery) ||
    ((patient.note || '').toLowerCase().includes(lowerQuery))
  );
};

// Statistika olish
export const getKeksriStats = () => {
  const patients = getFromLocalStorage('patients', []);
  const appointments = getFromLocalStorage('appointments', []);
  const billings = getFromLocalStorage('billings', []);

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = (appointments || []).filter(app => app.date === today);
  const pendingAppointments = (appointments || []).filter(app => app.status === 'pending');
  const totalRevenue = (billings || []).reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);

  return {
    totalPatients: (patients || []).length,
    todayAppointments: todayAppointments.length,
    pendingAppointments: pendingAppointments.length,
    totalRevenue
  };
};

// Login loglari
export const getLogins = () => {
  return getFromLocalStorage('logins', []);
};

export const filterLogins = (logins, { roleFilter, methodFilter, dateFilter, searchQuery }) => {
  let filtered = [...logins];

  if (roleFilter) {
    filtered = filtered.filter(login => login.role === roleFilter);
  }

  if (methodFilter) {
    filtered = filtered.filter(login => {
      const method = getLoginMethod(login);
      return method.toLowerCase() === methodFilter.toLowerCase();
    });
  }

  if (dateFilter) {
    const now = new Date();
    filtered = filtered.filter(login => {
      const loginDate = new Date(login.timestamp);
      if (dateFilter === 'today') {
        return loginDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return loginDate.toDateString() === yesterday.toDateString();
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return loginDate >= oneWeekAgo && loginDate <= now;
      }
      return true;
    });
  }

  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filtered = filtered.filter(login =>
      (login.name || '').toLowerCase().includes(lowerQuery) ||
      (login.email || '').toLowerCase().includes(lowerQuery) ||
      (login.phone || '').toLowerCase().includes(lowerQuery)
    );
  }

  return filtered;
};

export const sortLoginsByTimestamp = (logins, descending = true) => {
  return [...logins].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return descending ? dateB - dateA : dateA - dateB;
  });
};

export const getLoginMethod = (login) => {
  if (login.email === 'admin@keksri.uz') return 'Admin';
  if (login.loginMethod === 'token') return 'Token';
  if (login.phone && !login.email) return 'Phone';
  if (login.email && !login.phone) return 'Email';
  return 'Unknown';
};

export const logLogin = (user, loginMethod = 'email') => {
  try {
    const logins = getFromLocalStorage('logins', []);
    logins.push({
      id: Date.now(),
      userId: user?.id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      role: user?.role,
      loginMethod,
      timestamp: new Date().toISOString()
    });
    saveToLocalStorage('logins', logins);
    console.log('Kirish qayd etildi');
  } catch (error) {
    console.error('Kirishni qayd etishda xato:', error);
  }
};

export const clearLogins = () => {
  saveToLocalStorage('logins', []);
  console.log('Kirishlar tozalandi');
};

// Staff permissions funksiyalari
export const updateStaffPermissions = (staffId, permissions) => {
  try {
    const staff = getFromLocalStorage('staff', []);
    const updatedStaff = staff.map(member => {
      if (member.id === staffId) {
        return { ...member, permissions: { ...member.permissions, ...permissions } };
      }
      return member;
    });
    saveToLocalStorage('staff', updatedStaff);
    return true;
  } catch (error) {
    console.error('Staff permissions yangilashda xato:', error);
    return false;
  }
};

export const updateStaffBranch = (staffId, branchId) => {
  try {
    const staff = getFromLocalStorage('staff', []);
    const updatedStaff = staff.map(member => {
      if (member.id === staffId) {
        return { ...member, branchId };
      }
      return member;
    });
    saveToLocalStorage('staff', updatedStaff);
    return true;
  } catch (error) {
    console.error('Staff branch yangilashda xato:', error);
    return false;
  }
};

export const getStaffWithPermissions = () => {
  return getFromLocalStorage('staff', []);
};

export const hasStaffPermission = (staffMember, moduleId) => {
  return staffMember?.permissions?.[moduleId] || false;
};

export const getRoleColor = (role) => {
  const colors = {
    doctor: '#ef4444',
    nurse: '#10b981',
    admin: '#8b5cf6',
    staff: '#6b7280'
  };
  return colors[role] || '#6b7280';
};

export const getRoleName = (role) => {
  const names = {
    doctor: 'Shifokor',
    nurse: 'Hamshira',
    admin: 'Administrator',
    staff: 'Xodim'
  };
  return names[role] || 'Xodim';
};

console.log('🦷 Keksri Utils to\'liq yuklandi!');