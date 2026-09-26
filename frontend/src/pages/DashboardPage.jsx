import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldAlert,
  Clock,
  Sparkles,
  Compass
} from 'lucide-react';
import { dashboardService } from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DashboardPage({ setActiveTab, setSelectedRecordId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats();
        setData(res);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="page-container"><div className="card">Loading cadastral metrics...</div></div>;
  }

  const { stats, status_distribution, monthly_trend, confidence_distribution, recent_activity } = data || {
    stats: {}, status_distribution: [], monthly_trend: [], confidence_distribution: {}, recent_activity: []
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Revenue Administration & Cadastral Intelligence Dashboard</h2>
          <p>Real-time digitization metrics, AI confidence scoring, and duplicate resolution tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-accent" 
            onClick={() => setActiveTab('gis-search')}
            title="Search land parcels on GIS interactive satellite map"
          >
            <Compass size={16} />
            <span>Search Land by GIS</span>
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
            <Sparkles size={16} />
            <span>Upload & Process Deed</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-grid">
        <StatCard 
          title="Total Land Records" 
          value={stats.total_records} 
          subtext="Indexed cadastral holdings" 
          icon={FileText} 
          color="#0f4c81" 
        />
        <StatCard 
          title="Processed Documents" 
          value={stats.processed_documents} 
          subtext="Scanned deeds & Khatians" 
          icon={TrendingUp} 
          color="#0284c7" 
        />
        <StatCard 
          title="Verified Records" 
          value={stats.verified_records} 
          subtext="High confidence / Sanctioned" 
          icon={CheckCircle2} 
          color="#059669" 
        />
        <StatCard 
          title="Requires Human Review" 
          value={stats.pending_review} 
          subtext="Low confidence or conflicts" 
          icon={Clock} 
          color="#d97706" 
        />
        <StatCard 
          title="Duplicate Candidates" 
          value={stats.duplicate_candidates} 
          subtext=">= 70% weighted similarity" 
          icon={Copy} 
          color="#dc2626" 
        />
        <StatCard 
          title="Validation Errors" 
          value={stats.validation_errors} 
          subtext="Area/survey syntax flags" 
          icon={AlertTriangle} 
          color="#e11d48" 
        />
        <StatCard 
          title="Avg OCR Confidence" 
          value={`${stats.avg_ocr_confidence}%`} 
          subtext="Multi-lingual OCR pipeline" 
          icon={Zap} 
          color="#7c3aed" 
        />
      </div>

      {/* Charts Row */}
      <div className="comparison-grid" style={{ marginBottom: '24px' }}>
        
        {/* Chart 1: Monthly Digitization Trend */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Monthly Digitization Progress</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Last 6 Months</span>
          </div>

          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
            {monthly_trend.map((m) => {
              const maxCount = Math.max(...monthly_trend.map(item => item.count), 70);
              const heightPct = Math.round((m.count / maxCount) * 100);
              const verifiedPct = Math.round((m.verified / maxCount) * 100);

              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', display: 'flex', gap: '4px', alignItems: 'flex-end', justifyContent: 'center', height: '170px' }}>
                    <div 
                      title={`Total: ${m.count}`}
                      style={{ 
                        width: '14px', 
                        height: `${heightPct}%`, 
                        backgroundColor: '#0284c7', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease'
                      }} 
                    />
                    <div 
                      title={`Verified: ${m.verified}`}
                      style={{ 
                        width: '14px', 
                        height: `${verifiedPct}%`, 
                        backgroundColor: '#059669', 
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.4s ease'
                      }} 
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>{m.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#0284c7', borderRadius: '2px' }}></span>
              <span>Total Processed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#059669', borderRadius: '2px' }}></span>
              <span>Auto-Verified</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Land Record Status Distribution & Confidence Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Verification & Confidence Distribution</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Cadastral Registry</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {status_distribution.map((item) => {
              const total = stats.total_records || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{item.name}</span>
                    <span style={{ color: '#64748b' }}>{item.count} records ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* OCR Confidence Tier Breakdown */}
          <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
              AI Confidence Score Tiers:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>High (≥90%)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#065f46' }}>{confidence_distribution['High (>=90%)'] || 0}</div>
                <div style={{ fontSize: '10px', color: '#059669' }}>Auto-Accepted</div>
              </div>
              <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Med (70–89%)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#92400e' }}>{confidence_distribution['Medium (70-89%)'] || 0}</div>
                <div style={{ fontSize: '10px', color: '#d97706' }}>Assigned Review</div>
              </div>
              <div style={{ padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '11px', color: '#b91c1c', fontWeight: 600 }}>Low (&lt;70%)</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b' }}>{confidence_distribution['Low (<70%)'] || 0}</div>
                <div style={{ fontSize: '10px', color: '#dc2626' }}>Critical Escalation</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Audit Trail */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Recent AI Pipeline & Officer Actions</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('audit-logs')}>
            View Full Audit Trail
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Operator / Engine</th>
                <th>Record ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recent_activity.map((act) => (
                <tr key={act.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: '#64748b' }}>
                    {act.timestamp}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: '12px', color: '#0f4c81' }}>{act.action}</span>
                  </td>
                  <td>{act.user_name}</td>
                  <td>
                    {act.record_id ? (
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ padding: '2px 6px', fontSize: '11px' }}
                        onClick={() => {
                          setSelectedRecordId(act.record_id);
                          setActiveTab('record-details');
                        }}
                      >
                        #{act.record_id}
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: '#475569', maxWidth: '380px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {act.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
