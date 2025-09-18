// src/utils.js

// 🔹 LocalStorage dan olish
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`LocalStorage'dan ${key} o'qishda xatolik:`, error);
    return defaultValue;
  }
};

// 🔹 LocalStorage ga saqlash
export const saveToLocalStorage = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`LocalStorage'ga ${key} saqlashda xatolik:`, error);
  }
};

// 🔹 Barcha ma'lumotlarni zaxiralash
export const backupAllData = () => {
  try {
    const allData = {};
    const keys = ['patients', 'appointments', 'medications', 'user', 'sidebarOpen', 'darkMode', 'fontSize', 'layout', 'billings', 'inventory', 'staff'];
    
    keys.forEach(key => {
      allData[key] = getFromLocalStorage(key);
    });

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `tish_shifoxonasi_zaxira_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Backup jarayonida xatolik:", e);
    alert('Zaxirada saqlashda xatolik yuz berdi');
    return false;
  }
};

// 🔹 Zaxiradan tiklash
export const restoreFromBackup = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      // Barcha ma'lumotlarni saqlash
      Object.keys(data).forEach(key => {
        if (data[key] !== null) {
          saveToLocalStorage(key, data[key]);
        }
      });
      
      callback(true);
    } catch (err) {
      console.error("Restore jarayonida xatolik:", err);
      callback(false);
    }
  };
  reader.readAsText(file);
};

// 🔹 Ma'lumotlarni tekshirish va boshlang'ich qiymatlarini o'rnatish
export const initializeData = () => {
  const initialData = {
    patients: [],
    appointments: [],
    medications: [],
    user: { 
      name: 'Doktor', 
      email: '', 
      phone: '', 
      specialty: 'Stomatolog', 
      bio: '' 
    },
    sidebarOpen: false,
    darkMode: false,
    fontSize: 16,
    layout: 'normal',
    billings: [],
    inventory: [],
    staff: []
  };

  // Har bir kalit uchun ma'lumotlarni tekshirish
  Object.keys(initialData).forEach(key => {
    const currentData = getFromLocalStorage(key);
    if (currentData === null || currentData === undefined) {
      saveToLocalStorage(key, initialData[key]);
    }
  });
};

// 🔹 Ma'lumotlarni to'liq tekshirish va validatsiya qilish
export const validatePatientData = (patient) => {
  const errors = [];
  
  if (!patient.name || patient.name.trim().length < 2) {
    errors.push('Ism kamida 2 belgidan iborat boʻlishi kerak');
  }
  
  if (!patient.phone || !/^\+998\d{9}$/.test(patient.phone)) {
    errors.push('Telefon raqami +998XXXXXXXXX formatida boʻlishi kerak');
  }
  
  if (patient.dob) {
    const birthDate = new Date(patient.dob);
    if (birthDate > new Date()) {
      errors.push('Tugʻilgan sana kelajakda boʻlishi mumkin emas');
    }
  }
  
  return errors;
};

// 🔹 Ma'lumotlarni tozalash
export const sanitizePatientData = (patient) => {
  return {
    ...patient,
    name: patient.name ? patient.name.trim() : '',
    phone: patient.phone ? patient.phone.trim() : '',
    address: patient.address ? patient.address.trim() : '',
    note: patient.note ? patient.note.trim() : '',
    gender: patient.gender || '',
    dob: patient.dob || '',
    lastVisit: patient.lastVisit || '',
    createdAt: patient.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// 🔹 Ma'lumotlarni yuklashda validatsiya qilish
export const validateStoredPatients = (patients) => {
  if (!Array.isArray(patients)) return [];
  
  return patients.filter(patient => {
    // Asosiy maydonlarni tekshirish
    return patient && 
           typeof patient === 'object' &&
           patient.id &&
           patient.name &&
           patient.phone &&
           /^\+998\d{9}$/.test(patient.phone);
  }).map(patient => ({
    // Eski ma'lumotlar bilan yangi maydonlarni birlashtirish
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    gender: patient.gender || '',
    address: patient.address || '',
    dob: patient.dob || '',
    lastVisit: patient.lastVisit || '',
    note: patient.note || '',
    createdAt: patient.createdAt || new Date().toISOString(),
    updatedAt: patient.updatedAt || new Date().toISOString()
  }));
};

// 🔹 Faqat bemorlarni eksport qilish
export const exportPatientsData = () => {
  try {
    const patients = getFromLocalStorage('patients', []);
    const blob = new Blob([JSON.stringify(patients, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `bemorlar_zaxira_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Bemorni eksport qilishda xatolik:", e);
    alert('Eksport qilishda xatolik yuz berdi');
    return false;
  }
};

// 🔹 Faqat bemorlarni import qilish
export const importPatientsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedPatients = JSON.parse(e.target.result);
      
      if (!Array.isArray(importedPatients)) {
        callback(false, "Import qilinayotgan fayl formati noto'g'ri");
        return;
      }
      
      // Ma'lumotlarni validatsiya qilish
      const validatedPatients = validateStoredPatients(importedPatients);
      
      if (validatedPatients.length === 0) {
        callback(false, "Faylda hech qanday yaroqli bemor ma'lumoti topilmadi");
        return;
      }
      
      // Joriy ma'lumotlar bilan birlashtirish
      const currentPatients = getFromLocalStorage('patients', []);
      const mergedPatients = [...currentPatients];
      
      validatedPatients.forEach(newPatient => {
        const existingIndex = mergedPatients.findIndex(p => p.id === newPatient.id);
        if (existingIndex >= 0) {
          // Yangi ma'lumot bilan almashtirish
          mergedPatients[existingIndex] = newPatient;
        } else {
          // Yangi qo'shish
          mergedPatients.push(newPatient);
        }
      });
      
      // Saqlash
      saveToLocalStorage('patients', mergedPatients);
      callback(true, `${validatedPatients.length} ta bemor muvaffaqiyatli import qilindi`);
      
    } catch (err) {
      console.error("Import jarayonida xatolik:", err);
      callback(false, "Faylni o'qishda xatolik. JSON formatini tekshiring.");
    }
  };
  reader.readAsText(file);
};