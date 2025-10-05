// src/TreatmentHistory.js
import React, { useContext, useState, useMemo } from "react";
import { AppContext } from "../App";
import { FiSearch, FiUser, FiCalendar, FiX, FiDownload, FiFileText } from "react-icons/fi";
import * as XLSX from "xlsx"; // Excel uchun
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from "docx"; // Word uchun
import { saveAs } from "file-saver"; // Faylni saqlash uchun

import "./TreatmentHistory.css";

const TreatmentHistory = () => {
  const { patients, appointments, darkMode } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // Format tanlash modali
  const [exportFormat, setExportFormat] = useState("excel"); // Tanlangan format (default: excel)
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(""); // "all" yoki "selected" eksport turi

  // Memoize filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  // Memoize patient appointments
  const patientAppointments = useMemo(() => {
    return selectedPatient
      ? appointments.filter((app) => String(app.patientId) === String(selectedPatient.id))
      : [];
  }, [appointments, selectedPatient]);

  // Clear search term
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Format tanlash modalini ochish
  const openExportModal = (type) => {
    if (type === "selected" && !selectedPatient) {
      alert("Iltimos, avval bemor tanlang!");
      return;
    }
    setExportType(type);
    setIsExportModalOpen(true);
  };

  // Excel faylini yaratish (tanlangan bemor uchun)
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
      {}, // Bo'sh qator
      ...worksheetData,
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Patient History");
    XLSX.writeFile(workbook, `patient_${patientData.name}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Word faylini yaratish (tanlangan bemor uchun)
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

  // Barcha bemorlar ro'yxatini Excel formatida eksport qilish
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

  // Barcha bemorlar ro'yxatini Word formatida eksport qilish
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

  // Handle export of patient history or all patients
  const handleExport = async () => {
    setIsExportModalOpen(false); // Modalni yopamiz
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

  // Format status for display
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

  return (
    <div className={`davolash-tarixi ${darkMode ? "dark-mode" : ""}`}>
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="sarlavha-ichki">
            <h1>
              <FiCalendar aria-hidden="true" /> Davolash Tarixi
            </h1>
            <p>Bemorlarning davolash jarayonlari va uchrashuvlari tarixi</p>
            <span className="badge">{patients.length} ta bemor</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container">
        <main className="asosiy-kontent">
          {/* Filter panel */}
          <div className="filtr-paneli">
            <div className="filtr-ichki">
              <div className="qidiruv-guruhi">
                <label htmlFor="search-input">Bemor qidirish</label>
                <div className="qidiruv-input">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Bemorlarni ism yoki telefon raqami bo'yicha qidirish"
                  />
                  {searchTerm && (
                    <button
                      className="tugma clear-search"
                      onClick={handleClearSearch}
                      aria-label="Qidiruvni tozalash"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              </div>

              <div className="amal-tugmalari">
                <button
                  className="tugma tugma-birlamchi"
                  onClick={() => openExportModal("all")}
                  disabled={isExporting}
                  aria-label="Barcha bemorlar ro'yxatini eksport qilish"
                >
                  <FiDownload /> {isExporting ? "Eksport qilinmoqda..." : "Bemorlar ro'yxatini eksport qilish"}
                </button>
                {selectedPatient && (
                  <button
                    className="tugma tugma-birlamchi"
                    onClick={() => openExportModal("selected")}
                    disabled={isExporting}
                    aria-label="Tanlangan bemor tarixini eksport qilish"
                  >
                    <FiFileText /> {isExporting ? "Eksport qilinmoqda..." : "Tanlangan bemor tarixini eksport qilish"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Patients list */}
          <section className="bemorlar-royxati">
            <div className="royxat-sarlavha">
              <h2>Bemorlar Ro'yxati</h2>
              <span>{filteredPatients.length} ta topildi</span>
            </div>

            <div className="bemorlar-grid">
              {filteredPatients.length === 0 ? (
                <div className="bosh-holat">
                  <FiUser className="bosh-ikon" aria-hidden="true" />
                  <h3>Bemorlar topilmadi</h3>
                  <p>Qidiruv shartlariga mos bemorlar mavjud emas</p>
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const patientApps = appointments.filter(
                    (app) => String(app.patientId) === String(patient.id)
                  );
                  const completedApps = patientApps.filter(
                    (app) => app.status === "amalga oshirildi"
                  ).length;

                  return (
                    <div
                      key={patient.id}
                      className={`bemor-karta ${selectedPatient?.id === patient.id ? "tanlangan" : ""}`}
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
                      <div className="bemor-sarlavha">
                        <div className="bemor-ikon-tarix">
                          <FiUser aria-hidden="true" />
                        </div>
                        <div className="bemor-malumot">
                          <h3>{patient.name}</h3>
                          {patient.dob && (
                            <p>Tug'ilgan sana: {new Date(patient.dob).toLocaleDateString("uz-UZ")}</p>
                          )}
                        </div>
                      </div>

                      <div className="bemor-statistika">
                        <div className="stat-element">
                          <span className="stat-raqam">{patientApps.length}</span>
                          <span className="stat-label">Jami uchrashuv</span>
                        </div>
                        <div className="stat-element">
                          <span className="stat-raqam">{completedApps}</span>
                          <span className="stat-label">Yakunlangan</span>
                        </div>
                        <div className="stat-element">
                          <span className="stat-raqam">
                            {patientApps.length > 0
                              ? new Date(patientApps[patientApps.length - 1].date).toLocaleDateString(
                                  "uz-UZ"
                                )
                              : "Yoʻq"}
                          </span>
                          <span className="stat-label">Oxirgi uchrashuv</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Export format selection modal */}
      {isExportModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsExportModalOpen(false)}
          role="dialog"
          aria-labelledby="export-modal-title"
        >
          <div className="tarix-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sarlavha">
              <h2 id="export-modal-title">Eksport formatini tanlang</h2>
              <button
                className="yopish-tugmasi"
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Modalni yopish"
              >
                <FiX />
              </button>
            </div>
            <div className="modal-tanasi">
              <label htmlFor="export-format">Formatni tanlang:</label>
              <select
                id="export-format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="excel">Excel</option>
                <option value="word">Word</option>
              </select>
              <div className="modal-tugmalar">
                <button
                  className="tugma tugma-birlamchi"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  Eksport qilish
                </button>
                <button
                  className="tugma tugma-ikkinchi"
                  onClick={() => setIsExportModalOpen(false)}
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for patient history */}
      {isModalOpen && selectedPatient && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-labelledby="modal-title"
        >
          <div className="tarix-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sarlavha">
              <h2 id="modal-title">{selectedPatient.name} - Davolash Tarixi</h2>
              <button
                className="yopish-tugmasi"
                onClick={() => setIsModalOpen(false)}
                aria-label="Modalni yopish"
              >
                <FiX />
              </button>
            </div>

            <div className="modal-tanasi">
              {patientAppointments.length > 0 ? (
                <div className="jadval-konteyner">
                  <table className="tarix-jadval">
                    <thead>
                      <tr>
                        <th>Sana</th>
                        <th>Vaqt</th>
                        <th>Protsedura</th>
                        <th>Holat</th>
                        <th>Narx</th>
                        <th>Retsept</th>
                        <th>Izoh</th>
                        <th>Keyingi kelish</th>
                        <th>Doktor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((app) => (
                          <tr key={app.id}>
                            <td>{new Date(app.date).toLocaleDateString("uz-UZ")}</td>
                            <td>{app.time}</td>
                            <td>{app.procedure}</td>
                            <td>
                              <span className={`holat-badge holat-${app.status}`}>
                                {getStatusLabel(app.status)}
                              </span>
                            </td>
                            <td>{app.cost ? `${app.cost} UZS` : "N/A"}</td>
                            <td>{app.prescription || "-"}</td>
                            <td>{app.notes || "-"}</td>
                            <td>
                              {app.nextVisit ? new Date(app.nextVisit).toLocaleDateString("uz-UZ") : "-"}
                            </td>
                            <td>{app.doctor || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bosh-holat">
                  <FiCalendar className="bosh-ikon" aria-hidden="true" />
                  <h3>Uchrashuvlar mavjud emas</h3>
                  <p>Ushbu bemor uchun hali hech qanday uchrashuv qayd etilmagan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentHistory;