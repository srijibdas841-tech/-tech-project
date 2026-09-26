import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = '#0284c7' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{title}</span>
        {Icon && (
          <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-footer">{subtext}</div>}
    </div>
  );
}
