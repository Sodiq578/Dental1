import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../App';
import { FiUser, FiEye, FiEyeOff, FiEdit3, FiSave, FiX, FiCheck, FiXCircle, FiMapPin } from 'react-icons/fi';
import { getStaff, updateStaffPermissions, updateStaffBranch } from '../../api/staffApi'; // API service faylidan import qiling (fayl nomi mos ravishda o'zgartirilgan bo'lishi mumkin)
import './StaffPermissions.css';

const StaffPermissions = () => {
  const { staff, setStaff } = useContext(AppContext);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const branches = [
    { id: 1, name: 'Toshkent Branch', color: '#3b82f6' },
    { id: 2, name: 'Samarqand Branch', color: '#10b981' },
    { id: 3, name: 'Buxoro Branch', color: '#f59e0b' },
  ];

  const modules = [
    { id: 'patients', name: 'Patients', icon: '👥', description: 'Bemorlar ma\'lumotlarini ko\'rish va tahrirlash' },
    { id: 'appointments', name: 'Appointments', icon: '📅', description: 'Uchrashuvlarni boshqarish' },
    { id: 'medications', name: 'Medications', icon: '💊', description: 'Dori vositalarini boshqarish' },
    { id: 'billing', name: 'Billing', icon: '💰', description: 'To\'lovlar va hisob-kitoblarni boshqarish' },
    { id: 'inventory', name: 'Inventory', icon: '📦', description: 'Inventarizatsiyani boshqarish' },
    { id: 'reports', name: 'Reports', icon: '📊', description: 'Statistik hisobotlarni ko\'rish' },
  ];

  // Komponent yuklanganda staff ma'lumotlarini API orqali olish
  useEffect(() => {
    const fetchStaffData = async () => {
      setIsLoading(true);
      try {
        const data = await getStaff();
        setStaff(data); // Context'dagi staff ni yangilash
      } catch (error) {
        console.error('Xodimlar ma\'lumotlarini yuklashda xato:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaffData();
  }, [setStaff]);

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditPermissions = (staffMember) => {
    setSelectedStaff({ ...staffMember });
  };

  const handlePermissionChange = async (moduleId) => {
    setIsLoading(true);
    const updatedPermissions = { ...selectedStaff.permissions };
    updatedPermissions[moduleId] = !updatedPermissions[moduleId];

    try {
      // API orqali ruxsatlarni yangilash
      const updatedStaffData = await updateStaffPermissions(selectedStaff.id, updatedPermissions);
      
      // Local state ni yangilash
      setStaff(prevStaff => prevStaff.map(member => 
        member.id === selectedStaff.id ? updatedStaffData : member
      ));
      setSelectedStaff(updatedStaffData);
    } catch (error) {
      console.error('Ruxsatlarni yangilashda xato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBranchChange = async (staffId, branchId) => {
    setIsLoading(true);
    try {
      // API orqali filialni yangilash
      const updatedStaffData = await updateStaffBranch(staffId, branchId);
      
      // Local state ni yangilash
      setStaff(prevStaff => prevStaff.map(member => 
        member.id === staffId ? updatedStaffData : member
      ));
      if (selectedStaff && selectedStaff.id === staffId) {
        setSelectedStaff(updatedStaffData);
      }
    } catch (error) {
      console.error('Filialni yangilashda xato:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = () => {
    setSelectedStaff(null);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Filial tanlanmagan';
  };

  const getBranchColor = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.color : '#6b7280';
  };

  const hasPermission = (staffMember, moduleId) => {
    return staffMember?.permissions?.[moduleId] || false;
  };

  const getRoleColor = (role) => {
    const colors = {
      doctor: '#ef4444',
      nurse: '#10b981',
      admin: '#8b5cf6',
      staff: '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  const getRoleName = (role) => {
    const names = {
      doctor: 'Shifokor',
      nurse: 'Hamshira',
      admin: 'Administrator',
      staff: 'Xodim'
    };
    return names[role] || 'Xodim';
  };

  if (isLoading && !selectedStaff) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="staff-permissions-container">
      {/* Header */}
      <div className="permissions-header">
        <div className="header-content">
          <h1><FiUser className="header-icon" /> Xodimlar va Ruxsatlar</h1>
          <p>Xodimlar uchun filial va modul ruxsatlarini boshqaring</p>
        </div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Xodim nomini yoki email kiriting..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <h3>{staff.length}</h3>
            <p>Jami xodimlar</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div>
            <h3>{branches.length}</h3>
            <p>Filiallar</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔓</div>
          <div>
            <h3>{staff.reduce((acc, member) => 
              acc + Object.values(member.permissions || {}).filter(Boolean).length, 0
            )}</h3>
            <p>Aktiv ruxsatlar</p>
          </div>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="staff-grid">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="card-header">
                <div className="staff-avatar">
                  <FiUser />
                </div>
                <div className="staff-info">
                  <h3>{member.name}</h3>
                  <p className="staff-email">{member.email}</p>
                  <div className="role-badge" style={{backgroundColor: getRoleColor(member.role)}}>
                    {getRoleName(member.role)}
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="branch-selector">
                  <label>Filial</label>
                  <div className="branch-dropdown">
                    <select
                      value={member.branchId || ''}
                      onChange={(e) => handleBranchChange(member.id, parseInt(e.target.value) || null)}
                    >
                      <option value="">Filial tanlang</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    {member.branchId && (
                      <div 
                        className="branch-indicator"
                        style={{backgroundColor: getBranchColor(member.branchId)}}
                      >
                        <FiMapPin />
                      </div>
                    )}
                  </div>
                </div>

                <div className="permissions-preview">
                  <h4>Ruxsatlar</h4>
                  <div className="permission-chips">
                    {modules.slice(0, 4).map((module) => (
                      <div
                        key={module.id}
                        className={`permission-chip ${hasPermission(member, module.id) ? 'active' : ''}`}
                        title={module.description}
                      >
                        {module.icon}
                      </div>
                    ))}
                    {modules.length > 4 && (
                      <div className="permission-chip more">+{modules.length - 4}</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                className="edit-btn"
                onClick={() => handleEditPermissions(member)}
                disabled={isLoading}
              >
                <FiEdit3 /> Ruxsatlarni tahrirlash
              </button>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>Xodim topilmadi</p>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {selectedStaff && (
        <div className="modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div className="permissions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ruxsatlarni boshqarish</h2>
              <button className="close-btn" onClick={() => setSelectedStaff(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-staff-info">
              <div className="staff-avatar large">
                <FiUser />
              </div>
              <div>
                <h3>{selectedStaff.name}</h3>
                <p>{selectedStaff.email}</p>
                <div className="role-badge large" style={{backgroundColor: getRoleColor(selectedStaff.role)}}>
                  {getRoleName(selectedStaff.role)}
                </div>
                <div className="branch-info">
                  <FiMapPin />
                  <span>{getBranchName(selectedStaff.branchId)}</span>
                </div>
              </div>
            </div>

            <div className="permissions-grid">
              {modules.map((module) => (
                <div key={module.id} className="permission-card">
                  <div className="permission-header">
                    <span className="module-icon">{module.icon}</span>
                    <div>
                      <h4>{module.name}</h4>
                      <p>{module.description}</p>
                    </div>
                  </div>
                  <button
                    className={`permission-toggle ${hasPermission(selectedStaff, module.id) ? 'active' : ''}`}
                    onClick={() => handlePermissionChange(module.id)}
                    disabled={isLoading}
                  >
                    {hasPermission(selectedStaff, module.id) ? (
                      <>
                        <FiEye /> Ruxsat berilgan
                      </>
                    ) : (
                      <>
                        <FiEyeOff /> Ruxsat yo'q
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedStaff(null)}>
                <FiXCircle /> Bekor qilish
              </button>
              <button className="btn-save" onClick={handleSaveAll} disabled={isLoading}>
                <FiSave /> Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPermissions;