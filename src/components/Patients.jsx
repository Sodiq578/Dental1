import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import { validateStoredPatients, sanitizePatientData, validatePatientData } from '../utils';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiUser, FiPhone, FiMapPin, FiCalendar, FiInfo, FiDownload, FiX } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import './Patients.css';

// Regions data
const regions = {
  "Andijon viloyati": {
    "tumanlar": {
      "Andijon tumani": { "Tuman markazi": "Kuyganyor" },
      "Asaka tumani": { "Tuman markazi": "Asaka (shahar)" },
      "Baliqchi tumani": { "Tuman markazi": "Baliqchi (shahar)" },
      "Boʻston tumani": { "Tuman markazi": "Boʻston (shaharcha)" },
      "Buloqboshi tumani": { "Tuman markazi": "Buloqboshi" },
      "Izboskan tumani": { "Tuman markazi": "Poytugʻ" },
      "Jalaquduq tumani": { "Tuman markazi": "Jalaquduq" },
      "Xoʻjaobod tumani": { "Tuman markazi": "Xoʻjaobod" },
      "Qoʻrgʻontepa tumani": { "Tuman markazi": "Qoʻrgʻontepa" },
      "Marhamat tumani": { "Tuman markazi": "Marhamat" },
      "Oltinkoʻl tumani": { "Tuman markazi": "Oltinkoʻl (qishloq)" },
      "Paxtaobod tumani": { "Tuman markazi": "Paxtaobod" },
      "Shahrixon tumani": { "Tuman markazi": "Shahrixon (shahar)" },
      "Ulugʻnor tumani": { "Tuman markazi": "Oqoltin" }
    }
  },
  "Qoraqalpogʻiston": {
    "tumanlar": {
      "Amudaryo tumani": { "Tuman markazi": "Mangʻit (shahar)" },
      "Beruniy tumani": { "Tuman markazi": "Beruniy (shahar)" },
      "Chimboy tumani": { "Tuman markazi": "Chimboy" },
      "Ellikqalʼa tumani": { "Tuman markazi": "Boʻston (shahar)" },
      "Kegeyli tumani": { "Tuman markazi": "Kegeyli" },
      "Moʻynoq tumani": { "Tuman markazi": "Moʻynoq" },
      "Nukus tumani": { "Tuman markazi": "Oqmangʻit" },
      "Qanlikoʻl tumani": { "Tuman markazi": "Qanlikoʻl" },
      "Qoʻngʻirot tumani": { "Tuman markazi": "Qoʻngʻirot" },
      "Qoraoʻzak tumani": { "Tuman markazi": "Qoraoʻzak" },
      "Shumanay tumani": { "Tuman markazi": "Shumanay" },
      "Taxtakoʻpir tumani": { "Tuman markazi": "Taxtakoʻpir" },
      "Toʻrtkoʻl tumani": { "Tuman markazi": "Toʻrtkoʻl" },
      "Xoʻjayli tumani": { "Tuman markazi": "Xoʻjayli" },
      "Taxiatosh tumani": { "Tuman markazi": "Taxiatosh" },
      "Boʻzatov tumani": { "Tuman markazi": "Boʻzatov" }
    }
  },
  "Navoiy viloyati": {
    "tumanlar": {
      "Konimex tumani": { "Tuman markazi": "Konimex (shaharcha)" },
      "Karmana tumani": { "Tuman markazi": "Karmana" },
      "Qiziltepa tumani": { "Tuman markazi": "Qiziltepa" },
      "Xatirchi tumani": { "Tuman markazi": "Yangirabot" },
      "Navbahor tumani": { "Tuman markazi": "Beshrabot" },
      "Nurota tumani": { "Tuman markazi": "Nurota" },
      "Tomdi tumani": { "Tuman markazi": "Tomdibuloq" },
      "Uchquduq tumani": { "Tuman markazi": "Uchquduq" }
    }
  },
  "Buxoro viloyati": {
    "tumanlar": {
      "Olot tumani": { "Tuman markazi": "Olot" },
      "Buxoro tumani": { "Tuman markazi": "Galaosiyo" },
      "Gʻijduvon tumani": { "Tuman markazi": "Gʻijduvon" },
      "Jondor tumani": { "Tuman markazi": "Jondor (shaharcha)" },
      "Kogon tumani": { "Tuman markazi": "Kogon" },
      "Qorakoʻl tumani": { "Tuman markazi": "Qorakoʻl (shahar)" },
      "Qorovulbozor tumani": { "Tuman markazi": "Qorovulbozor" },
      "Peshku tumani": { "Tuman markazi": "Yangibozor" },
      "Romitan tumani": { "Tuman markazi": "Romitan" },
      "Shofirkon tumani": { "Tuman markazi": "Shofirkon" },
      "Vobkent tumani": { "Tuman markazi": "Vobkent" }
    }
  },
  "Farg'ona viloyati": {
    "tumanlar": {
      "Farg'ona tumani": { "Tuman markazi": "Farg'ona" },
      "Quva tumani": { "Tuman markazi": "Quva" },
      "Dang'ara tumani": { "Tuman markazi": "Dang'ara" },
      "Beshariq tumani": { "Tuman markazi": "Beshariq" },
      "Oltiariq tumani": { "Tuman markazi": "Oltiariq" },
      "Yazyavan tumani": { "Tuman markazi": "Yazyavan" },
      "Toshloq tumani": { "Tuman markazi": "Toshloq" },
      "Bog'dod tumani": { "Tuman markazi": "Bog'dod" },
      "Rishton tumani": { "Tuman markazi": "Rishton" },
      "Furqat tumani": { "Tuman markazi": "Furqat" },
      "O'zbekiston tumani": { "Tuman markazi": "O'zbekiston" }
    }
  },
  "Jizzax viloyati": {
    "tumanlar": {
      "Jizzax tumani": { "Tuman markazi": "Jizzax" },
      "Zafarobod tumani": { "Tuman markazi": "Zafarobod" },
      "Forish tumani": { "Tuman markazi": "Forish" },
      "Baxmal tumani": { "Tuman markazi": "Baxmal" },
      "G'allaorol tumani": { "Tuman markazi": "G'allaorol" },
      "Arnasoy tumani": { "Tuman markazi": "Arnasoy" },
      "Yangiobod tumani": { "Tuman markazi": "Yangiobod" },
      "Shahrisabz tumani": { "Tuman markazi": "Shahrisabz" }
    }
  },
  "Xorazm viloyati": {
    "tumanlar": {
      "Urganch tumani": { "Tuman markazi": "Urganch" },
      "Gurlan tumani": { "Tuman markazi": "Gurlan" },
      "Xiva tumani": { "Tuman markazi": "Xiva" },
      "Beruniy tumani": { "Tuman markazi": "Beruniy" },
      "Shovot tumani": { "Tuman markazi": "Shovot" },
      "Khiva tumani": { "Tuman markazi": "Khiva" },
      "Kungrad tumani": { "Tuman markazi": "Kungrad" },
      "Urganch shahar": { "Tuman markazi": "Urganch" }
    }
  },
  "Namangan viloyati": {
    "tumanlar": {
      "Namangan tumani": { "Tuman markazi": "Namangan" },
      "Chortoq tumani": { "Tuman markazi": "Chortoq" },
      "Kosonsoy tumani": { "Tuman markazi": "Kosonsoy" },
      "Mingbuloq tumani": { "Tuman markazi": "Mingbuloq" },
      "Tuproqqala tumani": { "Tuman markazi": "Tuproqqala" },
      "Uchqo'rg'on tumani": { "Tuman markazi": "Uchqo'rg'on" },
      "Yangiyo'l tumani": { "Tuman markazi": "Yangiyo'l" },
      "Kaspiy tumani": { "Tuman markazi": "Kaspiy" },
      "Chust tumani": { "Tuman markazi": "Chust" },
      "Peshku tumani": { "Tuman markazi": "Peshku" }
    }
  },
  "Surxondaryo viloyati": {
    "tumanlar": {
      "Termiz tumani": { "Tuman markazi": "Termiz" },
      "Oltinosy tumani": { "Tuman markazi": "Bo'ston" },
      "Angor tumani": { "Tuman markazi": "Angor" },
      "Sherobod tumani": { "Tuman markazi": "Sherobod" },
      "Boysun tumani": { "Tuman markazi": "Boysun" },
      "Jarkurgan tumani": { "Tuman markazi": "Jarkurgan" },
      "Uzun tumani": { "Tuman markazi": "Uzun" },
      "Sariosiyo tumani": { "Tuman markazi": "Sariosiyo" },
      "Qumqo'rg'on tumani": { "Tuman markazi": "Qumqo'rg'on" },
      "Muzrabot tumani": { "Tuman markazi": "Muzrabot" }
    }
  },
  "Samarqand viloyati": {
    "tumanlar": {
      "Samarqand tumani": { "Tuman markazi": "Samarqand" },
      "Paxtachi tumani": { "Tuman markazi": "Paxtachi" },
      "Ishtixon tumani": { "Tuman markazi": "Ishtixon" },
      "Jomboy tumani": { "Tuman markazi": "Jomboy" },
      "Narpay tumani": { "Tuman markazi": "Narpay" },
      "Kattaqo'rg'on tumani": { "Tuman markazi": "Kattaqo'rg'on" },
      "Oqdaryo tumani": { "Tuman markazi": "Oqdaryo" },
      "Pastdarg'om tumani": { "Tuman markazi": "Pastdarg'om" },
      "Urgut tumani": { "Tuman markazi": "Urgut" },
      "Samarkand shahar": { "Tuman markazi": "Samarqand" }
    }
  },
  "Sirdaryo viloyati": {
    "tumanlar": {
      "Guliston tumani": { "Tuman markazi": "Guliston" },
      "Sirdaryo tumani": { "Tuman markazi": "Sirdaryo" },
      "Mirzaobod tumani": { "Tuman markazi": "Mirzaobod" },
      "Boyovut tumani": { "Tuman markazi": "Boyovut" },
      "Shirin tumani": { "Tuman markazi": "Shirin" },
      "Oqoltin tumani": { "Tuman markazi": "Oqoltin" },
      "Xovos tumani": { "Tuman markazi": "Xovos" },
      "Yangiyer tumani": { "Tuman markazi": "Yangiyer" },
      "Arnasoy tumani": { "Tuman markazi": "Arnasoy" }
    }
  },
  "Toshkent shahri": {
    "tumanlar": {
      "Chilonzor tumani": { "Tuman markazi": "Chilonzor" },
      "Mirzo-Ulug'bek tumani": { "Tuman markazi": "Mirzo-Ulug'bek" },
      "Mirobod tumani": { "Tuman markazi": "Mirobod" },
      "Yunusobod tumani": { "Tuman markazi": "Yunusobod" },
      "Sergeli tumani": { "Tuman markazi": "Sergeli" },
      "Shayxontohur tumani": { "Tuman markazi": "Shayxontohur" },
      "Almazar tumani": { "Tuman markazi": "Almazar" },
      "Samarqand tumani": { "Tuman markazi": "Samarqand" },
      "Bektemir tumani": { "Tuman markazi": "Bektemir" },
      "Yakkasaroy tumani": { "Tuman markazi": "Yakkasaroy" }
    }
  },
  "Toshkent viloyati": {
    "tumanlar": {
      "Angren tumani": { "Tuman markazi": "Angren" },
      "Bekobod tumani": { "Tuman markazi": "Bekobod" },
      "Boʻstonliq tumani": { "Tuman markazi": "Gʻazalkent" },
      "Buka tumani": { "Tuman markazi": "Buka" },
      "Chirchiq tumani": { "Tuman markazi": "Chirchiq" },
      "Qibray tumani": { "Tuman markazi": "Qibray" },
      "Ohangaron tumani": { "Tuman markazi": "Ohangaron" },
      "Parkent tumani": { "Tuman markazi": "Parkent" },
      "Piskent tumani": { "Tuman markazi": "Piskent" },
      "Quyi Chirchiq tumani": { "Tuman markazi": "Doʻstobod" },
      "Yuqori Chirchiq tumani": { "Tuman markazi": "Yangibozor" },
      "Zangiota tumani": { "Tuman markazi": "Eshonguzar" }
    }
  },
  "Qashqadaryo viloyati": {
    "tumanlar": {
      "Qarshi tumani": { "Tuman markazi": "Qarshi" },
      "Chiroqchi tumani": { "Tuman markazi": "Chiroqchi" },
      "Gʻuzor tumani": { "Tuman markazi": "Gʻuzor" },
      "Dehqonobod tumani": { "Tuman markazi": "Dehqonobod" },
      "Qamashi tumani": { "Tuman markazi": "Qamashi" },
      "Koson tumani": { "Tuman markazi": "Koson" },
      "Mirishkor tumani": { "Tuman markazi": "Mirishkor" },
      "Muborak tumani": { "Tuman markazi": "Muborak" },
      "Nishon tumani": { "Tuman markazi": "Yanginazar" },
      "Shahrisabz tumani": { "Tuman markazi": "Shahrisabz" },
      "Yakkabogʻ tumani": { "Tuman markazi": "Yakkabogʻ" },
      "Kitob tumani": { "Tuman markazi": "Kitob" },
      "Kasbi tumani": { "Tuman markazi": "Kasbi" }
    }
  }
};

