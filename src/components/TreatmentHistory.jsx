import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { FiSearch, FiUser, FiCalendar, FiX, FiDownload, FiFileText } from "react-icons/fi";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx";
import { saveAs } from "file-saver";
import "./TreatmentHistory.css";

const TreatmentHistory = () => {
  const { patients, appointments, darkMode } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const patientAppointments = useMemo(() => {
    return selectedPatient
      ? appointments.filter((app) => String(app.patientId) === String(selectedPatient.id))
      : [];
  }, [appointments, selectedPatient]);

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const openExportModal = (type) => {
    if (type === "selected" && !selectedPatient) {
      alert("Iltimos, avval bemor tanlang!");
      return;
    }
    setExportType(type);
    setIsExportModalOpen(true);
  };

  const openDetailsModal = (app) => {
    setSelectedAppointment(app);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

  const exportToExcel = async (patientData) => {
    const worksheetData = patientAppointments.map((app) => ({
      Sana: new Date(app.date).toLocaleDateString("uz-UZ"),
      Vaqt: app.time,
      Protsedura: app.procedure,
      Holat: getStatusLabel(app.status),
      Narx: app.cost ? `${app.cost} UZS` : "N/A",
      Retsept: app.prescription || "-",
      Izoh: app.notes || "-",
      "Keyingi kelish": app.nextVisit ? new Date(app.nextVisit).toLocaleDateString("uz-UZ") : "-",
      Doktor: app.doctor || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet([
      { Bemor: patientData.name, Telefon: patientData.phone, "Tug'ilgan sana": patientData.dob || "-" },
      {},
      ...worksheetData,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient History");
    XLSX.writeFile(workbook, `patient_${patientData.name}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportToWord = async (patientData) => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: `${patientData.name} - Davolash Tarixi`,
              heading: "Heading1",
            }),
            new Paragraph({
              text: `Telefon: ${patientData.phone}`,
            }),
            new Paragraph({
              text: `Tug'ilgan sana: ${patientData.dob || "-"}`,
            }),
            new Paragraph({}),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Sana")] }),
                    new TableCell({ children: [new Paragraph("Vaqt")] }),
                    new TableCell({ children: [new Paragraph("Protsedura")] }),
                    new TableCell({ children: [new Paragraph("Holat")] }),
                    new TableCell({ children: [new Paragraph("Narx")] }),
                    new TableCell({ children: [new Paragraph("Retsept")] }),
                    new TableCell({ children: [new Paragraph("Izoh")] }),
                    new TableCell({ children: [new Paragraph("Keyingi kelish")] }),
                    new TableCell({ children: [new Paragraph("Doktor")] }),
                  ],
                }),
                ...patientAppointments.map(
                  (app) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(new Date(app.date).toLocaleDateString("uz-UZ"))],
                        }),
                        new TableCell({ children: [new Paragraph(app.time)] }),
                        new TableCell({ children: [new Paragraph(app.procedure)] }),
                        new TableCell({ children: [new Paragraph(getStatusLabel(app.status))] }),
                        new TableCell({ children: [new Paragraph(app.cost ? `${app.cost} UZS` : "N/A")] }),
                        new TableCell({ children: [new Paragraph(app.prescription || "-")] }),
                        new TableCell({ children: [new Paragraph(app.notes || "-")] }),
                        new TableCell({
                          children: [
                            new Paragraph(
                              app.nextVisit ? new Date(app.nextVisit).toLocaleDateString("uz-UZ") : "-"
                            ),
                          ],
                        }),
                        new TableCell({ children: [new Paragraph(app.doctor || "-")] }),
                      ],
                    })
                ),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `patient_${patientData.name}_${new Date().toISOString().split("T")[0]}.docx`);
  };

  const exportAllPatientsToExcel = async () => {
    const worksheetData = patients.map((patient) => {
      const patientApps = appointments.filter((app) => String(app.patientId) === String(patient.id));
      return {
        Bemor: patient.name,
        Telefon: patient.phone,
        "Tug'ilgan sana": patient.dob ? new Date(patient.dob).toLocaleDateString("uz-UZ") : "-",
        "Jami uchrashuvlar": patientApps.length,
        "Yakunlangan uchrashuvlar": patientApps.filter((app) => app.status === "amalga oshirildi").length,
        "Oxirgi uchrashuv": patientApps.length > 0
          ? new Date(patientApps[patientApps.length - 1].date).toLocaleDateString("uz-UZ")
          : "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Patients");
    XLSX.writeFile(workbook, `all_patients_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportAllPatientsToWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Barcha Bemorlar Ro'yxati",
              heading: "Heading1",
            }),
            new Paragraph({}),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Bemor")] }),
                    new TableCell({ children: [new Paragraph("Telefon")] }),
                    new TableCell({ children: [new Paragraph("Tug'ilgan sana")] }),
                    new TableCell({ children: [new Paragraph("Jami uchrashuvlar")] }),
                    new TableCell({ children: [new Paragraph("Yakunlangan uchrashuvlar")] }),
                    new TableCell({ children: [new Paragraph("Oxirgi uchrashuv")] }),
                  ],
                }),
                ...patients.map((patient) => {
                  const patientApps = appointments.filter((app) => String(app.patientId) === String(patient.id));
                  return new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(patient.name)] }),
                      new TableCell({ children: [new Paragraph(patient.phone)] }),
                      new TableCell({
                        children: [
                          new Paragraph(
                            patient.dob ? new Date(patient.dob).toLocaleDateString("uz-UZ") : "-"
                          ),
                        ],
                      }),
                      new TableCell({ children: [new Paragraph(patientApps.length.toString())] }),
                      new TableCell({
                        children: [
                          new Paragraph(
                            patientApps.filter((app) => app.status === "amalga oshirildi").length.toString()
                          ),
                        ],
                      }),
                      new TableCell({
                        children: [
                          new Paragraph(
                            patientApps.length > 0
                              ? new Date(patientApps[patientApps.length - 1].date).toLocaleDateString("uz-UZ")
                              : "-"
                          ),
                        ],
                      }),
                    ],
                  });
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `all_patients_${new Date().toISOString().split("T")[0]}.docx`);
  };

  const handleExport = async () => {
    setIsExportModalOpen(false);
    setIsExporting(true);

    try {
      if (exportType === "selected") {
        const patientData = {
          ...selectedPatient,
          appointments: patientAppointments,
        };
        if (exportFormat === "excel") {
          await exportToExcel(patientData);
        } else if (exportFormat === "word") {
          await exportToWord(patientData);
        }
        console.log(`✅ ${selectedPatient.name} uchun tarix eksport qilindi (${exportFormat})`);
      } else if (exportType === "all") {
        if (exportFormat === "excel") {
          await exportAllPatientsToExcel();
        } else if (exportFormat === "word") {
          await exportAllPatientsToWord();
        }
        console.log(`✅ Barcha bemorlar ro'yxati eksport qilindi (${exportFormat})`);
      }
    } catch (e) {
      console.error("💥 Eksport qilishda xato:", e);
      alert("Eksport qilishda xatolik yuz berdi");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "kutilmoqda":
        return "Kutilmoqda";
      case "amalga oshirildi":
        return "Amalga oshirildi";
      case "bekor qilindi":
        return "Bekor qilindi";
      default:
        return status;
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return "-";
    if (phone.startsWith("+998") && phone.length === 13) {
      return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5");
    }
    return phone;
  };

  return (
    <div className={`treatment-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="treatment-header">
        <h1>
          <FiCalendar aria-hidden="true" /> Davolash Tarixi
        </h1>
        <span className="treatment-count">{patients.length} ta bemor</span>
      </div>

      <div className="treatment-controls">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            id="search-input"
            type="text"
            placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-field"
            aria-label="Bemorlarni ism yoki telefon raqami bo'yicha qidirish"
          />
          {searchTerm && (
            <button
              className="action-button clear-search"
              onClick={handleClearSearch}
              aria-label="Qidiruvni tozalash"
            >
              <FiX />
            </button>
          )}
        </div>
        <div className="action-buttons">
          <button
            className="primary-button"
            onClick={() => openExportModal("all")}
            disabled={isExporting}
            aria-label="Barcha bemorlar ro'yxatini eksport qilish"
          >
            <FiDownload /> {isExporting ? "Eksport qilinmoqda..." : "Bemorlar ro'yxatini eksport qilish"}
          </button>
          {selectedPatient && (
            <button
              className="primary-button"
              onClick={() => openExportModal("selected")}
              disabled={isExporting}
              aria-label="Tanlangan bemor tarixini eksport qilish"
            >
              <FiFileText /> {isExporting ? "Eksport qilinmoqda..." : "Tanlangan bemor tarixini eksport qilish"}
            </button>
          )}
        </div>
      </div>

      <section className="patients-section">
        <div className="section-header">
          <h2>Bemorlar Ro'yxati</h2>
          <span>{filteredPatients.length} ta topildi</span>
        </div>

        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <FiUser className="empty-icon" aria-hidden="true" />
            <h3>Bemorlar topilmadi</h3>
            <p>Qidiruv shartlariga mos bemorlar mavjud emas</p>
          </div>
        ) : (
          <div className="patients-grid">
            {filteredPatients.map((patient) => {
              const patientApps = appointments.filter(
                (app) => String(app.patientId) === String(patient.id)
              );
              const completedApps = patientApps.filter(
                (app) => app.status === "amalga oshirildi"
              ).length;

              return (
                <div
                  key={patient.id}
                  className={`patient-card ${selectedPatient?.id === patient.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedPatient(patient);
                    setIsModalOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedPatient(patient);
                      setIsModalOpen(true);
                    }
                  }}
                  aria-label={`Bemor ${patient.name} tarixini ko'rish`}
                >
                  <div className="patient-header">
                    <FiUser className="patient-icon" aria-hidden="true" />
                    <div className="patient-info">
                      <h3>{patient.name}</h3>
                      <p>{formatPhoneNumber(patient.phone)}</p>
                      {patient.dob && (
                        <p>Tug'ilgan sana: {new Date(patient.dob).toLocaleDateString("uz-UZ")}</p>
                      )}
                    </div>
                  </div>
                  <div className="patient-stats">
                    <div className="stat-item">
                      <span className="stat-number">{patientApps.length}</span>
                      <span className="stat-label">Jami uchrashuv</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{completedApps}</span>
                      <span className="stat-label">Yakunlangan</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">
                        {patientApps.length > 0
                          ? new Date(patientApps[patientApps.length - 1].date).toLocaleDateString("uz-UZ")
                          : "-"}
                      </span>
                      <span className="stat-label">Oxirgi uchrashuv</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {isExportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eksport formatini tanlang</h2>
              <button
                className="modal-close-button"
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Modalni yopish"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="export-format" className="input-label">Formatni tanlang:</label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="excel">Excel</option>
                  <option value="word">Word</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  className="primary-button"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  Eksport qilish
                </button>
                <button
                  className="action-button"
                  onClick={() => setIsExportModalOpen(false)}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPatient.name} - Davolash Tarixi</h2>
              <button
                className="modal-close-button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Modalni yopish"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {patientAppointments.length > 0 ? (
                <div className="history-list">
                  {patientAppointments
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((app) => (
                      <div
                        key={app.id}
                        className="history-item"
                        onClick={() => openDetailsModal(app)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            openDetailsModal(app);
                          }
                        }}
                        aria-label={`Uchrashuv tafsilotlarini ko'rish - ${app.procedure}`}
                      >
                        <p><strong>Sana:</strong> {new Date(app.date).toLocaleDateString("uz-UZ")}</p>
                        <p><strong>Vaqt:</strong> {app.time}</p>
                        <p><strong>Protsedura:</strong> {app.procedure}</p>
                        <p>
                          <strong>Holat:</strong>{" "}
                          <span className={`status-tag status-${app.status}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiCalendar className="empty-icon" aria-hidden="true" />
                  <h3>Uchrashuvlar mavjud emas</h3>
                  <p>Ushbu bemor uchun hali hech qanday uchrashuv qayd etilmagan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedAppointment && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="details-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <h2>Uchrashuv tafsilotlari</h2>
              <button
                className="details-close-button"
                onClick={closeDetailsModal}
                aria-label="Modalni yopish"
              >
                <FiX />
              </button>
            </div>
            <div className="details-modal-body">
              <p><strong>Bemor:</strong> {selectedPatient.name}</p>
              <p><strong>Telefon:</strong> {formatPhoneNumber(selectedPatient.phone)}</p>
              <p><strong>Sana:</strong> {new Date(selectedAppointment.date).toLocaleDateString("uz-UZ")}</p>
              <p><strong>Vaqt:</strong> {selectedAppointment.time}</p>
              <p><strong>Protsedura:</strong> {selectedAppointment.procedure}</p>
              <p><strong>Holat:</strong> {getStatusLabel(selectedAppointment.status)}</p>
              <p><strong>Narx:</strong> {selectedAppointment.cost ? `${selectedAppointment.cost} UZS` : "N/A"}</p>
              <p><strong>Retsept:</strong> {selectedAppointment.prescription || "-"}</p>
              <p><strong>Izoh:</strong> {selectedAppointment.notes || "-"}</p>
              <p><strong>Keyingi kelish:</strong> {selectedAppointment.nextVisit ? new Date(selectedAppointment.nextVisit).toLocaleDateString("uz-UZ") : "-"}</p>
              <p><strong>Doktor:</strong> {selectedAppointment.doctor || "-"}</p>
              <p><strong>Yaratilgan sana:</strong> {new Date(selectedAppointment.createdAt).toLocaleString()}</p>
              <p><strong>Yangilangan sana:</strong> {selectedAppointment.updatedAt ? new Date(selectedAppointment.updatedAt).toLocaleString() : "-"}</p>
            </div>
            <div className="modal-actions">
              <button onClick={closeDetailsModal} className="action-button">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;