// utils.js (yangilangan)

///////////////////////
// Telegram token (zarurat bo'lsa dinamik o'rnatish uchun)
let TELEGRAM_BOT_TOKEN = '8446018868:AAGMBw9ZFI2gDP3a_XA7qpVDX4_ar76IxlU';
export const setTelegramBotToken = (token) => {
  TELEGRAM_BOT_TOKEN = token;
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('telegramBotToken', token);
    }
  } catch (e) {
    console.warn('Telegram token saqlanmadi:', e);
  }
};

///////////////////////
// Helper: normalize tooth status (yo'q / yoq / yoʻq kabi variantlarni birlashtirish)
export const normalizeToothStatus = (status) => {
  if (!status && status !== 0) return '';
  let s = String(status).toLowerCase().trim();

  // Replace various apostrophe-like characters with a simple apostrophe
  s = s.replace(/[’‘ʼ`ʻ]/g, "'");

  // Normalize common Uzbek variants for "yo'q"
  s = s.replace(/yo['’`ʻ]q/g, 'yoq');

  // Remove extra whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
};

///////////////////////
// Tooth status -> color mapping
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

///////////////////////
// Sanitize patient: normalizatsiya qilish (toothChart status ham to'g'rilanadi)
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

///////////////////////
// LocalStorage helpers
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    // console.log(`📖 Keksri o'qiyapti: ${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`💥 Keksri o'qish xatosi (${key}):`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    // console.log(`💾 Keksri saqlayapti: ${key}`, value);
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`💥 Keksri saqlash xatosi (${key}):`, error);
  }
};

