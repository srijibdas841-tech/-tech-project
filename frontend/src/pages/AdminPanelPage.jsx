import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Trash2, 
  Plus, 
  CheckCircle, 
  AlertOctagon, 
  Activity, 
  Server,
  RefreshCw
} from 'lucide-react';
import { adminService, auditService, dashboardService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminPanelPage({ setActiveTab }) {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [failures, setFailures] = useState([]);
  const [stats, setStats] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'REVIEWER' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const u = await adminService.getUsers();
      setUsersList(u);
      const f = await adminService.getFailures();
      setFailures(f);
      const s = await dashboardService.getStats();
      setStats(s.stats);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(newUser);
      setMsg('User created successfully.');
      setNewUser({ name: '', email: '', password: '', role: 'REVIEWER' });
      await loadAdminData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert('Error creating user: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Are you sure you want to delete user #${id}?`)) return;
    try {
      await adminService.deleteUser(id);
      setMsg('User deleted successfully.');
      await loadAdminData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Administrative Control & System Diagnostics</h2>
          <p>User access governance, system health telemetry, OCR pipeline status, and failure auditing</p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadAdminData}>
          <RefreshCw size={14} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#059669', marginBottom: '20px', fontWeight: 600 }}>
          ✓ {msg}
        </div>
      )}

      {/* System Health Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>DATABASE CLUSTER</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>Operational (SQLAlchemy)</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>OCR ENGINE DISPATCH</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>Demo & Transarect Modular</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>PROCESSING FAILURES</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: failures.length > 0 ? '#dc2626' : '#059669' }}>
              {failures.length} Unresolved Errors
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
          Authorized Revenue Officials & System Users ({usersList.length})
        </h3>

        <div className="table-container" style={{ marginBottom: '20px' }}>
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Official Name</th>
                <th>Email / Service ID</th>
                <th>Assigned Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className="badge-role">{u.role}</span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fecaca', padding: '3px 8px' }}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      <Trash2 size={13} />
                      <span>Revoke</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add User Form */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
            Provision New Government Official Account
          </h4>

          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label className="form-label">Full Name & Designation</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Shri Amit Roy, Tahsildar"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Govt Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="official@landrecords.gov.in"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Temporary Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">System Role</label>
              <select 
                className="form-select"
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="REVIEWER">REVIEWER (Audits & Edits)</option>
                <option value="OFFICER">OFFICER (Approves & Rejects)</option>
                <option value="ADMIN">ADMIN (Full Governance)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} />
                <span>Create Official</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
