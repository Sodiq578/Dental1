
// utils.js

// Initialize default data in localStorage with sample data
export const initializeData = () => {
  const initialData = {
    patients: [
      { id: 1, name: "Ali Valiev", phone: "+998901234567", gender: "Erkak", address: "Toshkent", dob: "1990-05-15", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, name: "Zilola Karimova", phone: "+998912345678", gender: "Ayol", address: "Samarqand", dob: "1985-08-22", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ],
    appointments: [
      { id: 1, patientId: 1, date: "2025-09-01", time: "10:00", procedure: "Tish tozalash", status: "Bajarildi", notes: "Yaxshi holatda", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, patientId: 1, date: "2025-09-10", time: "14:00", procedure: "Plomba", status: "Bajarildi", notes: "O'ng tish", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 3, patientId: 2, date: "2025-09-15", time: "11:30", procedure: "Tish tekshiruvi", status: "Kutilmoqda", notes: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ],
    medications: [],
    user: { name: "Doktor", email: "", phone: "", specialty: "Stomatolog", bio: "" },
    sidebarOpen: false,
    darkMode: false,
    fontSize: 16,
    layout: "normal",
    billings: [],
    inventory: [],
    staff: []
  };

  Object.keys(initialData).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initialData[key]));
    }
  });
};

// Retrieve data from localStorage
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

// Save data to localStorage
export const saveToLocalStorage = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`LocalStorage'ga ${key} saqlashda xatolik:`, error);
  }
};

// Backup all data
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

// Restore from backup
export const restoreFromBackup = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
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

// Sanitize patient data
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

// Validate patient data
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

// Validate stored patients
export const validateStoredPatients = (patients) => {
  if (!Array.isArray(patients)) return [];
  return patients.filter(patient => {
    return patient && 
           typeof patient === 'object' &&
           patient.id &&
           patient.name &&
           patient.phone &&
           /^\+998\d{9}$/.test(patient.phone);
  }).map(patient => ({
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

// Export patients
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

// Import patients
export const importPatientsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedPatients = JSON.parse(e.target.result);
      if (!Array.isArray(importedPatients)) {
        callback(false, "Import qilinayotgan fayl formati noto'g'ri");
        return;
      }
      const validatedPatients = validateStoredPatients(importedPatients);
      if (validatedPatients.length === 0) {
        callback(false, "Faylda hech qanday yaroqli bemor ma'lumoti topilmadi");
        return;
      }
      const currentPatients = getFromLocalStorage('patients', []);
      const mergedPatients = [...currentPatients];
      validatedPatients.forEach(newPatient => {
        const existingIndex = mergedPatients.findIndex(p => p.id === newPatient.id);
        if (existingIndex >= 0) {
          mergedPatients[existingIndex] = newPatient;
        } else {
          mergedPatients.push(newPatient);
        }
      });
      saveToLocalStorage('patients', mergedPatients);
      callback(true, `${validatedPatients.length} ta bemor muvaffaqiyatli import qilindi`);
    } catch (err) {
      console.error("Import jarayonida xatolik:", err);
      callback(false, "Faylni o'qishda xatolik. JSON formatini tekshiring.");
    }
  };
  reader.readAsText(file);
};

// Export appointments
export const exportAppointmentsData = () => {
  try {
    const appointments = getFromLocalStorage('appointments', []);
    const blob = new Blob([JSON.stringify(appointments, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uchrashuvlar_zaxira_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error("Uchrashuvlarni eksport qilishda xatolik:", e);
    alert('Eksport qilishda xatolik yuz berdi');
    return false;
  }
};

// Import appointments
export const importAppointmentsData = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedAppointments = JSON.parse(e.target.result);
      if (!Array.isArray(importedAppointments)) {
        callback(false, "Import qilinayotgan fayl formati noto'g'ri");
        return;
      }
      const validatedAppointments = importedAppointments.filter(app => 
        app && 
        app.id && 
        app.patientId && 
        app.date && 
        app.time && 
        app.procedure
      ).map(app => ({
        id: app.id,
        patientId: app.patientId,
        date: app.date,
        time: app.time,
        procedure: app.procedure,
        status: app.status || 'Kutilmoqda',
        nextVisit: app.nextVisit || '',
        phone: app.phone || '',
        notes: app.notes || '',
        createdAt: app.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      if (validatedAppointments.length === 0) {
        callback(false, "Faylda hech qanday yaroqli uchrashuv ma'lumoti topilmadi");
        return;
      }
      const currentAppointments = getFromLocalStorage('appointments', []);
      const mergedAppointments = [...currentAppointments];
      validatedAppointments.forEach(newApp => {
        const existingIndex = mergedAppointments.findIndex(a => a.id === newApp.id);
        if (existingIndex >= 0) {
          mergedAppointments[existingIndex] = newApp;
        } else {
          mergedAppointments.push(newApp);
        }
      });
      saveToLocalStorage('appointments', mergedAppointments);
      callback(true, `${validatedAppointments.length} ta uchrashuv muvaffaqiyatli import qilindi`);
    } catch (err) {
      console.error("Import jarayonida xatolik:", err);
      callback(false, "Faylni o'qishda xatolik. JSON formatini tekshiring.");
    }
  };
  reader.readAsText(file);
};