///////////////////////
// Initialization (o'zgartirmadim, lekin normal ishlashi uchun qoldirdim)
export const initializeData = () => {
  console.log("🦷 Keksri Dental - Ma'lumotlarni ishga tushiramiz...");
  
  const keksriInitialData = {
    patients: [
      {
        id: 1,
        name: "Ali Valiev",
        phone: "+998901234567",
        gender: "Erkak",
        address: "Toshkent shahar, Yunusobod tumani",
        dob: "1990-05-15",
        telegram: "123456789",
        note: "Qandli diabet bor, lokal anesteziyaga sezgir",
        prescriptions: [
          {
            id: 1,
            date: "2024-01-15",
            medication: "Amoxicillin 500mg",
            dosage: "1 tabletka, kuniga 3 marta, 7 kun",
            notes: "Infeksiyadan qo'rqish"
          }
        ],
        lastVisit: "2024-01-15",
        toothChart: [
          { tooth: 16, status: "plomba", color: "#4CAF50" },
          { tooth: 36, status: "karies", color: "#FF9800" }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Zilola Karimova",
        phone: "+998912345678",
        gender: "Ayol",
        address: "Samarqand shahar, Registon ko'chasi",
        dob: "1985-08-22",
        telegram: "987654321",
        note: "Homiladorlikning 6-oyi, maxsus ehtiyot kerak",
        prescriptions: [
          {
            id: 1,
            date: "2024-01-10",
            medication: "Paracetamol 500mg",
            dosage: "Zarurat bo'lganda, kuniga 2 marta",
            notes: "Og'riq qoldirish uchun"
          }
        ],
        lastVisit: "2024-01-10",
        toothChart: [
          { tooth: 11, status: "koronka", color: "#9C27B0" },
          { tooth: 46, status: "plomba", color: "#4CAF50" }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: "Sherzod Qodirov",
        phone: "+998934567890",
        gender: "Erkak",
        address: "Buxoro viloyati, Kogon shahri",
        dob: "1978-12-03",
        telegram: "555666777",
        note: "Protez tishlar, muntazam tekshiruv talab qiladi",
        prescriptions: [],
        lastVisit: "2023-12-20",
        toothChart: [
          { tooth: 47, status: "protez", color: "#607D8B" },
          { tooth: 36, status: "yo'q", color: "#F44336" }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    appointments: [
      {
        id: 1,
        patientId: 1,
        patientName: "Ali Valiev",
        date: "2024-09-01",
        time: "10:00",
        procedure: "Tish tozalash",
        status: "amalga oshirildi",
        notes: "Yaxshi holatda, keyingi tekshiruv 6 oydan keyin",
        prescription: "Tish pastasi va ipi tavsiya etildi",
        duration: "45",
        doctor: "Dr. Aziza",
        cost: "150000",
        nextVisit: "2025-03-01",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        patientId: 1,
        patientName: "Ali Valiev",
        date: "2024-09-10",
        time: "14:00",
        procedure: "Plomba qo'yish",
        status: "amalga oshirildi",
        notes: "36-sonli tish, kompozit plomba",
        prescription: "Issiq-sovuqdan saqlash",
        duration: "30",
        doctor: "Dr. Jamshid",
        cost: "200000",
        nextVisit: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        patientId: 2,
        patientName: "Zilola Karimova",
        date: "2024-09-15",
        time: "11:30",
        procedure: "Tish tekshiruvi",
        status: "kutilmoqda",
        notes: "Homiladorlik tekshiruvi",
        prescription: "",
        duration: "60",
        doctor: "Dr. Aziza",
        cost: "80000",
        nextVisit: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 4,
        patientId: 3,
        patientName: "Sherzod Qodirov",
        date: "2024-09-20",
        time: "09:00",
        procedure: "Protez tekshiruvi",
        status: "reja qilindi",
        notes: "Protezni sozlash talab qilinadi",
        prescription: "",
        duration: "90",
        doctor: "Dr. Jamshid",
        cost: "120000",
        nextVisit: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    medications: [
      {
        id: 1,
        name: "Amoxicillin 500mg",
        type: "antibiotik",
        dosage: "500mg",
        form: "tabletka",
        stock: 150,
        price: 2500,
        description: "Keng spektrli antibiotik",
        sideEffects: "Ko'ngil aynishi, allergiya",
        contraindications: "Penitsillinga allergiya"
      },
      {
        id: 2,
        name: "Paracetamol 500mg",
        type: "og'riq qoldiruvchi",
        dosage: "500mg",
        form: "tabletka",
        stock: 300,
        price: 800,
        description: "Og'riq va isitma qoldiruvchi",
        sideEffects: "Jigar shikastlanishi (yuqori dozalarda)",
        contraindications: "Jigar kasalliklari"
      },
      {
        id: 3,
        name: "Lidocaine 2%",
        type: "anestetik",
        dosage: "2%",
        form: "in'ektsiya",
        stock: 50,
        price: 15000,
        description: "Lokal anestetik",
        sideEffects: "Yurak urishi tezlashishi",
        contraindications: "Yurak kasalliklari"
      }
    ],
    users: [
      {
        id: 1,
        name: "Keksri Admin",
        email: "admin@keksri.uz",
        password: "keksri123",
        role: "admin",
        phone: "+998901112233",
        specialty: "Bosh stomatolog",
        bio: "15 yillik tajriba, implantologiya mutaxassisi",
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Dr. Aziza",
        email: "aziza@keksri.uz",
        password: "aziza123",
        role: "staff",
        phone: "+998902223344",
        specialty: "Ortodont",
        bio: "Bolalar va kattalar ortodontiyasi",
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        name: "Dr. Jamshid",
        email: "jamshid@keksri.uz",
        password: "jamshid123",
        role: "staff",
        phone: "+998903334455",
        specialty: "Xirurg",
        bio: "Tish xirurgiyasi va implantologiya",
        createdAt: new Date().toISOString()
      }
    ],
    billings: [
      {
        id: 1,
        patientId: 1,
        patientName: "Ali Valiev",
        date: "2024-09-01",
        services: [
          { name: "Tish tozalash", cost: 150000 },
          { name: "Konsultatsiya", cost: 50000 }
        ],
        total: 200000,
        paid: 200000,
        status: "to'langan",
        paymentMethod: "naqd",
        notes: "To'liq to'lov qilindi"
      }
    ],
    inventory: [
      {
        id: 1,
        name: "Tish pastasi Colgate",
        category: "gigiena",
        stock: 45,
        minStock: 10,
        price: 15000,
        supplier: "Medtex Group"
      },
      {
        id: 2,
        name: "Tish ipi Oral-B",
        category: "gigiena",
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
      }
    ],
    staff: [
      {
        id: 1,
        name: "Dilobar",
        position: "Hamshira",
        phone: "+998904445566",
        salary: "4000000",
        joinDate: "2023-01-15",
        status: "active"
      },
      {
        id: 2,
        name: "Farid",
        position: "Administrator",
        phone: "+998905556677",
        salary: "3500000",
        joinDate: "2023-03-20",
        status: "active"
      }
    ],
    sidebarOpen: false,
    darkMode: false,
    fontSize: 16,
    layout: "normal",
    keksri_initialized: true
  };

  Object.keys(keksriInitialData).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(keksriInitialData[key]));
      console.log(`✅ Keksri ${key} ma'lumotlari saqlandi`);
    }
  });
};

///////////////////////
// Validation helpers
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
      console.error("Bemorlar ma'lumotlari massiv emas!");
      return [];
    }
    return patients
      .filter(patient =>
        patient &&
        typeof patient === "object" &&
        (patient.id !== undefined && patient.id !== null) &&
        patient.name &&
        typeof patient.name === "string" &&
        validatePhone(patient.phone)
      )
      .map(patient => sanitizePatientData(patient));
  } catch (error) {
    console.error("Bemorlar ma'lumotlarini tekshirishda xato:", error);
    return [];
  }
};

