import React, { useContext, useState } from "react";
import { AppContext } from "../App";
import { FiSearch, FiUser, FiCalendar, FiDollarSign, FiX, FiDownload } from "react-icons/fi";
import "./TreatmentHistory.css";

const TreatmentHistory = () => {
  const { patients, appointments, darkMode } = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Bemorlarni filtrlash
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  // Tanlangan bemorning uchrashuvlari
  const patientAppointments = selectedPatient 
    ? appointments.filter(app => app.patientId === selectedPatient.id)
    : [];

  return (
    <div className={`davolash-tarixi ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sarlavha */}
      <header className="">
        <div className=" ">
          <div className="sarlavha-ichki">
            <h1>
              <FiCalendar />
              Davolash Tarixi
            </h1>
            <p>Bemorlarning davolash jarayonlari va uchrashuvlari tarixi</p>
            <span className="badge">{patients.length} ta bemor</span>
          </div>
        </div>
      </header>

      {/* Asosiy kontent */}
      <div className="container">
        <main className="asosiy-kontent">
          {/* Filtr paneli */}
          <div className="filtr-paneli">
            <div className="filtr-ichki">
              <div className="qidiruv-guruhi">
                <label>Bemor qidirish</label>
                <div className="qidiruv-input">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Ism yoki telefon raqami bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="amal-tugmalari">
                <button className="tugma tugma-birlamchi">
                  <FiDownload />
                  Hisobot yuklab olish
                </button>
              </div>
            </div>
          </div>

          {/* Bemorlar ro'yxati */}
          <section className="bemorlar-royxati">
            <div className="royxat-sarlavha">
              <h2>Bemorlar Ro'yxati</h2>
              <span>{filteredPatients.length} ta topildi</span>
            </div>

            <div className="bemorlar-grid">
              {filteredPatients.map(patient => {
                const patientApps = appointments.filter(app => app.patientId === patient.id);
                const completedApps = patientApps.filter(app => app.status === 'completed').length;
                
                return (
                  <div
                    key={patient.id}
                    className={`bemor-karta ${selectedPatient?.id === patient.id ? 'tanlangan' : ''}`}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="bemor-sarlavha">
                      <div className="bemor-ikon-tarix">
                        <FiUser />
                      </div>
                      <div className="bemor-malumot">
                        <h3>{patient.name}</h3>
                        <p>{patient.phone}</p>
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
                          {patientApps.length > 0 ? 
                            new Date(patientApps[patientApps.length - 1].date).toLocaleDateString('uz-UZ') : 
                            'Yoʻq'
                          }
                        </span>
                        <span className="stat-label">Oxirgi uchrashuv</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* Modal oyna */}
      {isModalOpen && selectedPatient && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="tarix-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-sarlavha">
              <h2>{selectedPatient.name} - Davolash Tarixi</h2>
              <button className="yopish-tugmasi" onClick={() => setIsModalOpen(false)}>
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
                      </tr>
                    </thead>
                    <tbody>
                      {patientAppointments.map(app => (
                        <tr key={app.id}>
                          <td>{new Date(app.date).toLocaleDateString('uz-UZ')}</td>
                          <td>{app.time}</td>
                          <td>{app.procedure}</td>
                          <td>
                            <span className={`holat-badge holat-${app.status}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>{app.cost} UZS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bosh-holat">
                  <FiCalendar className="bosh-ikon" />
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