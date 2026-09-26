import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  FileCheck2,
  CopyCheck
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';

export default function OcrResultPage({ result, setActiveTab, setSelectedRecordId }) {
  if (!result) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3>No OCR Processing Result Active</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
            Please upload or select a document from the Upload tab to view OCR and extracted fields.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveTab('upload')}>
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  const {
    document_id,
    extracted_text,
    fields,
    overall_ocr_confidence,
    validation_score,
    duplicate_score,
    overall_confidence,
    status,
    validation_issues,
    duplicate_candidates,
    record_id
  } = result;

  const confidences = fields.field_confidences || {};

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>OCR Extraction & Structured Cadastral Parsing</h2>
          <p>Document #{document_id} • Digital Land Record #{record_id || 'NEW'}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => {
              setSelectedRecordId(record_id);
              setActiveTab('validation');
            }}
          >
            <ShieldCheck size={16} />
            <span>Field Validation ({validation_score}%)</span>
          </button>

          <button 
            className="btn btn-outline"
            onClick={() => {
              setSelectedRecordId(record_id);
              setActiveTab('duplicates');
            }}
          >
            <CopyCheck size={16} />
            <span>Duplicate Scan ({duplicate_score}%)</span>
          </button>

          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedRecordId(record_id);
              setActiveTab('record-details');
            }}
          >
            <span>View Full Record</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Quality Summary Banner */}
      <div 
        style={{ 
          background: status === 'VERIFIED' ? '#ecfdf5' : '#fffbeb',
          border: `1px solid ${status === 'VERIFIED' ? '#a7f3d0' : '#fde68a'}`,
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: status === 'VERIFIED' ? '#059669' : '#d97706', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {status === 'VERIFIED' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
              Overall Digitization Confidence: {overall_confidence}% • {status === 'VERIFIED' ? 'AUTO-ACCEPTED' : 'ROUTED TO HUMAN REVIEW'}
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              OCR Quality: {overall_ocr_confidence}% | Validation Score: {validation_score}% | Duplicate Score: {duplicate_score}%
            </div>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* 2-Column Split View: Raw Document & OCR Text vs Structured Fields */}
      <div className="comparison-grid">
        
        {/* Left Column: Raw Document Preview & Raw Text Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Original Scanned Deed Preview
            </h3>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '360px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img 
                src={`/uploads/WB_RoR_Khatian_104.pdf`} 
                onError={(e) => { e.target.src = '/sample_documents/WB_RoR_Khatian_104.pdf'; }}
                alt="Land Record Preview" 
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
              />
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
              Raw OCR Stream
            </h3>
            <div className="code-block">
              {extracted_text}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Extracted Fields with Individual Confidences */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
            Structured Extracted Fields
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            NLP-normalized entities with individual field extraction confidence scores:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Owner Name', val: fields.owner_name, key: 'owner_name' },
              { label: "Father's / Guardian Name", val: fields.father_or_guardian_name, key: 'father_or_guardian_name' },
              { label: 'Survey / Dag Number', val: fields.survey_number, key: 'survey_number', isKey: true },
              { label: 'Plot / Khasra Number', val: fields.plot_number, key: 'plot_number' },
              { label: 'Total Parcel Area', val: `${fields.area} Acres`, key: 'area', isKey: true },
              { label: 'Village / Mauza', val: fields.village, key: 'village' },
              { label: 'District', val: fields.district, key: 'district' },
              { label: 'State', val: fields.state, key: 'state' },
              { label: 'Land Classification', val: fields.land_type, key: 'land_type' },
              { label: 'Registration Deed Number', val: fields.registration_number, key: 'registration_number' },
              { label: 'Mutation Case Number', val: fields.mutation_number, key: 'mutation_number' },
              { label: 'Document Date', val: fields.document_date, key: 'document_date' },
              { label: 'Address', val: fields.address, key: 'address' }
            ].map((f) => {
              const conf = confidences[f.key] || 90.0;
              return (
                <div 
                  key={f.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: f.isKey ? '#f0f9ff' : '#f8fafc',
                    border: `1px solid ${f.isKey ? '#bae6fd' : '#e2e8f0'}`
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      {f.label}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {f.val || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not detected</span>}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: conf >= 90 ? '#059669' : '#d97706' }}>
                      {conf}%
                    </span>
                    <StatusBadge status={conf} type="confidence" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Warnings & Duplicate Alert callouts if any */}
          {validation_issues.length > 0 && (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#dc2626', marginBottom: '6px' }}>
                ⚠ Validation Engine Flags ({validation_issues.length}):
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '12px', color: '#991b1b' }}>
                {validation_issues.map((iss, i) => (
                  <li key={i}>{iss.message}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
