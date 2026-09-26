import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Search,
  Filter 
} from 'lucide-react';
import { recordService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ValidationPage({ selectedRecordId, setSelectedRecordId, setActiveTab }) {
  const [records, setRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [validations, setValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const list = await recordService.list({ limit: 30 });
        setRecords(list);

        const targetId = selectedRecordId || (list.length > 0 ? list[0].id : null);
        if (targetId) {
          loadRecordDetails(targetId);
        }
      } catch (err) {
        console.error('Failed to load records for validation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [selectedRecordId]);

  const loadRecordDetails = async (id) => {
    try {
      const rec = await recordService.get(id);
      setCurrentRecord(rec);
      const valResults = await recordService.getValidation(id);
      setValidations(valResults);
    } catch (err) {
      console.error('Error fetching record validation:', err);
    }
  };

  const handleSelectRecord = (id) => {
    setSelectedRecordId(id);
    loadRecordDetails(id);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Cadastral Multi-Rule Validation Engine</h2>
          <p>Field-by-field integrity verification, syntax checking, and cadastral title conflict detection</p>
        </div>

        {/* Record selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Select Land Record:</span>
          <select 
            className="form-select"
            style={{ width: '280px', fontSize: '13px' }}
            value={currentRecord?.id || ''}
            onChange={(e) => handleSelectRecord(Number(e.target.value))}
          >
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                #{r.id} - {r.owner_name} ({r.village}, Survey {r.survey_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentRecord && (
        <>
          {/* Summary Card */}
          <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #0f2439, #193652)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  Active Record Validation Audit
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: '#f8fafc' }}>
                  {currentRecord.owner_name} • Survey {currentRecord.survey_number}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>
                  Village: {currentRecord.village} | District: {currentRecord.district}, {currentRecord.state} | Area: {currentRecord.area} Acres
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Overall Validation Score</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: currentRecord.validation_score >= 80 ? '#10b981' : '#f59e0b' }}>
                  {currentRecord.validation_score}%
                </div>
                <StatusBadge status={currentRecord.status} />
              </div>
            </div>
          </div>

          {/* Validation Table */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
              Field-by-Field Cadastral Integrity Checks
            </h3>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Field Identifier</th>
                    <th>Extracted Value</th>
                    <th>Validation Status</th>
                    <th>Confidence</th>
                    <th>Audit & Verification Rule Diagnostics</th>
                  </tr>
                </thead>
                <tbody>
                  {validations.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                        No specific validation anomalies flagged for this record. Default rules satisfied.
                      </td>
                    </tr>
                  ) : (
                    validations.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {v.field_name}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                          {v.extracted_value || <span style={{ color: '#94a3b8' }}>N/A</span>}
                        </td>
                        <td>
                          <StatusBadge status={v.validation_status} />
                        </td>
                        <td>
                          <StatusBadge status={v.confidence} type="confidence" />
                        </td>
                        <td style={{ fontSize: '12.5px', color: '#334155' }}>
                          {v.validation_message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick action buttons */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setSelectedRecordId(currentRecord.id);
                  setActiveTab('duplicates');
                }}
              >
                Scan for Duplicates
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSelectedRecordId(currentRecord.id);
                  setActiveTab('review-queue');
                }}
              >
                Open in Review Queue
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