// Patients component
const Patients = () => {
  const { patients, setPatients, appointments, getFromLocalStorage } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [newPrescription, setNewPrescription] = useState({
    date: new Date().toISOString().slice(0, 10),
    medicine: '',
    dosage: '',
    notes: ''
  });
  const [selectedNote, setSelectedNote] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedExportFormat, setSelectedExportFormat] = useState('excel');
  // Address dropdown states
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [additionalAddress, setAdditionalAddress] = useState('');

  // Parse address when editing a patient
  useEffect(() => {
    if (currentPatient && currentPatient.address) {
      const [region, district, ...rest] = currentPatient.address.split(', ');
      setSelectedRegion(region || '');
      setSelectedDistrict(district || '');
      setAdditionalAddress(rest.join(', ') || '');
    } else {
      setSelectedRegion('');
      setSelectedDistrict('');
      setAdditionalAddress('');
    }
  }, [currentPatient]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  const openModal = (patient = null) => {
    setCurrentPatient(
      patient
        ? { ...patient, prescriptions: patient.prescriptions || [] }
        : {
            id: null,
            name: '',
            phone: '',
            gender: '',
            address: '',
            dob: '',
            lastVisit: '',
            note: '',
            prescriptions: []
          }
    );
    setNewPrescription({
      date: new Date().toISOString().slice(0, 10),
      medicine: '',
      dosage: '',
      notes: ''
    });
    setModalOpen(true);
    setError('');
    setSuccessMessage('');
  };

  const openNoteModal = (note, e) => {
    if (e) e.stopPropagation();
    setSelectedNote(note);
    setNoteModalOpen(true);
  };

  const openDetailsModal = (patient) => {
    setSelectedPatient({ ...patient, prescriptions: patient.prescriptions || [] });
    setDetailsModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setExportModalOpen(false);
    setNoteModalOpen(false);
    setDetailsModalOpen(false);
    setError('');
    setSuccessMessage('');
    setCurrentPatient(null);
    setSelectedRegion('');
    setSelectedDistrict('');
    setAdditionalAddress('');
  };

  const handlePrescriptionChange = (e) => {
    setNewPrescription({ ...newPrescription, [e.target.name]: e.target.value });
  };

  const addPrescription = (e) => {
    e.preventDefault();
    if (!newPrescription.medicine.trim() || !newPrescription.dosage.trim()) {
      setError('Dori nomi va dozasi majburiy');
      return;
    }
    setCurrentPatient({
      ...currentPatient,
      prescriptions: [...currentPatient.prescriptions, { ...newPrescription }]
    });
    setNewPrescription({
      date: new Date().toISOString().slice(0, 10),
      medicine: '',
      dosage: '',
      notes: ''
    });
    setError('');
  };

  const removePrescription = (index) => {
    const updatedPrescriptions = currentPatient.prescriptions.filter((_, i) => i !== index);
    setCurrentPatient({ ...currentPatient, prescriptions: updatedPrescriptions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Construct address from dropdowns and additional input
    const address = [selectedRegion, selectedDistrict, additionalAddress]
      .filter(Boolean)
      .join(', ');
    
    const updatedPatient = {
      ...currentPatient,
      address: address
    };
    
    const sanitizedPatient = sanitizePatientData(updatedPatient);
    
    const validationErrors = validatePatientData(sanitizedPatient);
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }
    
    let updated;
    if (sanitizedPatient.id) {
      updated = patients.map((p) => 
        p.id === sanitizedPatient.id ? sanitizedPatient : p
      );
      setSuccessMessage('Bemor ma\'lumotlari muvaffaqiyatli yangilandi');
    } else {
      const newPatient = { 
        ...sanitizedPatient, 
        id: Date.now(), 
        createdAt: new Date().toISOString() 
      };
      updated = [...patients, newPatient];
      setSuccessMessage('Yangi bemor muvaffaqiyatli qo‘shildi');
    }
    
    setPatients(validateStoredPatients(updated));
    
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const deletePatient = (id) => {
    if (window.confirm('Haqiqatan ham bu bemorni o‘chirmoqchimisiz?')) {
      if (appointments.some((a) => a.patientId === id)) {
        alert('Bu bemorning uchrashuvlari mavjud. Iltimos, avval uchrashuvlarni o‘chirib tashlang.');
        return;
      }
      const updated = patients.filter((p) => p.id !== id);
      setPatients(updated);
      setSuccessMessage('Bemor muvaffaqiyatli o‘chirildi');
      setTimeout(() => setSuccessMessage(''), 3000);
      closeModal();
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const performExport = async () => {
    if (selectedExportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(patients.map(p => ({
        ID: p.id,
        Ism: p.name,
        Telefon: p.phone,
        Jins: p.gender,
        Manzil: p.address,
        TugilganSana: p.dob,
        OxirgiTashrif: p.lastVisit,
        Izoh: p.note,
        Retseptlar: p.prescriptions ? p.prescriptions.map(pr => `${pr.date}: ${pr.medicine} (${pr.dosage}) - ${pr.notes || ''}`).join('; ') : '-',
        QoShilganSana: p.createdAt
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bemorlar");
      XLSX.writeFile(wb, "bemorlar.xlsx");
    } else if (selectedExportFormat === 'word') {
      const doc = new Document({
        sections: [{
          properties: {},
          children: patients.flatMap(p => [
            new Paragraph({ children: [new TextRun({ text: `ID: ${p.id}`, bold: true })] }),
            new Paragraph({ children: [new TextRun(`Ism: ${p.name || 'Noma\'lum'}`)] }),
            new Paragraph({ children: [new TextRun(`Telefon: ${p.phone || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Jins: ${p.gender || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Manzil: ${p.address || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Tug'ilgan sana: ${p.dob || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Oxirgi tashrif: ${p.lastVisit || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Izoh: ${p.note || '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Retseptlar: ${p.prescriptions ? p.prescriptions.map(pr => `${pr.date}: ${pr.medicine} (${pr.dosage}) - ${pr.notes || ''}`).join('\n') : '-'}`)] }),
            new Paragraph({ children: [new TextRun(`Qo'shilgan sana: ${p.createdAt || '-'}`)] }),
            new Paragraph({ children: [new TextRun("-----------------------------")] })
          ])
        }]
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bemorlar.docx';
      a.click();
      URL.revokeObjectURL(url);
    }
    setSuccessMessage('Ma\'lumotlar muvaffaqiyatli eksport qilindi');
    setTimeout(() => {
      setSuccessMessage('');
      closeModal();
    }, 3000);
  };

  const truncateNote = (note, maxLength = 30) => {
    if (!note) return '-';
    return note.length > maxLength ? `${note.slice(0, maxLength)}...` : note;
  };

  const truncatePrescriptions = (prescriptions, maxLength = 30) => {
    if (!prescriptions || prescriptions.length === 0) return '-';
    const summary = `${prescriptions.length} ta retsept`;
    return summary.length > maxLength ? `${summary.slice(0, maxLength)}...` : summary;
  };

  const calculateAge = (dob) => {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Telefon kiritilmagan';
    if (phone.startsWith('+998') && phone.length === 13) {
      return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('uz-UZ') : '-';
  };

  // Handle region change
  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setSelectedDistrict(''); // Reset district when region changes
  };

  // Get districts for the selected region
  const getDistricts = () => {
    return selectedRegion && regions[selectedRegion] ? Object.keys(regions[selectedRegion].tumanlar) : [];
  };

  return (
    <div className="patients">
      <div className="page-header">
        <h1>Bemorlar</h1>
        <span className="badge">{patients.length} ta</span>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="actions">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Ism yoki telefon raqami boʻyicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="action-buttons-group">
          <button onClick={() => openModal()} className="btn-primary">
            <FiPlus /> Yangi bemor
          </button>
          <button onClick={handleExport} className="btn-secondary" title="Eksport qilish">
            <FiDownload />
          </button>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="empty-state">
          {search ? (
            <>
              <h3>Hech narsa topilmadi</h3>
              <p>"{search}" boʻyicha hech qanday bemor topilmadi</p>
              <button onClick={() => setSearch('')} className="btn-secondary">
                Filterni tozalash
              </button>
            </>
          ) : (
            <>
              <h3>Hali bemorlar mavjud emas</h3>
              <p>Birinchi bemoringizni qoʻshing</p>
              <button onClick={() => openModal()} className="btn-primary">
                <FiPlus /> Yangi bemor qo'shish
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ism</th>
                <th>Telefon</th>
                <th>Yoshi</th>
                <th>Jinsi</th>
                <th>Oxirgi tashrif</th>
                <th>Izoh</th>
                <th>Retseptlar</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => openDetailsModal(p)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="patient-name">
                    <div className="patient-info">
                      <FiUser className="patient-icon" />
                      <span>{p.name || 'Noma\'lum'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="patient-info">
                      <FiPhone className="patient-icon" />
                      <span>{formatPhoneNumber(p.phone)}</span>
                    </div>
                  </td>
                  <td>{calculateAge(p.dob)}</td>
                  <td>{p.gender || '-'}</td>
                  <td>
                    {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('uz-UZ') : 'Tashrif yo\'q'}
                  </td>
                  <td>
                    {p.note ? (
                      <span
                        className="note-link"
                        onClick={(e) => openNoteModal(p.note, e)}
                        title="To‘liq izohni ko‘rish"
                      >
                        {truncateNote(p.note)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {truncatePrescriptions(p.prescriptions)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      <button
                        onClick={() => openModal(p)}
                        className="btn-edit"
                        title="Tahrirlash"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => deletePatient(p.id)}
                        className="btn-delete"
                        title="Oʻchirish"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Patient Modal */}
      {modalOpen && currentPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2>
                  {currentPatient.id ? 'Bemorni tahrirlash' : 'Yangi bemor qoʻshish'}
                </h2>
                <button type="button" onClick={closeModal} className="close-button">
                  &times;
                </button>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
              
              <div className="form-group">
                <label>
                  <FiUser className="input-icon" /> Ism va familiya *
                </label>
                <input
                  type="text"
                  placeholder="Bemorning ism va familiyasi"
                  value={currentPatient.name}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FiPhone className="input-icon" /> Telefon *
                </label>
                <input
                  type="tel"
                  placeholder="Telefon raqami"
                  value={currentPatient.phone}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, phone: e.target.value })
                  }
                  required
                />
                <div className="input-hint">Xalqaro formatda, masalan: +998 97 123 45 67 yoki chet el nomeri</div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Jinsi</label>
                  <select
                    value={currentPatient.gender}
                    onChange={(e) =>
                      setCurrentPatient({ ...currentPatient, gender: e.target.value })
                    }
                  >
                    <option value="">Tanlanmagan</option>
                    <option value="Erkak">Erkak</option>
                    <option value="Ayol">Ayol</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <FiCalendar className="input-icon" /> Tug'ilgan sana
                  </label>
                  <input
                    type="date"
                    value={currentPatient.dob}
                    onChange={(e) =>
                      setCurrentPatient({ ...currentPatient, dob: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FiMapPin className="input-icon" /> Manzil
                </label>
                <div className="form-row">
                  <div className="form-group">
                    <label>Viloyat</label>
                    <select
                      value={selectedRegion}
                      onChange={handleRegionChange}
                      required
                    >
                      <option value="">Viloyatni tanlang</option>
                      {Object.keys(regions).map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tuman</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      disabled={!selectedRegion}
                      required
                    >
                      <option value="">Tumanni tanlang</option>
                      {getDistricts().map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  placeholder="Qo‘shimcha manzil ma'lumotlari (ko‘cha, uy raqami va h.k.)"
                  value={additionalAddress}
                  onChange={(e) => setAdditionalAddress(e.target.value)}
                  rows="2"
                  className="address-details"
                />
              </div>

              <div className="form-group">
                <label>Oxirgi tashrif</label>
                <input
                  type="date"
                  value={currentPatient.lastVisit}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, lastVisit: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  <FiInfo className="input-icon" /> Izoh
                </label>
                <textarea
                  placeholder="Qo‘shimcha eslatmalar, allergiyalar, kasallik tarixi va h.k."
                  value={currentPatient.note}
                  onChange={(e) =>
                    setCurrentPatient({ ...currentPatient, note: e.target.value })
                  }
                  rows="4"
                />
              </div>

              {/* Prescriptions Section */}
              <div className="form-group">
                <label>Retseptlar (Davolash retsepti)</label>
                <div className="prescriptions-list">
                  {currentPatient.prescriptions.map((pr, index) => (
                    <div key={index} className="prescription-item">
                      <div>
                        <strong>{formatDate(pr.date)}:</strong> {pr.medicine} ({pr.dosage}) {pr.notes ? `- ${pr.notes}` : ''}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePrescription(index)}
                        className="btn-delete small"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="add-prescription">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sana</label>
                      <input
                        type="date"
                        name="date"
                        value={newPrescription.date}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Dori nomi *</label>
                      <input
                        type="text"
                        name="medicine"
                        placeholder="Dori nomi"
                        value={newPrescription.medicine}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Doza *</label>
                      <input
                        type="text"
                        name="dosage"
                        placeholder="Doza (masalan: 1 tabletka kuniga 2 marta)"
                        value={newPrescription.dosage}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Izoh</label>
                      <input
                        type="text"
                        name="notes"
                        placeholder="Qo'shimcha izoh"
                        value={newPrescription.notes}
                        onChange={handlePrescriptionChange}
                      />
                    </div>
                  </div>
                  <button type="button" onClick={addPrescription} className="btn-primary small">
                    <FiPlus /> Retsept qo'shish
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  {currentPatient.id ? 'Saqlash' : 'Qoʻshish'}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eksport formatini tanlang</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="form-group">
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="word">Word (.docx)</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={performExport} className="btn-primary">
                Eksport qilish
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bemor izohi</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="note-content">
              <p>{selectedNote}</p>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeModal} className="btn-secondary">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - New Style: Vertical list with sections */}
      {detailsModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bemor ma'lumotlari</h2>
              <button type="button" onClick={closeModal} className="close-button">
                &times;
              </button>
            </div>
            <div className="patient-details-new">
              <section className="detail-section">
                <h3>Asosiy ma'lumotlar</h3>
                <ul>
                  <li>
                    <span className="detail-label"><FiUser /> Ism va familiya:</span>
                    <span className="detail-value">{selectedPatient.name || 'Noma\'lum'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiPhone /> Telefon:</span>
                    <span className="detail-value">{formatPhoneNumber(selectedPatient.phone)}</span>
                  </li>
                  <li>
                    <span className="detail-label">Jinsi:</span>
                    <span className="detail-value">{selectedPatient.gender || '-'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiMapPin /> Manzil:</span>
                    <span className="detail-value">{selectedPatient.address || '-'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiCalendar /> Tug'ilgan sana:</span>
                    <span className="detail-value">{formatDate(selectedPatient.dob)}</span>
                  </li>
                  <li>
                    <span className="detail-label">Yoshi:</span>
                    <span className="detail-value">{calculateAge(selectedPatient.dob)}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiCalendar /> Oxirgi tashrif:</span>
                    <span className="detail-value">{selectedPatient.lastVisit ? formatDate(selectedPatient.lastVisit) : 'Hali tashrif yo\'q'}</span>
                  </li>
                  <li>
                    <span className="detail-label"><FiCalendar /> Qo'shilgan sana:</span>
                    <span className="detail-value">{formatDate(selectedPatient.createdAt)}</span>
                  </li>
                </ul>
              </section>
              
              {selectedPatient.note && (
                <section className="detail-section">
                  <h3>Izoh</h3>
                  <p className="detail-note-text">{selectedPatient.note}</p>
                </section>
              )}

              <section className="detail-section">
                <h3>Retseptlar</h3>
                {selectedPatient.prescriptions.length > 0 ? (
                  <ul className="prescriptions-list-new">
                    {selectedPatient.prescriptions.map((pr, index) => (
                      <li key={index}>
                        <strong>{formatDate(pr.date)}:</strong> {pr.medicine} ({pr.dosage}) {pr.notes ? `- ${pr.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Hali retseptlar yo'q</p>
                )}
              </section>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  closeModal();
                  openModal(selectedPatient);
                }}
                className="btn-primary"
              >
                Tahrirlash
              </button>
              <button
                onClick={() => deletePatient(selectedPatient.id)}
                className="btn-delete"
              >
                Oʻchirish
              </button>
              <button type="button" onClick={closeModal} className="btn-secondary">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;