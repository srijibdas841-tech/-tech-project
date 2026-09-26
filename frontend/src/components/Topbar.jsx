import React from 'react';
import { Search, Bell, Shield, User as UserIcon } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.jsx';

export default function Topbar({ onSearch, searchTerm = '' }) {
  const { user, loginWithDemo } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-search">
        <Search size={16} color="#64748b" />
        <input 
          type="text" 
          placeholder="Search by Owner, Survey #, Village, Plot, or Registration..." 
          value={searchTerm}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
      </div>

      <div className="topbar-actions">
        {/* Quick Demo Role Switcher for SIH Judges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>Demo Role:</span>
          <button 
            className={`btn btn-sm ${user?.role === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '2px 8px', fontSize: '11px' }}
            onClick={() => loginWithDemo('admin')}
          >
            Admin
          </button>
          <button 
            className={`btn btn-sm ${user?.role === 'OFFICER' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '2px 8px', fontSize: '11px' }}
            onClick={() => loginWithDemo('officer')}
          >
            Officer
          </button>
          <button 
            className={`btn btn-sm ${user?.role === 'REVIEWER' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '2px 8px', fontSize: '11px' }}
            onClick={() => loginWithDemo('reviewer')}
          >
            Reviewer
          </button>
        </div>

        <div style={{ position: 'relative', cursor: 'pointer', padding: '6px' }}>
          <Bell size={18} color="#64748b" />
          <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#0284c7', borderRadius: '50%' }}></span>
        </div>

        <div className="user-profile-badge">
          <div className="user-avatar">
            {user ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#0f172a' }}>
              {user?.name || 'Authorized Official'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
              {user?.role || 'OFFICER'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
