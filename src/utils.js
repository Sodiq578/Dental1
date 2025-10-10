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
        address: 'Samarqand shahri, Registon ko‘chasi',
        dob: '1985-08-22',
        telegram: '987654321',
        note: 'Homiladorlikning 6-oyida, maxsus parvarish talab qilinadi',
        prescriptions: [
          {
            id: 1,
            date: '2024-01-10',
            medication: 'Paracetamol 500mg',
            dosage: 'Kerak bo‘lganda, kuniga 2 marta',
            notes: 'Og‘riqni yo‘qotish uchun'
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
        address: 'Buxoro viloyati, Kogon shahri',
        dob: '1978-12-03',
        telegram: '555666777',
        note: 'Protez tishlar, muntazam tekshiruvlar talab qilinadi',
        prescriptions: [],
        lastVisit: '2023-12-20',
        toothChart: [
          { tooth: 47, status: 'protez', color: '#607D8B' },
          { tooth: 36, status: 'yoq', color: '#F44336' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Nodira Usmonova',
        phone: '+998907654321',
        gender: 'Ayol',
        address: 'Farg‘ona viloyati, Qo‘qon shahri',
        dob: '1992-03-10',
        telegram: '444555666',
        note: 'Allergik reaksiyalar mavjud, antibiotiklarga ehtiyotkorlik',
        prescriptions: [
          {
            id: 1,
            date: '2024-02-05',
            medication: 'Ibuprofen 400mg',
            dosage: '1 tabletka, kuniga 2 marta, 5 kun',
            notes: 'Og‘riqni kamaytirish'
          }
        ],
        lastVisit: '2024-02-05',
        toothChart: [
          { tooth: 25, status: 'karies', color: '#FF9800' },
          { tooth: 17, status: 'plomba', color: '#2196F3' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        name: 'Javlonbek Rahimov',
        phone: '+998908765432',
        gender: 'Erkak',
        address: 'Andijon shahri, Navoiy ko‘chasi',
        dob: '1980-07-19',
        telegram: '777888999',
        note: 'Ortodontik davolanish talab qilinadi',
        prescriptions: [],
        lastVisit: '2024-03-12',
        toothChart: [
          { tooth: 21, status: 'koronka', color: '#9C27B0' },
          { tooth: 31, status: 'sog', color: '#4CAF50' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 6,
        name: 'Mohira Sobirova',
        phone: '+998909876543',
        gender: 'Ayol',
        address: 'Toshkent shahri, Chilanzor tumani',
        dob: '1995-11-27',
        telegram: '222333444',
        note: 'Tish go‘shti muammolari, gingivit',
        prescriptions: [
          {
            id: 1,
            date: '2024-04-10',
            medication: 'Chlorhexidine 0.2%',
            dosage: 'Og‘iz chayish, kuniga 2 marta, 10 kun',
            notes: 'Gingivit davolash'
          }
        ],
        lastVisit: '2024-04-10',
        toothChart: [
          { tooth: 18, status: 'davl', color: '#FFC107' },
          { tooth: 28, status: 'karies', color: '#FF9800' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 7,
        name: 'Oybek Mirzayev',
        phone: '+998901111222',
        gender: 'Erkak',
        address: 'Namangan viloyati, Chust tumani',
        dob: '1988-09-14',
        telegram: '111222333',
        note: 'Tish sinishi, protez kerak',
        prescriptions: [],
        lastVisit: '2024-05-20',
        toothChart: [
          { tooth: 26, status: 'protez', color: '#607D8B' },
          { tooth: 15, status: 'yoq', color: '#F44336' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 8,
        name: 'Gulnoza Xolmatova',
        phone: '+998902222333',
        gender: 'Ayol',
        address: 'Qashqadaryo viloyati, Qarshi shahri',
        dob: '1993-02-18',
        telegram: '999888777',
        note: 'Estetik tish tozalash talab qilinadi',
        prescriptions: [],
        lastVisit: '2024-06-15',
        toothChart: [
          { tooth: 12, status: 'sog', color: '#4CAF50' },
          { tooth: 22, status: 'sog', color: '#4CAF50' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 9,
        name: 'Temur Juraev',
        phone: '+998903333444',
        gender: 'Erkak',
        address: 'Toshkent shahri, Mirzo Ulug‘bek tumani',
        dob: '1975-04-22',
        telegram: '666777888',
        note: 'Tish implantlari, muntazam nazorat',
        prescriptions: [
          {
            id: 1,
            date: '2024-07-10',
            medication: 'Amoxicillin 500mg',
            dosage: '1 tabletka, kuniga 3 marta, 7 kun',
            notes: 'Implantdan keyin infeksiyadan himoya'
          }
        ],
        lastVisit: '2024-07-10',
        toothChart: [
          { tooth: 14, status: 'protez', color: '#607D8B' },
          { tooth: 24, status: 'karies', color: '#FF9800' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 10,
        name: 'Malika To‘xtayeva',
        phone: '+998904444555',
        gender: 'Ayol',
        address: 'Jizzax viloyati, Jizzax shahri',
        dob: '1987-12-05',
        telegram: '555444333',
        note: 'Tish oqartirish xizmati so‘ralgan',
        prescriptions: [],
        lastVisit: '2024-08-01',
        toothChart: [
          { tooth: 13, status: 'sog', color: '#4CAF50' },
          { tooth: 23, status: 'sog', color: '#4CAF50' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      ,{
  id: 11,
  name: 'Rustam Abdurahmonov',
  phone: '+998905555666',
  gender: 'Erkak',
  address: 'Toshkent viloyati, Zangiota tumani',
  dob: '1982-11-02',
  telegram: '112233445',
  note: 'Yuqori qon bosimi, behushlik oldidan tekshirish zarur',
  prescriptions: [
    {
      id: 1,
      date: '2024-09-01',
      medication: 'Lisinopril 10mg',
      dosage: 'Kuniga 1 marta, ertalab',
      notes: 'Qon bosimini boshqarish uchun'
    }
  ],
  lastVisit: '2024-09-01',
  toothChart: [
    { tooth: 45, status: 'plomba', color: '#4CAF50' },
    { tooth: 35, status: 'karies', color: '#FF9800' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 12,
  name: 'Dilnoza Raxmatova',
  phone: '+998911223344',
  gender: 'Ayol',
  address: 'Navoiy shahri, Xalqobod mahallasi',
  dob: '1997-06-18',
  telegram: '223344556',
  note: 'O‘tgan oyda og‘ir angina bilan davolangan, antibiotiklar bilan ehtiyotkorlik',
  prescriptions: [
    {
      id: 1,
      date: '2024-08-20',
      medication: 'Azithromycin 500mg',
      dosage: '1 tabletka, kuniga 1 marta, 3 kun',
      notes: 'Yuqori nafas yo‘li infeksiyasi uchun'
    }
  ],
  lastVisit: '2024-08-20',
  toothChart: [
    { tooth: 26, status: 'koronka', color: '#9C27B0' },
    { tooth: 16, status: 'yoq', color: '#F44336' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 13,
  name: 'Sardorbek Ismoilov',
  phone: '+998933221100',
  gender: 'Erkak',
  address: 'Surxondaryo viloyati, Termiz shahri',
  dob: '1991-04-08',
  telegram: '778899000',
  note: 'Professional sportchi, og‘riq qoldiruvchilarga sezgir',
  prescriptions: [],
  lastVisit: '2024-07-25',
  toothChart: [
    { tooth: 37, status: 'sog', color: '#4CAF50' },
    { tooth: 27, status: 'karies', color: '#FF9800' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 14,
  name: 'Saida Mamatqulova',
  phone: '+998909999000',
  gender: 'Ayol',
  address: 'Xorazm viloyati, Urganch shahri',
  dob: '1983-01-30',
  telegram: '665544332',
  note: 'Kattalashtirilgan tiroid bezlari, umumiy behushlikdan saqlanish zarur',
  prescriptions: [
    {
      id: 1,
      date: '2024-09-10',
      medication: 'Ibuprofen 400mg',
      dosage: 'Kerak bo‘lganda, kuniga 2 marta',
      notes: 'Og‘riqni kamaytirish'
    }
  ],
  lastVisit: '2024-09-10',
  toothChart: [
    { tooth: 33, status: 'plomba', color: '#4CAF50' },
    { tooth: 43, status: 'yoq', color: '#F44336' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 15,
  name: 'Bekzod Nasrullayev',
  phone: '+998907001122',
  gender: 'Erkak',
  address: 'Toshkent shahri, Yakkasaroy tumani',
  dob: '1990-10-12',
  telegram: '889900112',
  note: 'Tish siqilishi (bruksizm), kechasi uchun moslama tayyorlash kerak',
  prescriptions: [],
  lastVisit: '2024-10-01',
  toothChart: [
    { tooth: 17, status: 'sog', color: '#4CAF50' },
    { tooth: 27, status: 'sog', color: '#4CAF50' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},{
  id: 16,
  name: 'Muxlisa Yo‘ldosheva',
  phone: '+998911234567',
  gender: 'Ayol',
  address: 'Andijon shahri, Asaka tumani',
  dob: '1995-03-22',
  telegram: '998877665',
  note: 'Homiladorlikning 2-choragida, faqat zarur tibbiy muolajalar',
  prescriptions: [
    {
      id: 1,
      date: '2024-08-15',
      medication: 'Paracetamol 500mg',
      dosage: 'Kerak bo‘lganda, kuniga 3 marta',
      notes: 'Og‘riq va isitma uchun'
    }
  ],
  lastVisit: '2024-08-15',
  toothChart: [
    { tooth: 12, status: 'karies', color: '#FF9800' },
    { tooth: 22, status: 'plomba', color: '#4CAF50' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 17,
  name: 'Jasur Olimov',
  phone: '+998933300022',
  gender: 'Erkak',
  address: 'Namangan viloyati, Pop tumani',
  dob: '1988-07-14',
  telegram: '554433221',
  note: 'Shakar diabeti bor, yara bitishi sekin',
  prescriptions: [
    {
      id: 1,
      date: '2024-06-05',
      medication: 'Metronidazole 250mg',
      dosage: 'Kuniga 2 marta, 5 kun',
      notes: 'Infeksiya nazorati uchun'
    }
  ],
  lastVisit: '2024-06-05',
  toothChart: [
    { tooth: 36, status: 'yoq', color: '#F44336' },
    { tooth: 46, status: 'plomba', color: '#4CAF50' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 18,
  name: 'Shahnoza Karimova',
  phone: '+998909988776',
  gender: 'Ayol',
  address: 'Buxoro viloyati, G‘ijduvon tumani',
  dob: '1979-11-01',
  telegram: '445566778',
  note: 'Yurak ritmi nosozligi – adrenalinni ishlatmaslik kerak',
  prescriptions: [],
  lastVisit: '2024-09-12',
  toothChart: [
    { tooth: 11, status: 'koronka', color: '#9C27B0' },
    { tooth: 21, status: 'karies', color: '#FF9800' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 19,
  name: 'Ulug‘bek Abdullayev',
  phone: '+998939999222',
  gender: 'Erkak',
  address: 'Qashqadaryo viloyati, Qarshi shahri',
  dob: '1985-05-18',
  telegram: '776655443',
  note: 'Og‘iz bo‘shlig‘ida suvsizlanish, ko‘p suv tavsiya etilgan',
  prescriptions: [
    {
      id: 1,
      date: '2024-08-28',
      medication: 'Chlorhexidine 0.12%',
      dosage: 'Kuniga 2 marta chayish',
      notes: 'Og‘iz gigienasi'
    }
  ],
  lastVisit: '2024-08-28',
  toothChart: [
    { tooth: 15, status: 'sog', color: '#4CAF50' },
    { tooth: 25, status: 'karies', color: '#FF9800' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 20,
  name: 'Dilorom To‘xtayeva',
  phone: '+998914455667',
  gender: 'Ayol',
  address: 'Toshkent viloyati, Zangiota tumani',
  dob: '1993-12-25',
  telegram: '334422110',
  note: 'Og‘ir stress holatlari, muolajalarni asta-sekin boshlash lozim',
  prescriptions: [],
  lastVisit: '2024-09-30',
  toothChart: [
    { tooth: 31, status: 'yoq', color: '#F44336' },
    { tooth: 41, status: 'sog', color: '#4CAF50' }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
},
{
  id: 21,
  name: 'Islomjon Niyozov',
  phone: '+998935566778',
  gender: 'Erkak',
  address: 'Farg‘ona shahri, Qo‘qon tumani',
  dob: '1998-02-14',
  telegram: '998877441',
  note: 'Allergiya: Penitsillin',
  prescriptions: [
    {
      id: 1,
      date: '2024-07-10',
      medication: 'Clarithromycin 500mg',
      dosage: 'Kuniga 2 marta, 7 kun',
      notes: 'Alternativa antibiotik sifatida'
    }
  ],
  lastVisit: '2024-07-10',
  toothChart: [
    { tooth: 44, status: 'plomba', color: '#4CAF50' },
    { tooth: 45, status: 'yoq', color: '#F44336' }
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
      {
        id: 2,
        patientId: 1,
        patientName: 'Ali Valiev',
        date: '2024-09-10',
        time: '14:00',
        procedure: 'Plomba qo‘yish',
        status: 'yakunlandi',
        notes: '36-tish, kompozit plomba',
        prescription: 'Issiq/sovuqdan saqlanish',
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
        procedure: 'Tish tekshiruvi',
        status: 'kutilmoqda',
        notes: 'Homiladorlik tekshiruvi',
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
        procedure: 'Protez tekshiruvi',
        status: 'rejalashtirilgan',
        notes: 'Protez sozlash kerak',
        prescription: '',
        duration: '90',
        doctor: 'Dr. Jamshid',
        cost: '120000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 5,
        patientId: 4,
        patientName: 'Nodira Usmonova',
        date: '2024-09-25',
        time: '15:00',
        procedure: 'Tish tozalash',
        status: 'rejalashtirilgan',
        notes: 'Allergik reaksiyalarga ehtiyotkorlik',
        prescription: '',
        duration: '45',
        doctor: 'Dr. Aziza',
        cost: '150000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 6,
        patientId: 5,
        patientName: 'Javlonbek Rahimov',
        date: '2024-10-01',
        time: '10:30',
        procedure: 'Ortodontik tekshiruv',
        status: 'kutilmoqda',
        notes: 'Braket o‘rnatish imkoniyati',
        prescription: '',
        duration: '60',
        doctor: 'Dr. Aziza',
        cost: '100000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 7,
        patientId: 6,
        patientName: 'Mohira Sobirova',
        date: '2024-10-05',
        time: '12:00',
        procedure: 'Gingivit davolash',
        status: 'rejalashtirilgan',
        notes: 'Tish go‘shti muammolari',
        prescription: 'Og‘iz chayish vositasi',
        duration: '60',
        doctor: 'Dr. Jamshid',
        cost: '120000',
        nextVisit: '2024-10-19',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 8,
        patientId: 7,
        patientName: 'Oybek Mirzayev',
        date: '2024-10-10',
        time: '09:30',
        procedure: 'Protez sozlash',
        status: 'kutilmoqda',
        notes: 'Protez qayta sozlash',
        prescription: '',
        duration: '90',
        doctor: 'Dr. Jamshid',
        cost: '150000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 9,
        patientId: 8,
        patientName: 'Gulnoza Xolmatova',
        date: '2024-10-15',
        time: '11:00',
        procedure: 'Estetik tozalash',
        status: 'rejalashtirilgan',
        notes: 'Tishlarni oqartirish',
        prescription: '',
        duration: '45',
        doctor: 'Dr. Aziza',
        cost: '200000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 10,
        patientId: 9,
        patientName: 'Temur Juraev',
        date: '2024-10-20',
        time: '14:30',
        procedure: 'Implant tekshiruvi',
        status: 'kutilmoqda',
        notes: 'Implant holatini tekshirish',
        prescription: '',
        duration: '60',
        doctor: 'Dr. Jamshid',
        cost: '150000',
        nextVisit: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
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
        sideEffects: 'Ko‘ngil aynishi, allergiya',
        contraindications: 'Penitsillin allergiyasi'
      },
      {
        id: 2,
        name: 'Paracetamol 500mg',
        type: 'og‘riq qoldiruvchi',
        dosage: '500mg',
        form: 'tabletka',
        stock: 300,
        price: 800,
        description: 'Og‘riq va isitmani yo‘qotish',
        sideEffects: 'Yuqori dozalarda jigar shikastlanishi',
        contraindications: 'Jigar kasalliklari'
      },
      {
        id: 3,
        name: 'Lidocaine 2%',
        type: 'behushlik',
        dosage: '2%',
        form: 'in’ektsiya',
        stock: 50,
        price: 15000,
        description: 'Mahalliy behushlik vositasi',
        sideEffects: 'Yurak urishining tezlashishi',
        contraindications: 'Yurak kasalliklari'
      },
      {
        id: 4,
        name: 'Ibuprofen 400mg',
        type: 'og‘riq qoldiruvchi',
        dosage: '400mg',
        form: 'tabletka',
        stock: 200,
        price: 1200,
        description: 'Yallig‘lanish va og‘riqni kamaytirish',
        sideEffects: 'Oshqozon og‘rig‘i, bosh aylanishi',
        contraindications: 'Oshqozon yarasiga ehtiyotkorlik'
      },
      {
        id: 5,
        name: 'Chlorhexidine 0.2%',
        type: 'antiseptik',
        dosage: '0.2%',
        form: 'suyuqlik',
        stock: 100,
        price: 10000,
        description: 'Og‘iz bo‘shlig‘ini dezinfeksiya qilish',
        sideEffects: 'Ta’m sezishning o‘zgarishi',
        contraindications: 'Allergik reaksiyalar'
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
        specialty: 'Bosh stomatolog',
        bio: '15 yillik tajriba, implantologiya mutaxassisi',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Dr. Aziza',
        email: 'aziza@keksri.uz',
        password: 'aziza123',
        role: 'xodim',
        phone: '+998902223344',
        specialty: 'Ortodont',
        bio: 'Bolalar va kattalar ortodontiyasi',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Dr. Jamshid',
        email: 'jamshid@keksri.uz',
        password: 'jamshid123',
        role: 'xodim',
        phone: '+998903334455',
        specialty: 'Jarroh',
        bio: 'Stomatologik jarrohlik va implantologiya',
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        name: 'Dr. Shaxnoza',
        email: 'shaxnoza@keksri.uz',
        password: 'shaxnoza123',
        role: 'xodim',
        phone: '+998904445566',
        specialty: 'Pediatrik stomatolog',
        bio: 'Bolalar stomatologiyasi mutaxassisi',
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
          { name: 'Tish tozalash', cost: 150000 },
          { name: 'Maslahat', cost: 50000 }
        ],
        total: 200000,
        paid: 200000,
        status: 'to‘langan',
        paymentMethod: 'naqd',
        notes: 'To‘liq to‘langan'
      },
      {
        id: 2,
        patientId: 2,
        patientName: 'Zilola Karimova',
        date: '2024-09-15',
        services: [
          { name: 'Tish tekshiruvi', cost: 80000 }
        ],
        total: 80000,
        paid: 0,
        status: 'to‘lanmagan',
        paymentMethod: '',
        notes: 'To‘lov kutilmoqda'
      },
      {
        id: 3,
        patientId: 3,
        patientName: 'Sherzod Qodirov',
        date: '2024-09-20',
        services: [
          { name: 'Protez tekshiruvi', cost: 120000 }
        ],
        total: 120000,
        paid: 120000,
        status: 'to‘langan',
        paymentMethod: 'karta',
        notes: 'To‘liq to‘langan'
      },
      {
        id: 4,
        patientId: 4,
        patientName: 'Nodira Usmonova',
        date: '2024-09-25',
        services: [
          { name: 'Tish tozalash', cost: 150000 }
        ],
        total: 150000,
        paid: 150000,
        status: 'to‘langan',
        paymentMethod: 'naqd',
        notes: 'To‘liq to‘langan'
      }
    ],
  inventory: [
  {
    id: 1,
    name: "Colgate tish pastasi",
    category: "gigiyena",
    stock: 45,            // Ombordagi mavjud miqdor
    minStock: 10,         // Minimal zarur miqdor (xabar uchun)
    price: 15000,         // Narxi (so'mda)
    supplier: "Medtex Group" // Yetkazib beruvchi
  },
  {
    id: 2,
    name: "Oral-B tish ipi",
    category: "gigiyena",
    stock: 30,
    minStock: 5,
    price: 8000,
    supplier: "Dental Market"
  },
  {
    id: 3,
    name: "Kompozit plomba materiali",
    category: "material",
    stock: 25,
    minStock: 3,
    price: 85000,
    supplier: "3M Dental"
  },
  {
    id: 4,
    name: "Steril qo‘lqoplar",
    category: "material",
    stock: 100,
    minStock: 20,
    price: 5000,
    supplier: "Medtex Group"
  }
]
,
    staff: [
      {
        id: 1,
        name: 'Dilobar',
        position: 'Hamshira',
        phone: '+998904445566',
        salary: '4000000',
        joinDate: '2023-01-15',
        status: 'faol'
      },
      {
        id: 2,
        name: 'Farid',
        position: 'Administrator',
        phone: '+998905556677',
        salary: '3500000',
        joinDate: '2023-03-20',
        status: 'faol'
      },
      {
        id: 3,
        name: 'Zarina',
        position: 'Hamshira',
        phone: '+998906667788',
        salary: '3800000',
        joinDate: '2023-06-10',
        status: 'faol'
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
      },
      {
        id: 2,
        name: 'Mahmud Xo‘jayev',
        email: 'mahmud@keksri.uz',
        phone: '+998901234569',
        role: 'xodim',
        status: 'kutilmoqda',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        telegram: '456789123'
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
        role: 'xodim',
        loginMethod: 'email',
        timestamp: '2025-10-04T14:30:00.000Z'
      },
      {
        id: 3,
        userId: 3,
        name: 'Dr. Jamshid',
        email: 'jamshid@keksri.uz',
        phone: '+998903334455',
        role: 'xodim',
        loginMethod: 'token',
        timestamp: '2025-10-05T09:15:00.000Z'
      },
      {
        id: 4,
        userId: 4,
        name: 'Dr. Shaxnoza',
        email: 'shaxnoza@keksri.uz',
        phone: '+998904445566',
        role: 'xodim',
        loginMethod: 'email',
        timestamp: '2025-10-06T11:00:00.000Z'
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
        ? { ...app, status: 'bekor qilingan', updatedAt: new Date().toISOString() }
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