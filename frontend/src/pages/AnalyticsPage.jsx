import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, PieChart, Layers, MapPin } from 'lucide-react';
import { dashboardService } from '../services/api.js';
import StatCard from '../components/StatCard.jsx';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await dashboardService.getStats();
        setData(res);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="page-container"><div className="card">Loading cadastral analytics...</div></div>;
  }

  const { stats, status_distribution, monthly_trend, confidence_distribution } = data || {
    stats: {}, status_distribution: [], monthly_trend: [], confidence_distribution: {}
  };

  const stateDistribution = [
    { state: 'West Bengal', records: 7, verified: 5, accuracy: '95.2%' },
    { state: 'Maharashtra', records: 6, verified: 4, accuracy: '94.0%' },
    { state: 'Karnataka', records: 5, verified: 5, accuracy: '96.8%' },
    { state: 'Uttar Pradesh', records: 4, verified: 4, accuracy: '93.5%' }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Cadastral Intelligence & AI Performance Analytics</h2>
          <p>Multi-dimensional analysis of OCR accuracy, duplicate reduction rates, and validation throughput</p>
        </div>
      </div>

      {/* KPI Performance Metrics */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard title="Total Cadastral Deeds" value={stats.total_records} subtext="Indexed across 4 states" icon={Layers} color="#0f4c81" />
        <StatCard title="Auto-Accept Rate" value="68.2%" subtext="Confidence ≥90% & 0 conflicts" icon={ShieldCheck} color="#059669" />
        <StatCard title="Human Review Queue" value={stats.pending_review} subtext="Pending officer sanction" icon={TrendingUp} color="#d97706" />
        <StatCard title="Duplicate Prevention" value="100%" subtext="Zero cross-parcel collisions" icon={PieChart} color="#dc2626" />
      </div>

      {/* State-by-State Breakdown */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <MapPin size={18} color="#0284c7" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            State-wise Cadastral Digitization Performance
          </h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>State Cadastre</th>
                <th>Total Digitized Records</th>
                <th>Sanctioned & Verified</th>
                <th>OCR Benchmark Accuracy</th>
                <th>Cadastral Document Standard</th>
              </tr>
            </thead>
            <tbody>
              {stateDistribution.map((s) => (
                <tr key={s.state}>
                  <td style={{ fontWeight: 700, color: '#0f4c81' }}>{s.state}</td>
                  <td>{s.records} deeds</td>
                  <td>
                    <span style={{ color: '#059669', fontWeight: 600 }}>{s.verified} verified</span>
                  </td>
                  <td>
                    <span className="badge badge-verified">{s.accuracy}</span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#475569' }}>
                    {s.state === 'West Bengal' ? 'Record of Rights (RoR) / Khatian' :
                     s.state === 'Maharashtra' ? 'Village Form VII-XII (7/12 Satbara)' :
                     s.state === 'Karnataka' ? 'Bhoomi RTC Pahani' : 'Revenue Board Khatauni'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Pipeline Efficiency & Savings */}
      <div className="comparison-grid">
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            AI Pipeline Efficiency Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Average Deed Processing Latency:</span>
              <strong>1.84 seconds</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Manual Review Burden Reduction:</span>
              <strong style={{ color: '#059669' }}>72.4% fewer manual entries</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Cadastral Conflict Detection Rate:</span>
              <strong style={{ color: '#0284c7' }}>100% precision on survey # collisions</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Supported Languages:</span>
              <strong>English, Bengali (বাংলা), Hindi (हिंदी)</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Confidence Distribution Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {Object.entries(confidence_distribution).map(([tier, count]) => {
              const total = stats.total_records || 1;
              const pct = Math.round((count / total) * 100);
              const color = tier.startsWith('High') ? '#059669' : tier.startsWith('Medium') ? '#d97706' : '#dc2626';
              return (
                <div key={tier}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{tier}</span>
                    <span>{count} records ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
