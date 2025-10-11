import React, { useState, useContext } from 'react';
import { AppContext } from '../../App'; // AppContext'dan xodimlar ma'lumotlarini olish
import { FiUser, FiEye, FiEyeOff, FiEdit, FiSave, FiX } from 'react-icons/fi'; // Ikonkalar
import './StaffPermissions.css'; // CSS fayli

// StaffPermissions komponenti
const StaffPermissions = () => {
  // AppContext'dan xodimlar ro'yxati va uni yangilash funksiyasini olish
  const { staff, setStaff } = useContext(AppContext);
  // Modal oynada qaysi xodim tanlanganini saqlash uchun state
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Filiallar ro'yxati (statik ma'lumot)
  const branches = [
    { id: 1, name: 'Toshkent Branch' },
    { id: 2, name: 'Samarqand Branch' },
    { id: 3, name: 'Buxoro Branch' },
  ];

  // Modullar ro'yxati (statik ma'lumot)
  const modules = [
    { id: 'patients', name: 'Patients', description: 'View and edit patient information' },
    { id: 'appointments', name: 'Appointments', description: 'Manage appointments' },
    { id: 'medications', name: 'Medications', description: 'Manage medications' },
    { id: 'billing', name: 'Billing', description: 'Handle payments and billing' },
    { id: 'inventory', name: 'Inventory', description: 'Manage inventory' },
    { id: 'reports', name: 'Reports', description: 'View statistical reports' },
  ];

  // Xodimni tanlash va modal oynani ochish
  const handleEditPermissions = (staffMember) => {
    setSelectedStaff(staffMember);
  };

  // Modul uchun ruxsatni yoqish/o'chirish
  const handlePermissionChange = (moduleId, hasAccess) => {
    const updatedStaff = staff.map((member) => {
      if (member.id === selectedStaff.id) {
        const permissions = { ...member.permissions }; // Joriy ruxsatlarni nusxalash
        permissions[moduleId] = hasAccess; // Ruxsatni yangilash
        return { ...member, permissions }; // Yangilangan xodimni qaytarish
      }
      return member; // Boshqa xodimlarni o'zgartirmasdan qaytarish
    });
    setStaff(updatedStaff); // Xodimlar ro'yxatini yangilash
  };

  // Xodimning filialini yangilash
  const handleBranchChange = (staffId, branchId) => {
    const updatedStaff = staff.map((member) => {
      if (member.id === staffId) {
        return { ...member, branchId: branchId || null }; // Filialni yangilash
      }
      return member; // Boshqa xodimlarni o'zgartirmasdan qaytarish
    });
    setStaff(updatedStaff); // Xodimlar ro'yxatini yangilash
  };

  // Filial nomini ID orqali olish
  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch ? branch.name : 'No Branch Selected';
  };

  // Xodimning modulga ruxsati bor-yo'qligini tekshirish
  const hasPermission = (staffMember, moduleId) => {
    return staffMember?.permissions?.[moduleId] || false;
  };

  // Rol nomini chiroyli shaklga keltirish
  const getRoleName = (role) => {
    const roleMap = {
      doctor: 'Doctor',
      nurse: 'Nurse',
      admin: 'Admin',
      staff: 'Staff',
    };
    return roleMap[role] || 'Staff';
  };

  return (
    <div className="staff-permissions">
      {/* Sarlavha va tavsif */}
      <header className="page-header">
        <h1>Staff & Permissions</h1>
        <p>Manage staff branch assignments and module permissions</p>
      </header>

      {/* Xodimlar jadvali */}
      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id}>
                {/* Xodim ma'lumotlari */}
                <td className="staff-info">
                  <div className="staff-avatar">
                    <FiUser />
                  </div>
                  <div>
                    <div className="staff-name">{member.name}</div>
                    <div className="staff-email">{member.email}</div>
                  </div>
                </td>
                {/* Rol */}
                <td>
                  <span className={`role-badge role-${member.role}`}>
                    {getRoleName(member.role)}
                  </span>
                </td>
                {/* Filial tanlash */}
                <td>
                  <select
                    value={member.branchId || ''}
                    onChange={(e) => handleBranchChange(member.id, parseInt(e.target.value) || null)}
                    className="branch-select"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Ruxsatlarning qisqacha ko'rinishi */}
                <td>
                  <div className="permissions-summary">
                    {modules.slice(0, 3).map((module) => (
                      <span
                        key={module.id}
                        className={`permission-dot ${hasPermission(member, module.id) ? 'active' : 'inactive'}`}
                        title={module.name}
                      />
                    ))}
                    {modules.length > 3 && (
                      <span className="more-permissions">+{modules.length - 3} more</span>
                    )}
                  </div>
                </td>
                {/* Ruxsatlarni tahrirlash tugmasi */}
                <td>
                  <button
                    className="btn-permissions"
                    onClick={() => handleEditPermissions(member)}
                    aria-label={`Edit permissions for ${member.name}`}
                  >
                    <FiEdit /> Permissions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal oynasi */}
      {selectedStaff && (
        <div className="modal-overlay">
          <div className="permissions-modal">
            {/* Modal sarlavhasi va yopish tugmasi */}
            <div className="modal-header">
              <h2>Manage Permissions</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedStaff(null)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            {/* Xodim ma'lumotlari */}
            <div className="staff-details">
              <div className="staff-avatar large">
                <FiUser />
              </div>
              <div>
                <h3>{selectedStaff.name}</h3>
                <p>{selectedStaff.email}</p>
                <p className="staff-branch">Branch: {getBranchName(selectedStaff.branchId)}</p>
              </div>
            </div>

            {/* Modullar ro'yxati va ruxsatlarni boshqarish */}
            <div className="permissions-list">
              <h4>Module Permissions</h4>
              {modules.map((module) => (
                <div key={module.id} className="permission-item">
                  <div className="permission-info">
                    <h5>{module.name}</h5>
                    <p>{module.description}</p>
                  </div>
                  <div className="permission-toggle">
                    <button
                      className={`toggle-btn ${hasPermission(selectedStaff, module.id) ? 'active' : ''}`}
                      onClick={() =>
                        handlePermissionChange(module.id, !hasPermission(selectedStaff, module.id))
                      }
                      aria-label={`Toggle ${module.name} permission`}
                    >
                      {hasPermission(selectedStaff, module.id) ? <FiEye /> : <FiEyeOff />}
                      {hasPermission(selectedStaff, module.id) ? 'Access Granted' : 'No Access'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal tugmalari */}
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => setSelectedStaff(null)}
                aria-label="Save permissions"
              >
                <FiSave /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPermissions;