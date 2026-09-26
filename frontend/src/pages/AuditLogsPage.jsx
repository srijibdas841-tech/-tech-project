import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck } from 'lucide-react';
import { auditService } from '../services/api.js';

export default function AuditLogsPage({ setSelectedRecordId, setActiveTab }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const data = await auditService.list(params);
      setLogs(data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Cadastral Governance Audit Trail</h2>
          <p>Immutable legal audit log tracking every automated AI inference, officer verification, and deed mutation</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            className="form-select"
            style={{ width: '220px', fontSize: '13px' }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Cadastral Actions</option>
            <option value="AUTO_PROCESS">AUTO_PROCESS_DOCUMENT</option>
            <option value="APPROVE_RECORD">APPROVE_RECORD</option>
            <option value="REJECT_RECORD">REJECT_RECORD</option>
            <option value="DUPLICATE_DECISION">DUPLICATE_DECISION</option>
            <option value="UPDATE_RECORD">UPDATE_RECORD_FIELDS</option>
            <option value="GENERATE_TRUST_CERTIFICATE">GENERATE_TRUST_CERTIFICATE</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp (UTC)</th>
                <th>Action Identifier</th>
                <th>Operator / Officer</th>
                <th>Record Ref</th>
                <th>Audit Details & Parameters</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No audit records match the selected filter.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{l.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b' }}>{l.timestamp}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f4c81' }}>{l.action}</span>
                    </td>
                    <td>{l.user_name}</td>
                    <td>
                      {l.record_id ? (
                        <button 
                          className="btn btn-outline btn-sm"
                          style={{ padding: '2px 6px', fontSize: '11px' }}
                          onClick={() => {
                            setSelectedRecordId(l.record_id);
                            setActiveTab('record-details');
                          }}
                        >
                          Record #{l.record_id}
                        </button>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: '#334155', maxWidth: '400px', wordBreak: 'break-word' }}>
                      {(() => {
                        try {
                          if (l.details && l.details.startsWith('{')) {
                            const parsed = JSON.parse(l.details);
                            if (parsed.certificate_id) {
                              return (
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0f4c81' }}>
                                    Cert ID: <span className="font-mono">{parsed.certificate_id}</span> ({parsed.trust_status})
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                    Trust Score: <strong>{parsed.trust_score}%</strong> • Officer: {parsed.officer_name || 'Cadastre Authority'} • Plot #{parsed.plot_number || parsed.survey_number} ({parsed.village})
                                  </div>
                                </div>
                              );
                            }
                          }
                        } catch (e) {}
                        return l.details;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
