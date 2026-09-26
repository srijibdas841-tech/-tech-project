import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  X, 
  Send, 
  AlertCircle, 
  ArrowRightLeft, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { duplicateService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DuplicateDetectionPage({ setSelectedRecordId, setActiveTab }) {
  const [duplicates, setDuplicates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDuplicates = async () => {
    try {
      const data = await duplicateService.list();
      setDuplicates(data);
      if (data.length > 0 && !selectedCandidate) {
        setSelectedCandidate(data[0]);
      } else if (data.length > 0 && selectedCandidate) {
        const updated = data.find(d => d.id === selectedCandidate.id);
        setSelectedCandidate(updated || data[0]);
      }
    } catch (err) {
      console.error('Error fetching duplicates:', err);
    }
  };

  useEffect(() => {
    loadDuplicates();
  }, []);

  const handleReviewAction = async (action) => {
    if (!selectedCandidate) return;
    setActionLoading(true);
    try {
      await duplicateService.review(selectedCandidate.id, action, comment);
      setSuccessMsg(`Action '${action}' applied successfully.`);
      setComment('');
      await loadDuplicates();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error updating duplicate status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Multi-Factor Duplicate & Cadastral Conflict Engine</h2>
          <p>Weighted fuzzy matching across Owner (30%), Father (20%), Survey (20%), Village (10%), Address (10%), and Area (10%)</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#059669', marginBottom: '20px', fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {duplicates.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <Copy size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3>No Duplicate Candidates Flagged</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
            All existing cadastral records have passed unique title verification without cross-parcel collision.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          
          {/* Candidates List Column */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Flagged Duplicate Pairs ({duplicates.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {duplicates.map((c) => {
                const isSelected = selectedCandidate?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCandidate(c)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                        Record #{c.record_id} vs #{c.matched_record_id}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 700, 
                        color: c.similarity_score >= 90 ? '#dc2626' : '#d97706',
                        background: c.similarity_score >= 90 ? '#fef2f2' : '#fffbeb',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${c.similarity_score >= 90 ? '#fecaca' : '#fde68a'}`
                      }}>
                        {c.similarity_score}% Match
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                      {c.record?.owner_name} / {c.matched_record?.owner_name}
                    </div>

                    <div style={{ marginTop: '6px' }}>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Side-by-Side Comparison Column */}
          {selectedCandidate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header Match Status */}
              <div 
                style={{ 
                  background: selectedCandidate.similarity_score >= 90 ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${selectedCandidate.similarity_score >= 90 ? '#fecaca' : '#fde68a'}`,
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Potential Duplicate Pair: Record #{selectedCandidate.record_id} vs #{selectedCandidate.matched_record_id}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '3px' }}>
                    Composite AI Similarity Score: <strong>{selectedCandidate.similarity_score}%</strong> ({selectedCandidate.similarity_score >= 90 ? 'HIGH DUPLICATE POSSIBILITY' : 'POSSIBLE DUPLICATE'})
                  </div>
                </div>

                <StatusBadge status={selectedCandidate.status} />
              </div>

              {/* Matching Fields Chips */}
              <div className="card">
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  Identified Matching / Conflicting Fields:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedCandidate.matching_fields.map((f, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        background: '#e0f2fe', 
                        color: '#0369a1', 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        borderRadius: '6px',
                        border: '1px solid #bae6fd'
                      }}
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Side-by-Side Comparison Box */}
              <div className="comparison-grid">
                
                {/* Record A */}
                <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0284c7' }}>
                      Record A (#{selectedCandidate.record_id}) - Newly Digitized
                    </h3>
                    <StatusBadge status={selectedCandidate.record?.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div><strong style={{ color: '#64748b' }}>Owner Name:</strong> <div style={{ fontWeight: 700 }}>{selectedCandidate.record?.owner_name}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Father's Name:</strong> <div>{selectedCandidate.record?.father_or_guardian_name}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Survey Number:</strong> <div style={{ fontWeight: 700, color: '#0f4c81' }}>{selectedCandidate.record?.survey_number}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Plot Number:</strong> <div>{selectedCandidate.record?.plot_number || 'N/A'}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Parcel Area:</strong> <div style={{ fontWeight: 700 }}>{selectedCandidate.record?.area} Acres</div></div>
                    <div><strong style={{ color: '#64748b' }}>Village / Mauza:</strong> <div>{selectedCandidate.record?.village}</div></div>
                    <div><strong style={{ color: '#64748b' }}>District & State:</strong> <div>{selectedCandidate.record?.district}, {selectedCandidate.record?.state}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Registration Number:</strong> <div>{selectedCandidate.record?.registration_number}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Mutation Number:</strong> <div>{selectedCandidate.record?.mutation_number}</div></div>
                  </div>
                </div>

                {/* Record B */}
                <div className="card" style={{ borderLeft: '4px solid #059669' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                      Record B (#{selectedCandidate.matched_record_id}) - Existing Title
                    </h3>
                    <StatusBadge status={selectedCandidate.matched_record?.status} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div><strong style={{ color: '#64748b' }}>Owner Name:</strong> <div style={{ fontWeight: 700 }}>{selectedCandidate.matched_record?.owner_name}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Father's Name:</strong> <div>{selectedCandidate.matched_record?.father_or_guardian_name}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Survey Number:</strong> <div style={{ fontWeight: 700, color: '#0f4c81' }}>{selectedCandidate.matched_record?.survey_number}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Plot Number:</strong> <div>{selectedCandidate.matched_record?.plot_number || 'N/A'}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Parcel Area:</strong> <div style={{ fontWeight: 700 }}>{selectedCandidate.matched_record?.area} Acres</div></div>
                    <div><strong style={{ color: '#64748b' }}>Village / Mauza:</strong> <div>{selectedCandidate.matched_record?.village}</div></div>
                    <div><strong style={{ color: '#64748b' }}>District & State:</strong> <div>{selectedCandidate.matched_record?.district}, {selectedCandidate.matched_record?.state}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Registration Number:</strong> <div>{selectedCandidate.matched_record?.registration_number}</div></div>
                    <div><strong style={{ color: '#64748b' }}>Mutation Number:</strong> <div>{selectedCandidate.matched_record?.mutation_number}</div></div>
                  </div>
                </div>

              </div>

              {/* Officer Review Decision Actions */}
              <div className="card">
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
                  Officer Review Decision & Audit Remarks
                </h3>
                <div className="form-group">
                  <textarea 
                    className="form-textarea"
                    rows="2"
                    placeholder="Enter cadastral field verification findings or deed reference note..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-danger"
                    disabled={actionLoading}
                    onClick={() => handleReviewAction('CONFIRM_DUPLICATE')}
                  >
                    <Check size={16} />
                    <span>Confirm Duplicate</span>
                  </button>

                  <button 
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={() => handleReviewAction('NOT_DUPLICATE')}
                  >
                    <X size={16} />
                    <span>Not Duplicate (Distinct Parcel)</span>
                  </button>

                  <button 
                    className="btn btn-outline"
                    disabled={actionLoading}
                    onClick={() => handleReviewAction('SEND_FOR_REVIEW')}
                  >
                    <Send size={16} />
                    <span>Send for Detailed Field Review</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
