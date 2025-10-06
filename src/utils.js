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
    console.warn('Telegram tokeni bo‘sh bo‘lishi mumkin emas');
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
    console.error('Chat ID yoki xabar bo‘sh bo‘lishi mumkin emas');
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

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
    // 4 raqamli OTP generatsiyasi
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    const otpData = {
      phone,
      otp: generatedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 daqiqa muddat
      createdAt: new Date().toISOString(),
      isAdmin
    };

    // Eski OTP'larni filtrlab, yangisini qo‘shish
    const currentOtps = getFromLocalStorage('otpCodes', []);
    const filteredOtps = currentOtps.filter(o => o.phone !== phone);
    filteredOtps.push(otpData);
    saveToLocalStorage('otpCodes', filteredOtps);

    // Xabar matnini tayyorlash
    const message = isAdmin 
      ? `🦷 KEKSRI Admin Login OTP\n\nSizning tasdiqlash kodingiz: ${generatedOtp}\nBu kod 10 daqiqa amal qiladi.\nIltimos, bu kodni hech kimga bermang.`
      : `🦷 KEKSRI Tizimiga kirish kodi\n\nSizning tasdiqlash kodingiz: ${generatedOtp}\nBu kod 10 daqiqa amal qiladi.\nIltimos, bu kodni hech kimga bermang.`;

    const success = await sendTelegramMessage(chatId, message);
    if (success) {
      console.log(`OTP ${generatedOtp} ${phone} raqamiga yuborildi`);
      return true;
    }
    console.error('Telegram orqali OTP yuborish muvaffaqiyatsiz');
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
      console.log('OTP topilmadi yoki noto‘g‘ri:', phone);
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

    // OTP to‘g‘ri bo‘lsa, uni o‘chirish
    const filteredOtps = currentOtps.filter(o => o.phone !== phone);
    saveToLocalStorage('otpCodes', filteredOtps);
    
    console.log('OTP muvaffaqiyatli tasdiqlandi:', phone);
    return true;
  } catch (error) {
    console.error('OTP tasdiqlashda xato:', error);
    return false;
  }
};

// Muddat o‘tgan OTP'larni tozalash
export const cleanupExpiredOtps = () => {
  try {
    const currentOtps = getFromLocalStorage('otpCodes', []);
    const now = new Date();
    const validOtps = currentOtps.filter(otpData => new Date(otpData.expiresAt) >= now);
    
    if (validOtps.length !== currentOtps.length) {
      saveToLocalStorage('otpCodes', validOtps);
      console.log(`Tozalandi: ${currentOtps.length - validOtps.length} ta muddati o‘tgan OTP`);
    }
    
    return validOtps;
  } catch (error) {
    console.error('Muddat o‘tgan OTP’larni tozalashda xato:', error);
    return [];
  }
};

// Tish holatini normallashtirish
export const normalizeToothStatus = (status) => {
  if (!status && status !== 0) return '';
  let s = String(status).toLowerCase().trim();
  s = s.replace(/[’‘ʼ`ʻ]/g, "'");
  s = s.replace(/yo['’`ʻ]q/g, 'yoq');
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
    'davl': '#FFC107'
  };
  return colors[s] || '#CCCCCC';
};

// Bemor ma’lumotlarini tozalash
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
    console.error(`localStorage'dan o‘qishda xato (${key}):`, error);
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

// Admin so‘rovlarini saqlash
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

    console.log('Yangi admin so‘rovi saqlandi:', sanitizedRequest.email);
    if (typeof callback === 'function') {
      callback(true, 'Admin so‘rovi muvaffaqiyatli saqlandi', sanitizedRequest);
    }
  } catch (error) {
    console.error('Admin so‘rovini saqlashda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Admin so‘rovini saqlashda xato');
    }
  }
};

// Kutayotgan admin so‘rovlarini olish
export const getPendingAdminRequests = () => {
  return getFromLocalStorage('pendingAdminRequests', []).filter(req => req.status === 'pending');
};

