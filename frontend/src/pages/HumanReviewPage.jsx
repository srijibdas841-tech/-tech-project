import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Check, 
  X, 
  Copy, 
  Edit3, 
  FileText, 
  AlertTriangle, 
  Save, 
  Clock 
} from 'lucide-react';
import { reviewService, recordService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function HumanReviewPage({ setSelectedRecordId, setActiveTab }) {
  const [queue, setQueue] = useState([]);
  const [activeRecord, setActiveRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const fetchQueue = async () => {
    try {
      const data = await reviewService.getQueue();
      setQueue(data);
      if (data.length > 0 && !activeRecord) {
        selectRecord(data[0]);
      } else if (data.length > 0 && activeRecord) {
        const found = data.find(d => d.id === activeRecord.id);
        if (found) selectRecord(found);
        else selectRecord(data[0]);
      } else {
        setActiveRecord(null);
      }
    } catch (err) {
      console.error('Error fetching review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const selectRecord = (rec) => {
    setActiveRecord(rec);
    setEditForm({
      owner_name: rec.owner_name || '',
      father_or_guardian_name: rec.father_or_guardian_name || '',
      survey_number: rec.survey_number || '',
      plot_number: rec.plot_number || '',
      area: rec.area || 0.0,
      village: rec.village || '',
      district: rec.district || '',
      state: rec.state || '',
      registration_number: rec.registration_number || '',
      mutation_number: rec.mutation_number || '',
      address: rec.address || ''
    });
    setComment('');
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdits = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      const updated = await recordService.update(activeRecord.id, {
        ...editForm,
        area: parseFloat(editForm.area),
        reviewer_comment: comment || 'Edited fields via Human Review interface'
      });
      setNotice('Record fields updated successfully.');
      setTimeout(() => setNotice(''), 3000);
      await fetchQueue();
    } catch (err) {
      alert('Error updating record: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      await reviewService.approve(activeRecord.id, comment || 'Sanctioned and approved by revenue verification officer.');
      setNotice(`Record #${activeRecord.id} successfully APPROVED & VERIFIED.`);
      setTimeout(() => setNotice(''), 4000);
      await fetchQueue();
    } catch (err) {
      alert('Error approving record: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeRecord) return;
    if (!comment) {
      alert('Please provide a mandatory rejection justification comment.');
      return;
    }
    setActionLoading(true);
    try {
      await reviewService.reject(activeRecord.id, comment);
      setNotice(`Record #${activeRecord.id} REJECTED.`);
      setTimeout(() => setNotice(''), 4000);
      await fetchQueue();
    } catch (err) {
      alert('Error rejecting record: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDuplicate = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      await reviewService.markDuplicate(activeRecord.id, comment || 'Marked duplicate parcel during manual deed audit.');
      setNotice(`Record #${activeRecord.id} marked as DUPLICATE.`);
      setTimeout(() => setNotice(''), 4000);
      await fetchQueue();
    } catch (err) {
      alert('Error marking duplicate: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Human Verification & Resolution Queue</h2>
          <p>Supervised validation workflow for records with OCR uncertainty, field discrepancies, or cadastral conflicts</p>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#059669', marginBottom: '20px', fontWeight: 600 }}>
          ✓ {notice}
        </div>
      )}

      {queue.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <UserCheck size={48} color="#059669" style={{ margin: '0 auto 12px' }} />
          <h3>Human Review Queue is Empty!</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
            All land records have either passed high-confidence auto-acceptance (≥90%) or have already been reviewed by revenue officers.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          
          {/* Queue List Panel */}
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Pending Tasks ({queue.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {queue.map((r) => {
                const isSelected = activeRecord?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectRecord(r)}
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
                        #{r.id} • {r.owner_name}
                      </span>
                      <StatusBadge status={r.OCR_confidence} type="confidence" />
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      Survey {r.survey_number} • {r.village}, {r.district}
                    </div>

                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <StatusBadge status={r.status} />
                      {r.duplicate_score >= 70 && (
                        <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, background: '#fef2f2', padding: '2px 5px', borderRadius: '4px' }}>
                          DUP {r.duplicate_score}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Record Review & Editing Panel */}
          {activeRecord && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Record Summary Banner */}
              <div 
                style={{ 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Reviewing Land Record #{activeRecord.id}: {activeRecord.owner_name}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                    OCR Quality: <strong>{activeRecord.OCR_confidence}%</strong> | Validation: <strong>{activeRecord.validation_score}%</strong> | Duplicate Clash: <strong>{activeRecord.duplicate_score}%</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setSelectedRecordId(activeRecord.id);
                      setActiveTab('validation');
                    }}
                  >
                    View Rule Diagnostics
                  </button>
                </div>
              </div>

              {/* Editable Fields Form */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Verify & Correct Extracted Fields
                  </h3>
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={handleSaveEdits}
                    disabled={actionLoading}
                  >
                    <Save size={14} />
                    <span>Save Edits</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Owner Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="owner_name" 
                      value={editForm.owner_name} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Father's / Guardian Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="father_or_guardian_name" 
                      value={editForm.father_or_guardian_name} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Survey / Dag Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="survey_number" 
                      value={editForm.survey_number} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Plot Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="plot_number" 
                      value={editForm.plot_number} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Parcel Area (Acres)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-input" 
                      name="area" 
                      value={editForm.area} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Village / Mauza</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="village" 
                      value={editForm.village} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="district" 
                      value={editForm.district} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="state" 
                      value={editForm.state} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration Deed No.</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="registration_number" 
                      value={editForm.registration_number} 
                      onChange={handleFieldChange} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mutation Case No.</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="mutation_number" 
                      value={editForm.mutation_number} 
                      onChange={handleFieldChange} 
                    />
                  </div>
                </div>

                {/* Reviewer Comment */}
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Officer Verification Findings / Legal Comment</label>
                  <textarea 
                    className="form-textarea" 
                    rows="2"
                    placeholder="Provide justification notes for approval, rejection, or field modifications..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                {/* Decision Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <button 
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={handleApprove}
                  >
                    <Check size={16} />
                    <span>Approve Record (Mark Verified)</span>
                  </button>

                  <button 
                    className="btn btn-danger"
                    disabled={actionLoading}
                    onClick={handleReject}
                  >
                    <X size={16} />
                    <span>Reject Record</span>
                  </button>

                  <button 
                    className="btn btn-outline"
                    disabled={actionLoading}
                    onClick={handleMarkDuplicate}
                  >
                    <Copy size={16} />
                    <span>Mark as Duplicate</span>
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
