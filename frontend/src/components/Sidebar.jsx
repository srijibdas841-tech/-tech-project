import React from 'react';
import { 
  LayoutDashboard, 
  Files, 
  UploadCloud, 
  LandPlot, 
  CopyCheck, 
  UserCheck, 
  BarChart3, 
  History, 
  ShieldAlert,
  LogOut,
  Sparkles,
  Compass,
  Award,
  QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Sidebar({ activeTab, setActiveTab, pendingReviewCount = 0, duplicateCount = 0 }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Document', icon: UploadCloud, highlight: true },
    { id: 'documents', label: 'Documents', icon: Files },
    { id: 'records', label: 'Land Records', icon: LandPlot },
    { id: 'gis-search', label: 'Land Search (GIS)', icon: Compass },
    { id: 'trust-certificates', label: 'Trust Certificates', icon: Award },
    { id: 'verify-certificate', label: 'Verify Certificate', icon: QrCode },
    { id: 'duplicates', label: 'Duplicate Detection', icon: CopyCheck, badge: duplicateCount },
    { id: 'review-queue', label: 'Review Queue', icon: UserCheck, badge: pendingReviewCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit-logs', label: 'Audit Logs', icon: History },
    { id: 'admin', label: 'Admin Panel', icon: ShieldAlert, adminOnly: true }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <LandPlot size={22} />
        </div>
        <div className="sidebar-title">
          <h1>BHOOMI AI</h1>
          <span>SIH26018 • #TECH</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              style={item.highlight && !isActive ? { border: '1px dashed #0284c7', color: '#38bdf8' } : {}}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              {item.highlight && !item.badge && <Sparkles size={14} style={{ marginLeft: 'auto', color: '#38bdf8' }} />}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>
              {user ? user.name : 'Government Officer'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {user ? user.role : 'OFFICER'} • National Cadastre
            </div>
          </div>
          <button 
            onClick={logout} 
            title="Sign out"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