export const validatePatientData = (patient) => {
  const errors = [];
  if (!patient?.name || String(patient.name).trim().length < 2) {
    errors.push('Ism kamida 2 belgidan iborat boʻlishi kerak');
  }
  if (!patient?.phone || !validatePhone(patient.phone)) {
    errors.push('Telefon raqami +998XXXXXXXXX formatida boʻlishi kerak');
  }
  if (patient?.dob) {
    const birthDate = new Date(patient.dob);
    if (birthDate > new Date()) {
      errors.push('Tugʻilgan sana kelajakda boʻlishi mumkin emas');
    }
  }
  if (patient?.telegram && !/^\d+$/.test(String(patient.telegram))) {
    errors.push('Telegram Chat ID faqat raqamlardan iborat boʻlishi kerak');
  }
  return errors;
};

///////////////////////
// Other utilities
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
    const blob = new Blob([JSON.stringify(patients, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keksri_bemorlar_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("✅ Keksri bemorlar eksport qilindi");
    return true;
  } catch (e) {
    console.error("💥 Keksri eksport xatosi:", e);
    alert('Keksri eksport qilishda xatolik yuz berdi');
    return false;
  }
};

export const importPatientsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedPatients = JSON.parse(e.target.result);
      if (!Array.isArray(importedPatients)) {
        callback(false, "Keksri import fayli formati noto'g'ri");
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
        callback(false, "Keksri faylda yaroqli bemor ma'lumoti topilmadi");
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
      console.log(`✅ Keksri ${validatedPatients.length} bemor import qilindi`);
      callback(true, `${validatedPatients.length} ta Keksri bemor muvaffaqiyatli import qilindi`);
    } catch (err) {
      console.error("💥 Keksri import xatosi:", err);
      callback(false, "Keksri faylni o'qishda xatolik. JSON formatini tekshiring.");
    }
  };
  reader.readAsText(file);
};

export const exportAppointmentsData = () => {
  try {
    const appointments = getFromLocalStorage('appointments', []);
    const blob = new Blob([JSON.stringify(appointments, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keksri_uchrashuvlar_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("✅ Keksri uchrashuvlar eksport qilindi");
    return true;
  } catch (e) {
    console.error("💥 Keksri uchrashuvlar eksport xatosi:", e);
    alert('Keksri uchrashuvlarni eksport qilishda xatolik yuz berdi');
    return false;
  }
};

export const importAppointmentsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedAppointments = JSON.parse(e.target.result);
      if (!Array.isArray(importedAppointments)) {
        callback(false, "Keksri import fayli formati noto'g'ri");
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
        callback(false, "Keksri faylda yaroqli uchrashuv ma'lumoti topilmadi");
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
      console.log(`✅ Keksri ${validatedAppointments.length} uchrashuv import qilindi`);
      callback(true, `${validatedAppointments.length} ta Keksri uchrashuv muvaffaqiyatli import qilindi`);
    } catch (err) {
      console.error("💥 Keksri uchrashuv import xatosi:", err);
      callback(false, "Keksri faylni o'qishda xatolik. JSON formatini tekshiring.");
    }
  };
  reader.readAsText(file);
};

export const sendTelegramMessage = (chatId, message) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('💥 Keksri Telegram token mavjud emas');
    return Promise.resolve(false);
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      if (!data.ok) {
        console.error('💥 Keksri Telegram xatosi:', data.description);
        throw new Error(data.description);
      }
      console.log('✅ Keksri Telegram xabar yuborildi');
      return true;
    })
    .catch(error => {
      console.error('💥 Keksri Telegram API xatosi:', error);
      return false;
    });
};

