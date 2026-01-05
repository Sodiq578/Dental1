import React, { useState, useRef } from "react";
import { 
  FaFilePdf, 
  FaFileImage, 
  FaFolder, 
  FaEye, 
  FaDownload, 
  FaUpload, 
  FaTrash, 
  FaTimes, 
  FaSearch, 
  FaFilter, 
  FaCalendarAlt, 
  FaUserMd, 
  FaSortAmountDown, 
  FaSortAmountUp,
  FaFileWord,
  FaFileExcel,
  FaFileMedicalAlt,
  FaStethoscope,
  FaUser,
  FaUserTie,
  FaCalendarDay,
  FaFile,
  FaRegFilePdf,
  FaRegFileImage,
  FaRegFileWord,
  FaRegFileExcel,
  FaRegFileMedical,
  FaRegFolder,
  FaRegFolderOpen,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCloudUploadAlt,
  FaPaperclip,
  FaTag,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";
import './Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([
    { 
      id: 1, 
      name: "Rentgen 2025-01", 
      type: "X-Ray", 
      date: "2025-01-15", 
      patientName: "Hasan Alimov", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Yuqori jag' rentgeni, to'liq tahlil qilingan", 
      uploadedBy: "Dr. Ali Valiyev", 
      fileSize: "2.4 MB", 
      tags: ["Rentgen", "Tibbiy", "Jag"] 
    },
    { 
      id: 2, 
      name: "Qon tahlili natijalari", 
      type: "Lab", 
      date: "2025-01-10", 
      patientName: "Zarina Nazarova", 
      doctorName: "Dr. Ali Valiyev", 
      description: "To'liq qon tahlili, barcha ko'rsatkichlar normal", 
      uploadedBy: "Dr. Ali Valiyev", 
      fileSize: "1.2 MB", 
      tags: ["Tahlil", "Lab", "Qon"] 
    },
    { 
      id: 3, 
      name: "Shartnoma №1245", 
      type: "PDF", 
      date: "2024-12-01", 
      patientName: "Bekzod Rasulov", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Davolanish shartnomasi va roziliknoma", 
      uploadedBy: "Admin Botir Xo'jayev", 
      fileSize: "850 KB", 
      tags: ["Shartnoma", "Rasmiy", "Hujjat"] 
    },
    { 
      id: 4, 
      name: "Bemor tibbiy yozuvlari", 
      type: "Folder", 
      date: "2025-01-20", 
      patientName: "Madina Xolmirzayeva", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Bemorning to'liq tibbiy tarixi va davolanish jarayoni", 
      uploadedBy: "Dr. Ali Valiyev", 
      fileSize: "4.7 MB", 
      tags: ["Tarix", "Arxiv", "Bemor"] 
    },
    { 
      id: 5, 
      name: "Stomatologik tahlil", 
      type: "PDF", 
      date: "2025-01-18", 
      patientName: "Javohir To'rayev", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Tishlar holati tahlili va tavsiyalar", 
      uploadedBy: "Dr. Ali Valiyev", 
      fileSize: "1.8 MB", 
      tags: ["Tish", "Tahlil", "Stomatologiya"] 
    },
    { 
      id: 6, 
      name: "MRI skanerlash", 
      type: "Image", 
      date: "2025-01-22", 
      patientName: "Sardor Qodirov", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Bosh MRI tasviri, 3D rekonstruksiya", 
      uploadedBy: "Dr. Ali Valiyev", 
      fileSize: "8.5 MB", 
      tags: ["MRI", "Tasvir", "Diagnostika"] 
    },
    { 
      id: 7, 
      name: "Xarajatlar hisoboti", 
      type: "Excel", 
      date: "2025-01-25", 
      patientName: "Dilshod Axmedov", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Oylik xarajatlar hisoboti va statistik ma'lumotlar", 
      uploadedBy: "Admin Botir Xo'jayev", 
      fileSize: "650 KB", 
      tags: ["Hisobot", "Moliya", "Excel"] 
    },
    { 
      id: 8, 
      name: "Tish rentgeni panorama", 
      type: "X-Ray", 
      date: "2025-01-28", 
      patientName: "Fotima Yusupova", 
      doctorName: "Dr. Ali Valiyev", 
      description: "Panoramik tish rentgeni, barcha tishlar ko'rinishi", 
      uploadedBy: "Dr. Ali Valiyev", 
      fileSize: "3.2 MB", 
      tags: ["Rentgen", "Tish", "Panoramik"] 
    }
  ]);

  const currentUser = { id: 1, name: "Dr. Ali Valiyev", role: "doctor" };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newDocument, setNewDocument] = useState({ 
    name: "", 
    type: "PDF", 
    patientName: "", 
    doctorName: "", 
    description: "", 
    file: null 
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: "all", label: "Barchasi", icon: <FaFolder className="inline mr-2" /> },
    { value: "PDF", label: "PDF", icon: <FaFilePdf className="inline mr-2" /> },
    { value: "Image", label: "Rasmlar", icon: <FaFileImage className="inline mr-2" /> },
    { value: "Word", label: "Word", icon: <FaFileWord className="inline mr-2" /> },
    { value: "Excel", label: "Excel", icon: <FaFileExcel className="inline mr-2" /> },
    { value: "X-Ray", label: "Rentgen", icon: <FaFileMedicalAlt className="inline mr-2" /> },
    { value: "Lab", label: "Lab Tahlil", icon: <FaStethoscope className="inline mr-2" /> },
    { value: "Folder", label: "Papkalar", icon: <FaRegFolderOpen className="inline mr-2" /> }
  ];

  const addDocument = (newDoc) => {
    setDocuments(prev => [...prev, newDoc]);
    console.log("Yangi hujjat qo'shildi:", newDoc);
  };

  const addAuditLog = (log) => {
    console.log("Audit log:", log);
  };

  const handleAddDocument = () => {
    if (!newDocument.name.trim()) {
      alert("Iltimos, hujjat nomini kiriting");
      return;
    }

    const newDoc = {
      id: Date.now(),
      name: newDocument.name.trim(),
      type: newDocument.type,
      date: new Date().toISOString().split('T')[0],
      patientName: newDocument.patientName.trim() || "—",
      doctorName: newDocument.doctorName.trim() || currentUser.name,
      description: newDocument.description.trim() || "Tavsif kiritilmagan",
      uploadedBy: currentUser.name,
      fileSize: newDocument.file ? `${(newDocument.file.size / 1024 / 1024).toFixed(1)} MB` : "0.5 MB",
      tags: getTagsForType(newDocument.type)
    };

    addDocument(newDoc);
    addAuditLog({ 
      action: "document_upload", 
      documentId: newDoc.id,
      documentName: newDoc.name,
      timestamp: new Date().toISOString()
    });

    // Reset form
    setNewDocument({ 
      name: "", 
      type: "PDF", 
      patientName: "", 
      doctorName: "", 
      description: "", 
      file: null 
    });
    setShowUploadModal(false);
    alert("✅ Hujjat muvaffaqiyatli yuklandi!");
  };

  const getTagsForType = (type) => {
    switch(type) {
      case "X-Ray": return ["Rentgen", "Tibbiy", "Tasvir"];
      case "Lab": return ["Tahlil", "Lab", "Qon"];
      case "PDF": return ["Hujjat", "Rasmiy"];
      case "Image": return ["Tasvir", "Rasm"];
      case "Word": return ["Hujjat", "Matn"];
      case "Excel": return ["Hisobot", "Jadval"];
      case "Folder": return ["Papka", "Arxiv"];
      default: return ["Boshqa"];
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setShowPreview(true);
    addAuditLog({
      action: "document_view",
      documentId: doc.id,
      documentName: doc.name,
      timestamp: new Date().toISOString()
    });
  };

  const handleDownloadDocument = (doc) => {
    // Create a fake blob to simulate download
    const content = `Hujjat: ${doc.name}\nTuri: ${doc.type}\nSana: ${doc.date}\nBemor: ${doc.patientName}\nTavsif: ${doc.description}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addAuditLog({
      action: "document_download",
      documentId: doc.id,
      documentName: doc.name,
      timestamp: new Date().toISOString()
    });
    
    alert(`📥 "${doc.name}" hujjati yuklab olindi!`);
  };

  const handleDeleteDocument = (id, name) => {
    if (window.confirm(`"${name}" hujjatini rostdan ham o'chirmoqchimisiz?`)) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      addAuditLog({
        action: "document_delete",
        documentId: id,
        documentName: name,
        timestamp: new Date().toISOString()
      });
      alert("🗑️ Hujjat o'chirildi!");
    }
  };

  const filteredDocuments = documents
    .filter(doc => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = search === "" || 
        doc.name.toLowerCase().includes(search) ||
        doc.patientName.toLowerCase().includes(search) ||
        doc.description.toLowerCase().includes(search) ||
        doc.tags.some(tag => tag.toLowerCase().includes(search));
      
      const matchesType = filterType === "all" || doc.type === filterType;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const getFileType = (file) => {
    if (!file) return "PDF";
    
    if (file.type.includes('pdf')) return "PDF";
    if (file.type.includes('image')) return "Image";
    if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) return "Word";
    if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) return "Excel";
    if (file.name.toLowerCase().includes('xray') || file.name.toLowerCase().includes('rentgen')) return "X-Ray";
    if (file.name.toLowerCase().includes('lab') || file.name.toLowerCase().includes('tahlil')) return "Lab";
    
    return "PDF";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    
    const fileType = getFileType(file);
    
    setNewDocument(prev => ({
      ...prev,
      file: file,
      name: file.name.replace(/\.[^/.]+$/, ""),
      type: fileType
    }));
  };

  const getDocumentIcon = (type, size = "default") => {
    const iconSize = size === "large" ? "3rem" : size === "small" ? "1rem" : "2.5rem";
    const iconStyle = { fontSize: iconSize };
    
    switch (type) {
      case "PDF": return <FaFilePdf className="doc-icon doc-icon-pdf" style={iconStyle} />;
      case "Image": return <FaFileImage className="doc-icon doc-icon-image" style={iconStyle} />;
      case "Word": return <FaFileWord className="doc-icon doc-icon-word" style={iconStyle} />;
      case "Excel": return <FaFileExcel className="doc-icon doc-icon-excel" style={iconStyle} />;
      case "X-Ray": return <FaFileMedicalAlt className="doc-icon doc-icon-xray" style={iconStyle} />;
      case "Lab": return <FaStethoscope className="doc-icon doc-icon-lab" style={iconStyle} />;
      case "Folder": return <FaFolder className="doc-icon doc-icon-folder" style={iconStyle} />;
      default: return <FaFile className="doc-icon doc-icon-default" style={iconStyle} />;
    }
  };

  const getDocumentColor = (type) => {
    switch (type) {
      case "PDF": return "doc-card-pdf";
      case "Image": return "doc-card-image";
      case "Word": return "doc-card-word";
      case "Excel": return "doc-card-excel";
      case "X-Ray": return "doc-card-xray";
      case "Lab": return "doc-card-lab";
      case "Folder": return "doc-card-folder";
      default: return "doc-card-default";
    }
  };

  const formatFileSize = (size) => {
    if (!size) return "—";
    return size;
  };

  const getSortIcon = () => {
    if (sortOrder === "desc") {
      return <FaSortDown className="ml-1" />;
    } else {
      return <FaSortUp className="ml-1" />;
    }
  };

  return (
    <div className="documents-container">
      {/* Header */}
      <div className="documents-header">
        <div className="header-main">
          <div className="header-icon">
            <FaFolder className="icon-large" />
          </div>
          <div>
            <h1 className="header-title">📁 Hujjatlar Boshqaruvi</h1>
            <p className="header-subtitle">Barcha tibbiy hujjatlar, rentgenlar va tahlillar markazi</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <FaUserMd className="stat-icon" />
            <div>
              <span className="stat-label">Jami hujjatlar</span>
              <span className="stat-value">{documents.length}</span>
            </div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <FaCalendarAlt className="stat-icon" />
            <div>
              <span className="stat-label">Oxirgi yangilanish</span>
              <span className="stat-value">{new Date().toLocaleDateString('uz-UZ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <div className="search-container">
          <div className="search-icon">
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder="Hujjat nomi, bemor yoki tahlil bo'yicha qidiring..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm("")}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="control-buttons">
          <div className="filter-dropdown">
            <FaFilter className="filter-icon" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="sort-button"
          >
            <FaSort className="sort-icon" />
            {sortOrder === "desc" ? "Yangidan" : "Eskidan"}
            {getSortIcon()}
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="upload-button"
          >
            <FaCloudUploadAlt className="upload-icon" />
            Yangi hujjat
          </button>
        </div>
      </div>

      {/* Active Filters */}
      <div className="active-filters">
        <div className="filters-label">
          <FaFilter className="filter-small-icon" />
          <span>Faol filtrlash:</span>
        </div>
        <div className="filters-tags">
          {filterType !== "all" && (
            <div className="filter-tag">
              {documentTypes.find(t => t.value === filterType)?.icon}
              <span>{documentTypes.find(t => t.value === filterType)?.label}</span>
              <button 
                onClick={() => setFilterType("all")}
                className="filter-tag-remove"
              >
                <FaTimes />
              </button>
            </div>
          )}
          {searchTerm && (
            <div className="filter-tag">
              <FaSearch className="search-small-icon" />
              <span>"{searchTerm}"</span>
              <button 
                onClick={() => setSearchTerm("")}
                className="filter-tag-remove"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
        <div className="results-count">
          {filteredDocuments.length} ta natija topildi
        </div>
      </div>

      {/* Documents Grid */}
      <div className="documents-grid">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className={`document-card ${getDocumentColor(doc.type)}`}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="card-type-badge">
                  {getDocumentIcon(doc.type, "small")}
                  <span className="type-label">{doc.type}</span>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id, doc.name)}
                  className="delete-button"
                  title="O'chirish"
                >
                  <FaTrash />
                </button>
              </div>

              {/* Card Icon and Title */}
              <div className="card-icon-title">
                {getDocumentIcon(doc.type)}
                <div className="card-title-section">
                  <h3 className="document-title">{doc.name}</h3>
                  <div className="document-meta">
                    <span className="file-size">
                      <FaPaperclip className="meta-icon" />
                      {formatFileSize(doc.fileSize)}
                    </span>
                    <span className="upload-date">
                      <FaCalendarDay className="meta-icon" />
                      {doc.date}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div className="document-details">
                <div className="detail-row">
                  <FaUser className="detail-icon patient-icon" />
                  <div>
                    <div className="detail-label">Bemor</div>
                    <div className="detail-value">{doc.patientName}</div>
                  </div>
                </div>
                <div className="detail-row">
                  <FaUserTie className="detail-icon doctor-icon" />
                  <div>
                    <div className="detail-label">Shifokor</div>
                    <div className="detail-value">{doc.doctorName}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {doc.description && (
                <div className="document-description">
                  <FaInfoCircle className="description-icon" />
                  <p className="description-text">{doc.description}</p>
                </div>
              )}

              {/* Tags */}
              <div className="document-tags">
                <FaTag className="tags-icon" />
                {doc.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="card-actions">
                <button
                  onClick={() => handleViewDocument(doc)}
                  className="action-button view-button"
                >
                  <FaEye className="action-icon" />
                  Ko'rish
                </button>
                <button
                  onClick={() => handleDownloadDocument(doc)}
                  className="action-button download-button"
                >
                  <FaDownload className="action-icon" />
                  Yuklash
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaRegFolderOpen />
            </div>
            <h3 className="empty-title">Hujjatlar topilmadi</h3>
            <p className="empty-message">
              {searchTerm 
                ? `"${searchTerm}" bo'yicha hech qanday natija topilmadi` 
                : "Hozircha bu papkada hech qanday hujjat yo'q"}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="empty-action-button"
            >
              <FaUpload className="mr-2" />
              Birinchi hujjatni yuklash
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="statistics-cards">
        <div className="stat-card total-card">
          <div className="stat-card-icon total-icon">
            <FaFolder />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{documents.length}</div>
            <div className="stat-card-label">Jami hujjatlar</div>
          </div>
        </div>

        <div className="stat-card pdf-card">
          <div className="stat-card-icon pdf-icon">
            <FaFilePdf />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {documents.filter(d => d.type === "PDF").length}
            </div>
            <div className="stat-card-label">PDF fayllar</div>
          </div>
        </div>

        <div className="stat-card xray-card">
          <div className="stat-card-icon xray-icon">
            <FaFileMedicalAlt />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {documents.filter(d => d.type === "X-Ray").length}
            </div>
            <div className="stat-card-label">Rentgenlar</div>
          </div>
        </div>

        <div className="stat-card lab-card">
          <div className="stat-card-icon lab-icon">
            <FaStethoscope />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {documents.filter(d => d.type === "Lab").length}
            </div>
            <div className="stat-card-label">Lab tahlillar</div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <FaCloudUploadAlt />
                </div>
                <div>
                  <h2 className="modal-title">Yangi hujjat yuklash</h2>
                  <p className="modal-subtitle">
                    Tibbiy hujjatlar, rentgen, tahlil yoki shartnoma yuklang
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Drop Zone */}
            <div
              className={`dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="dropzone-icon">
                <FaCloudUploadAlt />
              </div>
              <div className="dropzone-content">
                <h3 className="dropzone-title">Faylni bu yerga torting yoki bosing</h3>
                <p className="dropzone-subtitle">
                  PDF, JPG, PNG, DOCX, XLSX formatlari qo'llab-quvvatlanadi
                </p>
              </div>
              <button className="dropzone-button">
                <FaUpload className="mr-2" />
                Fayl tanlash
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              />
            </div>

            {/* Selected File Preview */}
            {newDocument.file && (
              <div className="selected-file">
                <div className="selected-file-icon">
                  {getDocumentIcon(newDocument.type)}
                </div>
                <div className="selected-file-info">
                  <div className="selected-file-name">{newDocument.file.name}</div>
                  <div className="selected-file-meta">
                    {(newDocument.file.size / 1024 / 1024).toFixed(2)} MB • {newDocument.type}
                  </div>
                </div>
                <button 
                  onClick={() => setNewDocument(prev => ({ ...prev, file: null }))}
                  className="selected-file-remove"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Form */}
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">
                  Hujjat nomi <span className="required">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Rentgen 2025-01"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hujjat turi</label>
                <div className="type-select-wrapper">
                  <FaFile className="select-icon" />
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value }))}
                    className="type-select"
                  >
                    {documentTypes.slice(1).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <FaUser className="label-icon" />
                    Bemor ismi
                  </label>
                  <input
                    type="text"
                    placeholder="Bemor ismini kiriting"
                    value={newDocument.patientName}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, patientName: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaUserTie className="label-icon" />
                    Shifokor ismi
                  </label>
                  <input
                    type="text"
                    placeholder="Shifokor ismini kiriting"
                    value={newDocument.doctorName}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaInfoCircle className="label-icon" />
                  Tavsif
                </label>
                <textarea
                  placeholder="Hujjat haqida qo'shimcha ma'lumot..."
                  value={newDocument.description}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  rows="3"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button
                onClick={() => setShowUploadModal(false)}
                className="modal-button cancel-button"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAddDocument}
                disabled={!newDocument.name.trim()}
                className={`modal-button save-button ${!newDocument.name.trim() ? 'disabled' : ''}`}
              >
                <FaCheck className="mr-2" />
                Yuklash va Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedDocument && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-container preview-modal" onClick={e => e.stopPropagation()}>
            {/* Preview Header */}
            <div className="preview-header">
              <div className="preview-icon">
                {getDocumentIcon(selectedDocument.type, "large")}
              </div>
              <div className="preview-title-section">
                <h2 className="preview-title">{selectedDocument.name}</h2>
                <div className="preview-meta">
                  <span className="preview-type">{selectedDocument.type}</span>
                  <span className="preview-size">{selectedDocument.fileSize}</span>
                  <span className="preview-date">{selectedDocument.date}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="preview-close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Preview Content */}
            <div className="preview-content">
              {/* Document Preview Placeholder */}
              <div className="preview-placeholder">
                <div className="placeholder-icon">
                  {getDocumentIcon(selectedDocument.type, "large")}
                </div>
                <p className="placeholder-text">
                  Bu yerda hujjatning asl kontenti ko'rinadi. 
                  Haqiqiy tizimda PDF ko'ruvchi yoki rasm ko'ruvchi integratsiya qilinadi.
                </p>
              </div>

              {/* Document Details Grid */}
              <div className="preview-details-grid">
                <div className="detail-section">
                  <h3 className="detail-section-title">
                    <FaFile className="section-icon" />
                    Hujjat tafsilotlari
                  </h3>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="detail-item-label">Yaratilgan sana:</span>
                      <span className="detail-item-value">{selectedDocument.date}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item-label">Yuklagan:</span>
                      <span className="detail-item-value">{selectedDocument.uploadedBy}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item-label">Fayl hajmi:</span>
                      <span className="detail-item-value">{selectedDocument.fileSize}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3 className="detail-section-title">
                    <FaUserMd className="section-icon" />
                    Tibbiy ma'lumotlar
                  </h3>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="detail-item-label">Bemor:</span>
                      <span className="detail-item-value">{selectedDocument.patientName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-item-label">Shifokor:</span>
                      <span className="detail-item-value">{selectedDocument.doctorName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedDocument.description && (
                <div className="preview-description">
                  <h3 className="detail-section-title">
                    <FaInfoCircle className="section-icon" />
                    Tavsif
                  </h3>
                  <div className="description-content">
                    {selectedDocument.description}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="preview-tags">
                <h3 className="detail-section-title">
                  <FaTag className="section-icon" />
                  Teglar
                </h3>
                <div className="tags-container">
                  {selectedDocument.tags.map((tag, index) => (
                    <span key={index} className="preview-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="preview-actions">
                <button
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  className="preview-button download-preview-button"
                >
                  <FaDownload className="mr-2" />
                  Yuklab olish
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="preview-button close-preview-button"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="documents-footer">
        <p className="footer-text">
          © 2024 Tibbiy Hujjatlar Boshqaruvi Tizimi • {new Date().getFullYear()} yil
        </p>
        <p className="footer-subtext">
          Jami saqlangan hajm: 23.2 MB • Oxirgi yangilanish: bugun 14:30
        </p>
      </div>
    </div>
  );
};

export default Documents;