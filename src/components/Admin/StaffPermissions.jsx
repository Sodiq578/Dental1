import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { FiUser, FiEye, FiEyeOff, FiEdit, FiSave, FiX } from 'react-icons/fi';
import './StaffPermissions.css';

const StaffPermissions = () => {
  const { staff, setStaff } = useContext(AppContext);
  const [permissionModal, setPermissionModal] = useState(null);

  const branches = [
    { id: 1, name: 'Toshkent Filiali' },
    { id: 2, name: 'Samarqand Filiali' },
    { id: 3, name: 'Buxoro Filiali' }
  ];

  const modules = [
    { id: 'patients', name: 'Bemorlar', description: 'Bemorlar ma\'lumotlarini ko\'rish va tahrirlash' },
    { id: 'appointments', name: 'Uchrashuvlar', description: 'Uchrashuvlarni boshqarish' },
    { id: 'medications', name: 'Dorilar', description: 'Dori vositalarini boshqarish' },
    { id: 'billing', name: 'Hisob-kitob', description: 'To\'lovlar va hisob-kitob' },
    { id: 'inventory', name: 'Ombor', description: 'Inventarizatsiya boshqaruvi' },
    { id: 'reports', name: 'Hisobotlar', description: 'Statistik hisobotlar' }
  ];

  const handleEditPermissions = (staffMember) => {
    setPermissionModal(staffMember);
  };

  const handlePermissionChange = (moduleId, hasAccess) => {
    const updatedStaff = staff.map(member => {
      if (member.id === permissionModal.id) {
        const permissions = { ...member.permissions };
        if (hasAccess) {
          permissions[moduleId] = true;
        } else {
          delete permissions[moduleId];
        }
        return { ...member, permissions };
      }
      return member;
    });
    setStaff(updatedStaff);
  };

  const handleBranchChange = (staffId, branchId) => {
    const updatedStaff = staff.map(member => {
      if (member.id === staffId) {
        return { ...member, branchId };
      }
      return member;
    });
    setStaff(updatedStaff);
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Filial tanlanmagan';
  };

  const hasPermission = (staffMember, moduleId) => {
    return staffMember.permissions && staffMember.permissions[moduleId];
  };

  return (
    <div className="staff-permissions">
      <div className="page-header">
        <h1>Xodimlar va Ruxsatlar</h1>
        <p>Xodimlarning filial va modul ruxsatlarini boshqaring</p>
      </div>

      <div className="staff-table-container">
        <table className="staff-table">
          <thead>
            <tr>
              <th>Xodim</th>
              <th>Lavozim</th>
              <th>Filial</th>
              <th>Ruxsatlar</th>
              <th>Harakatlar</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member.id}>
                <td className="staff-info">
                  <div className="staff-avatar">
                    <FiUser />
                  </div>
                  <div>
                    <div className="staff-name">{member.name}</div>
                    <div className="staff-email">{member.email}</div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge role-${member.role}`}>
                    {member.role === 'doctor' ? 'Shifokor' : 
                     member.role === 'nurse' ? 'Hamshira' : 
                     member.role === 'admin' ? 'Admin' : 'Xodim'}
                  </span>
                </td>
                <td>
                  <select
                    value={member.branchId || ''}
                    onChange={(e) => handleBranchChange(member.id, parseInt(e.target.value))}
                    className="branch-select"
                  >
                    <option value="">Filial tanlang</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="permissions-summary">
                    {modules.slice(0, 3).map(module => (
                      <span 
                        key={module.id} 
                        className={`permission-dot ${hasPermission(member, module.id) ? 'active' : 'inactive'}`}
                        title={module.name}
                      />
                    ))}
                    {modules.length > 3 && (
                      <span className="more-permissions">
                        +{modules.length - 3} boshqa
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button 
                    className="btn-permissions"
                    onClick={() => handleEditPermissions(member)}
                  >
                    <FiEdit /> Ruxsatlar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ruxsatlar modal oynasi */}
      {permissionModal && (
        <div className="modal-overlay">
          <div className="permissions-modal">
            <div className="modal-header">
              <h2>Ruxsatlarni Boshqarish</h2>
              <button 
                className="close-btn"
                onClick={() => setPermissionModal(null)}
              >
                <FiX />
              </button>
            </div>

            <div className="staff-details">
              <div className="staff-avatar large">
                <FiUser />
              </div>
              <div>
                <h3>{permissionModal.name}</h3>
                <p>{permissionModal.email}</p>
                <p className="staff-branch">
                  Filial: {getBranchName(permissionModal.branchId)}
                </p>
              </div>
            </div>

            <div className="permissions-list">
              <h4>Modul Ruxsatlari</h4>
              {modules.map(module => (
                <div key={module.id} className="permission-item">
                  <div className="permission-info">
                    <h5>{module.name}</h5>
                    <p>{module.description}</p>
                  </div>
                  <div className="permission-toggle">
                    <button
                      className={`toggle-btn ${hasPermission(permissionModal, module.id) ? 'active' : ''}`}
                      onClick={() => handlePermissionChange(
                        module.id, 
                        !hasPermission(permissionModal, module.id)
                      )}
                    >
                      {hasPermission(permissionModal, module.id) ? <FiEye /> : <FiEyeOff />}
                      {hasPermission(permissionModal, module.id) ? 'Ruxsat berilgan' : 'Ruxsat yo\'q'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button 
                className="btn-primary"
                onClick={() => setPermissionModal(null)}
              >
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