export const addNewPatient = (patientData, callback) => {
  try {
    const errors = validatePatientData(patientData);
    if (errors.length > 0) {
      callback(false, errors.join(', '));
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

    console.log("✅ Keksri yangi bemor qo'shildi:", sanitizedPatient.name);
    callback(true, 'Keksri bemor muvaffaqiyatli qo\'shildi', sanitizedPatient);
  } catch (error) {
    console.error('💥 Keksri bemor qo\'shish xatosi:', error);
    callback(false, 'Keksri bemor qo\'shishda xatolik yuz berdi');
  }
};

export const cancelAppointment = (appointmentId, callback) => {
  try {
    const appointments = getFromLocalStorage('appointments', []);
    const appointment = appointments.find(app => String(app.id) === String(appointmentId));
    
    if (!appointment) {
      callback(false, 'Keksri uchrashuv topilmadi');
      return;
    }

    const updatedAppointments = appointments.map(app =>
      String(app.id) === String(appointmentId)
        ? { ...app, status: 'bekor qilindi', updatedAt: new Date().toISOString() }
        : app
    );

    saveToLocalStorage('appointments', updatedAppointments);
    
    const patients = getFromLocalStorage('patients', []);
    const patient = patients.find(p => String(p.id) === String(appointment.patientId));
    if (patient && patient.telegram) {
      const message = `🦷 KEKSRI: Uchrashuv bekor qilindi\nBemor: ${patient.name}\nSana: ${appointment.date} ${appointment.time}\nProtsedura: ${appointment.procedure}`;
      sendTelegramMessage(patient.telegram, message);
    }

    console.log("✅ Keksri uchrashuv bekor qilindi:", appointmentId);
    callback(true, 'Keksri uchrashuv bekor qilindi');
  } catch (error) {
    console.error('💥 Keksri uchrashuv bekor qilish xatosi:', error);
    callback(false, 'Keksri uchrashuvni bekor qilishda xatolik yuz berdi');
  }
};

// *** MUHIM O'ZGARTISH: updatePatient endi mavjud bemor bilan merge qilib validatsiya qiladi ***
export const updatePatient = (patientId, updatedData, callback) => {
  try {
    const currentPatients = getFromLocalStorage('patients', []);
    const existingIndex = currentPatients.findIndex(p => String(p.id) === String(patientId));
    if (existingIndex === -1) {
      callback(false, 'Keksri bemor topilmadi');
      return;
    }

    const existing = currentPatients[existingIndex];
    // Merge existing + updated (don't drop fields not provided in updatedData)
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
      callback(false, errors.join(', '));
      return;
    }

    const sanitizedData = sanitizePatientData(merged);
    currentPatients[existingIndex] = sanitizedData;

    saveToLocalStorage('patients', currentPatients);
    console.log("✅ Keksri bemor yangilandi:", patientId);
    callback(true, 'Keksri bemor ma\'lumotlari yangilandi', sanitizedData);
  } catch (error) {
    console.error('💥 Keksri bemor yangilash xatosi:', error);
    callback(false, 'Keksri ma\'lumotlarni yangilashda xatolik yuz berdi');
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
  const pendingAppointments = (appointments || []).filter(app => app.status === 'kutilmoqda');
  const totalRevenue = (billings || []).reduce((sum, bill) => sum + (Number(bill.total) || 0), 0);
  
  return {
    totalPatients: (patients || []).length,
    todayAppointments: todayAppointments.length,
    pendingAppointments: pendingAppointments.length,
    totalRevenue: totalRevenue
  };
};

export const logLogin = (user) => {
  try {
    const logins = getFromLocalStorage('logins', []);
    logins.push({
      id: Date.now(),
      userId: user?.id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      timestamp: new Date().toISOString()
    });
    saveToLocalStorage('logins', logins);
    console.log("✅ Login qayd etildi");
  } catch (error) {
    console.error("💥 Login qayd etish xatosi:", error);
  }
};

console.log("🦷 Keksri Utils yuklandi!");