// Admin so‘rovini yangilash
export const updatePendingAdminRequest = (requestId, updatedData, callback) => {
  try {
    const currentRequests = getFromLocalStorage('pendingAdminRequests', []);
    const existingIndex = currentRequests.findIndex(req => String(req.id) === String(requestId));
    if (existingIndex === -1) {
      if (typeof callback === 'function') {
        callback(false, 'Admin so‘rovi topilmadi');
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
    console.log('Admin so‘rovi yangilandi:', requestId);
    if (typeof callback === 'function') {
      callback(true, 'Admin so‘rovi muvaffaqiyatli yangilandi', merged);
    }
  } catch (error) {
    console.error('Admin so‘rovini yangilashda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Admin so‘rovini yangilashda xato');
    }
  }
};

// Admin so‘rov ma’lumotlarini tekshirish
export const validateAdminRequestData = (request) => {
  const errors = [];
  if (!request?.email || !validateEmail(request.email)) {
    errors.push('Haqiqiy email talab qilinadi');
  }
  if (!request?.name || String(request.name).trim().length < 2) {
    errors.push('Ism kamida 2 harfdan iborat bo‘lishi kerak');
  }
  if (!request?.phone || !validatePhone(request.phone)) {
    errors.push('Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak');
  }
  if (!request?.telegram || !/^\d+$/.test(String(request.telegram))) {
    errors.push('Telegram Chat ID faqat raqamlardan iborat bo‘lishi kerak');
  }
  return errors;
};

// Ma'lumotlarni boshlang'ich holatga keltirish
export const initializeData = () => {
  console.log('🦷 Keksri Dental - Ma\'lumotlarni boshlash...');

  const keksriInitialData = {
    patients: [
      {
        id: 1,
        name: 'Ali Valiev',
        phone: '+998901234567',
        gender: 'Erkak',
        address: 'Tashkent city, Yunusabad district',
        dob: '1990-05-15',
        telegram: '123456789',
        note: 'Has diabetes, sensitive to local anesthesia',
        prescriptions: [
          {
            id: 1,
            date: '2024-01-15',
            medication: 'Amoxicillin 500mg',
            dosage: '1 tablet, 3 times a day, 7 days',
            notes: 'Infection prevention'
          }
        ],
        lastVisit: '2024-01-15',
        toothChart: [
          { tooth: 16, status: 'plomba', color: '#4CAF50' },
          { tooth: 36, status: 'karies', color: '#FF9800' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Zilola Karimova',
        phone: '+998912345678',
        gender: 'Ayol',
        address: 'Samarkand city, Registan street',
        dob: '1985-08-22',
        telegram: '987654321',
        note: '6th month of pregnancy, requires special care',
        prescriptions: [
          {
            id: 1,
            date: '2024-01-10',
            medication: 'Paracetamol 500mg',
            dosage: 'As needed, 2 times a day',
            notes: 'For pain relief'
          }
        ],
        lastVisit: '2024-01-10',
        toothChart: [
          { tooth: 11, status: 'koronka', color: '#9C27B0' },
          { tooth: 46, status: 'plomba', color: '#4CAF50' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Sherzod Qodirov',
        phone: '+998934567890',
        gender: 'Erkak',
        address: 'Bukhara region, Kogon city',
        dob: '1978-12-03',
        telegram: '555666777',
        note: 'Prosthetic teeth, requires regular checkups',
        prescriptions: [],
        lastVisit: '2023-12-20',
        toothChart: [
          { tooth: 47, status: 'protez', color: '#607D8B' },
          { tooth: 36, status: 'yoq', color: '#F44336' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    appointments: [
      {
        id: 1,
        patientId: 1,
        patientName: 'Ali Valiev',
        date: '2024-09-01',
        time: '10:00',
        procedure: 'Teeth cleaning',
        status: 'completed',
        notes: 'Good condition, next checkup in 6 months',
        prescription: 'Recommended toothpaste and floss',
        duration: '45',
        doctor: 'Dr. Aziza',
        cost: '150000',
        nextVisit: '2025-03-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        patientId: 1,
        patientName: 'Ali Valiev',
        date: '2024-09-10',
        time: '14:00',
        procedure: 'Filling',
        status: 'completed',
        notes: 'Tooth #36, composite filling',
        prescription: 'Avoid hot/cold',
        duration: '30',
        doctor: 'Dr. Jamshid',
        cost: '200000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        patientId: 2,
        patientName: 'Zilola Karimova',
        date: '2024-09-15',
        time: '11:30',
        procedure: 'Dental checkup',
        status: 'pending',
        notes: 'Pregnancy checkup',
        prescription: '',
        duration: '60',
        doctor: 'Dr. Aziza',
        cost: '80000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        patientId: 3,
        patientName: 'Sherzod Qodirov',
        date: '2024-09-20',
        time: '09:00',
        procedure: 'Prosthesis checkup',
        status: 'scheduled',
        notes: 'Prosthesis adjustment needed',
        prescription: '',
        duration: '90',
        doctor: 'Dr. Jamshid',
        cost: '120000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    medications: [
      {
        id: 1,
        name: 'Amoxicillin 500mg',
        type: 'antibiotic',
        dosage: '500mg',
        form: 'tablet',
        stock: 150,
        price: 2500,
        description: 'Broad-spectrum antibiotic',
        sideEffects: 'Nausea, allergy',
        contraindications: 'Penicillin allergy'
      },
      {
        id: 2,
        name: 'Paracetamol 500mg',
        type: 'painkiller',
        dosage: '500mg',
        form: 'tablet',
        stock: 300,
        price: 800,
        description: 'Pain and fever relief',
        sideEffects: 'Liver damage (high doses)',
        contraindications: 'Liver diseases'
      },
      {
        id: 3,
        name: 'Lidocaine 2%',
        type: 'anesthetic',
        dosage: '2%',
        form: 'injection',
        stock: 50,
        price: 15000,
        description: 'Local anesthetic',
        sideEffects: 'Increased heart rate',
        contraindications: 'Heart conditions'
      }
    ],
    users: [
      {
        id: 1,
        name: 'Keksri Admin',
        email: 'admin@keksri.uz',
        password: 'keksri123',
        role: 'admin',
        phone: '+998901112233',
        specialty: 'Chief Dentist',
        bio: '15 years of experience, implantology specialist',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Dr. Aziza',
        email: 'aziza@keksri.uz',
        password: 'aziza123',
        role: 'staff',
        phone: '+998902223344',
        specialty: 'Orthodontist',
        bio: 'Pediatric and adult orthodontics',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Dr. Jamshid',
        email: 'jamshid@keksri.uz',
        password: 'jamshid123',
        role: 'staff',
        phone: '+998903334455',
        specialty: 'Surgeon',
        bio: 'Dental surgery and implantology',
        createdAt: new Date().toISOString()
      }
    ],
    billings: [
      {
        id: 1,
        patientId: 1,
        patientName: 'Ali Valiev',
        date: '2024-09-01',
        services: [
          { name: 'Teeth cleaning', cost: 150000 },
          { name: 'Consultation', cost: 50000 }
        ],
        total: 200000,
        paid: 200000,
        status: 'paid',
        paymentMethod: 'cash',
        notes: 'Fully paid'
      }
    ],
    inventory: [
      {
        id: 1,
        name: 'Colgate Toothpaste',
        category: 'hygiene',
        stock: 45,
        minStock: 10,
        price: 15000,
        supplier: 'Medtex Group'
      },
      {
        id: 2,
        name: 'Oral-B Floss',
        category: 'hygiene',
        stock: 30,
        minStock: 5,
        price: 8000,
        supplier: 'Dental Market'
      },
      {
        id: 3,
        name: 'Composite Filling Material',
        category: 'material',
        stock: 25,
        minStock: 3,
        price: 85000,
        supplier: '3M Dental'
      }
    ],
    staff: [
      {
        id: 1,
        name: 'Dilobar',
        position: 'Nurse',
        phone: '+998904445566',
        salary: '4000000',
        joinDate: '2023-01-15',
        status: 'active'
      },
      {
        id: 2,
        name: 'Farid',
        position: 'Administrator',
        phone: '+998905556677',
        salary: '3500000',
        joinDate: '2023-03-20',
        status: 'active'
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
        role: 'staff',
        status: 'pending',
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
      },
      {
        id: 2,
        userId: 2,
        name: 'Dr. Aziza',
        email: 'aziza@keksri.uz',
        phone: '+998902223344',
        role: 'staff',
        loginMethod: 'email',
        timestamp: '2025-10-04T14:30:00.000Z'
      },
      {
        id: 3,
        userId: 3,
        name: 'Dr. Jamshid',
        email: 'jamshid@keksri.uz',
        phone: '+998903334455',
        role: 'staff',
        loginMethod: 'token',
        timestamp: '2025-10-05T09:15:00.000Z'
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

export const validatePatientData = (patient) => {
  const errors = [];
  if (!patient?.name || String(patient.name).trim().length < 2) {
    errors.push('Ism kamida 2 harfdan iborat bo‘lishi kerak');
  }
  if (!patient?.phone || !validatePhone(patient.phone)) {
    errors.push('Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak');
  }
  if (patient?.dob) {
    const birthDate = new Date(patient.dob);
    if (birthDate > new Date()) {
      errors.push('Tug‘ilgan sana kelajakda bo‘lishi mumkin emas');
    }
  }
  if (patient?.telegram && !/^\d+$/.test(String(patient.telegram))) {
    errors.push('Telegram Chat ID faqat raqamlardan iborat bo‘lishi kerak');
  }
  return errors;
};

// Boshqa yordamchi funksiyalar
export const generateToothChart = () => {
  const teeth = [];
  for (let i = 1; i <= 8; i++) teeth.push({ number: i, quadrant: 1 });
  for (let i = 9; i <= 16; i++) teeth.push({ number: i, quadrant: 2 });
  for (let i = 17; i <= 24; i++) teeth.push({ number: i, quadrant: 3 });
  for (let i = 25; i <= 32; i++) teeth.push({ number: i, quadrant: 4 });
  return teeth;
};

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

export const importPatientsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedPatients = JSON.parse(e.target.result);
      if (!Array.isArray(importedPatients)) {
        if (typeof callback === 'function') {
          callback(false, 'Noto‘g‘ri import fayl formati');
        }
        return;
      }

      const validatedPatients = importedPatients
        .filter(patient =>
          patient &&
          patient.id &&
          patient.name &&
          patient.phone &&
          validatePhone(patient.phone)
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
        callback(false, 'Faylni o‘qishda xato. JSON formatini tekshiring.');
      }
    }
  };
  reader.readAsText(file);
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

export const importAppointmentsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedAppointments = JSON.parse(e.target.result);
      if (!Array.isArray(importedAppointments)) {
        if (typeof callback === 'function') {
          callback(false, 'Noto‘g‘ri import fayl formati');
        }
        return;
      }

      const validatedAppointments = importedAppointments
        .filter(app =>
          app &&
          app.id &&
          app.patientId &&
          app.date &&
          app.time &&
          app.procedure &&
          app.status
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
        callback(false, 'Faylni o‘qishda xato. JSON formatini tekshiring.');
      }
    }
  };
  reader.readAsText(file);
};

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

    console.log('Yangi bemor qo‘shildi:', sanitizedPatient.name);
    if (typeof callback === 'function') {
      callback(true, 'Bemor muvaffaqiyatli qo‘shildi', sanitizedPatient);
    }
  } catch (error) {
    console.error('Bemor qo‘shishda xato:', error);
    if (typeof callback === 'function') {
      callback(false, 'Bemor qo‘shishda xato');
    }
  }
};

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
        ? { ...app, status: 'cancelled', updatedAt: new Date().toISOString() }
        : app
    );

    saveToLocalStorage('appointments', updatedAppointments);

    const patients = getFromLocalStorage('patients', []);
    const patient = patients.find(p => String(p.id) === String(appointment.patientId));
    if (patient && patient.telegram) {
      const message = `🦷 KEKSRI: Uchrashuv bekor qilindi\nBemor: ${patient.name}\nSana: ${appointment.date} ${appointment.time}\nProtsedura: ${appointment.procedure}`;
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

console.log('🦷 Keksri Utils yuklandi!');