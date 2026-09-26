import React, { useState, useEffect } from 'react';
import { 
  LandPlot, 
  FileText, 
  ShieldCheck, 
  CopyCheck, 
  History, 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Compass,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { 
  Award, 
  Eye, 
  QrCode, 
  Sparkles, 
  Download 
} from 'lucide-react';
import { recordService, auditService, certificateService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import TrustCertificateView from '../components/TrustCertificateView.jsx';

export default function LandRecordDetailsPage({ recordId, setActiveTab, setSelectedRecordId }) {
  const [record, setRecord] = useState(null);
  const [audits, setAudits] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [activeCert, setActiveCert] = useState(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recordId) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const data = await recordService.get(recordId);
        setRecord(data);
        const auditLogs = await auditService.list({ record_id: recordId });
        setAudits(auditLogs);
        try {
          const certs = await certificateService.listForRecord(recordId);
          setCertificates(certs);
        } catch (cErr) {
          console.warn('Could not fetch certificates:', cErr);
        }
      } catch (err) {
        console.error('Error fetching record details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [recordId]);

  const handleGenerateCertificate = async () => {
    if (!record) return;
    setGeneratingCert(true);
    try {
      const newCert = await certificateService.generate(record.id);
      setActiveCert(newCert);
      const certs = await certificateService.listForRecord(record.id);
      setCertificates(certs);
      const auditLogs = await auditService.list({ record_id: record.id });
      setAudits(auditLogs);
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Certificate generation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGeneratingCert(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="card">Loading land record details...</div></div>;
  }

  if (!record) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No Record Selected</h3>
          <button className="btn btn-primary" style={{ marginTop: '14px' }} onClick={() => setActiveTab('records')}>
            Browse Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('records')}>
            <ArrowLeft size={16} />
            <span>Back to Repository</span>
          </button>
          <div className="page-title">
            <h2>Digital Cadastral Record #{record.id}</h2>
            <p>{record.village}, {record.district}, {record.state}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Buyer Trust Certificate Button (Requirement 1) */}
          {certificates.length > 0 ? (
            <button 
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setActiveCert(certificates[0])}
              title="View generated Buyer Trust Certificate"
            >
              <Award size={15} />
              <span>View Trust Certificate ({certificates[0].trust_status === 'VERIFIED' ? 'Verified' : 'Active'})</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#0f4c81', borderColor: '#0f4c81', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={generatingCert}
              onClick={handleGenerateCertificate}
              title="Generate pre-purchase Buyer Trust Certificate"
            >
              <Award size={15} />
              <span>{generatingCert ? 'Generating Certificate...' : 'Generate Trust Certificate'}</span>
            </button>
          )}

          <button 
            className="btn btn-accent btn-sm"
            onClick={() => {
              setSelectedRecordId(record.id);
              setActiveTab('gis-search');
            }}
            title="Locate this parcel on GIS interactive satellite map"
          >
            <Compass size={14} />
            <span>Locate on GIS Map</span>
          </button>

          <button 
            className="btn btn-outline btn-sm"
            onClick={() => window.open(record.latitude ? `https://www.google.com/maps?q=${record.latitude},${record.longitude}&z=18` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.village + ' ' + record.district)}`, '_blank')}
            title="View on Google Maps"
          >
            <ExternalLink size={14} />
            <span>Google Maps</span>
          </button>

          <StatusBadge status={record.status} />
          <StatusBadge status={record.OCR_confidence} type="confidence" />
        </div>
      </div>

      {/* Grid of Deed Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Section 1: Ownership Information */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            1. Ownership & Legal Holder
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div><span style={{ color: '#64748b' }}>Primary Owner Name:</span> <strong style={{ color: '#0f172a' }}>{record.owner_name}</strong></div>
            <div><span style={{ color: '#64748b' }}>Father's / Guardian's Name:</span> <strong>{record.father_or_guardian_name || 'N/A'}</strong></div>
            <div><span style={{ color: '#64748b' }}>Residential Address:</span> <div>{record.address}</div></div>
          </div>
        </div>

        {/* Section 2: Cadastral Land Parcel Information */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81' }}>
              2. Cadastral Land Information
            </h3>
            <button 
              className="btn btn-outline btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px', color: '#0284c7' }}
              onClick={() => {
                setSelectedRecordId(record.id);
                setActiveTab('gis-search');
              }}
            >
              <Compass size={12} />
              <span>GIS Boundary</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div><span style={{ color: '#64748b' }}>Survey / Dag Number:</span> <strong style={{ color: '#0369a1', fontSize: '15px' }}>{record.survey_number}</strong></div>
            <div><span style={{ color: '#64748b' }}>Plot / Khasra Number:</span> <strong>{record.plot_number || 'N/A'}</strong></div>
            <div><span style={{ color: '#64748b' }}>Khatian / Khatauni Number:</span> <strong style={{ fontFamily: 'var(--font-mono)' }}>{record.khatian_number || 'N/A'}</strong></div>
            <div><span style={{ color: '#64748b' }}>Total Parcel Extent:</span> <strong style={{ fontSize: '15px' }}>{record.area} Acres</strong></div>
            <div><span style={{ color: '#64748b' }}>Land Classification:</span> <span>{record.land_type}</span></div>
            <div><span style={{ color: '#64748b' }}>Village / Mauza:</span> <span>{record.village}</span></div>
            <div><span style={{ color: '#64748b' }}>District & State:</span> <span>{record.district}, {record.state}</span></div>
            {record.latitude && (
              <div style={{ paddingTop: '6px', borderTop: '1px dashed #e2e8f0', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>GIS Geodetic Coordinates: </span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                  {record.latitude.toFixed(5)}° N, {record.longitude.toFixed(5)}° E
                </strong>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Registration & Mutation Tracking */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            3. Registration & Mutation Tracking
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div><span style={{ color: '#64748b' }}>Deed Registration Number:</span> <strong style={{ fontFamily: 'var(--font-mono)' }}>{record.registration_number || 'N/A'}</strong></div>
            <div><span style={{ color: '#64748b' }}>Mutation Case Register No:</span> <strong style={{ fontFamily: 'var(--font-mono)' }}>{record.mutation_number || 'Pending'}</strong></div>
            <div><span style={{ color: '#64748b' }}>Document Date:</span> <span>{record.document_date || 'N/A'}</span></div>
            <div><span style={{ color: '#64748b' }}>Digitization Timestamp:</span> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{new Date(record.created_at).toLocaleString()}</span></div>
          </div>
        </div>

        {/* Section 4: Intelligence & AI Quality Assessment */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            4. AI Digitization & Confidence Scores
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>OCR Extraction Quality:</span>
              <strong style={{ color: '#0f4c81' }}>{record.OCR_confidence}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Validation Engine Integrity:</span>
              <strong style={{ color: '#059669' }}>{record.validation_score}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Duplicate / Collision Risk:</span>
              <strong style={{ color: record.duplicate_score >= 70 ? '#dc2626' : '#64748b' }}>{record.duplicate_score}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Current Record Status:</span>
              <StatusBadge status={record.status} />
            </div>
          </div>
        </div>

      </div>

      {/* Section: Buyer Trust Certificate Verification Hub (Requirement 1 & 2) */}
      <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #0f4c81', background: '#fafcff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#0f4c81" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f4c81', margin: 0 }}>
                Buyer Trust Certificate
              </h3>
              {certificates.length > 0 && (
                <span className={`badge ${certificates[0].trust_status === 'VERIFIED' ? 'badge-verified' : certificates[0].trust_status === 'VERIFIED_WITH_CONDITIONS' ? 'badge-pending' : 'badge-duplicate'}`}>
                  {certificates[0].trust_status}
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Verified pre-purchase due-diligence credential for prospective buyers summarizing OCR transcription, cadastral rules, title collision, and GIS georeference.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {certificates.length > 0 ? (
              <>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveCert(certificates[0])}
                >
                  <Eye size={14} />
                  <span>View Full Certificate</span>
                </button>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={generatingCert}
                  onClick={handleGenerateCertificate}
                  title="Generate a fresh certificate snapshot"
                >
                  <Award size={14} />
                  <span>{generatingCert ? 'Updating...' : 'Re-Generate'}</span>
                </button>
                <button 
                  className="btn btn-accent btn-sm"
                  onClick={() => {
                    if (setActiveTab) setActiveTab('verify-certificate');
                  }}
                  title="Verify on Public Portal"
                >
                  <FileCheck size={14} />
                  <span>Verify Portal</span>
                </button>
              </>
            ) : (
              <button 
                className="btn btn-primary btn-sm"
                disabled={generatingCert}
                onClick={handleGenerateCertificate}
              >
                <Award size={14} />
                <span>{generatingCert ? 'Generating Certificate...' : 'Generate Trust Certificate'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Readiness Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
            <CheckCircle size={14} />
            <span>Document Validation: <strong>{record.validation_score}% Compliance</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: record.duplicate_score < 30 ? '#059669' : '#d97706' }}>
            <CheckCircle size={14} />
            <span>Duplicate & Collision Check: <strong>{record.duplicate_score}% Risk</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669' }}>
            <CheckCircle size={14} />
            <span>OCR Confidence: <strong>{record.OCR_confidence}% Transcription</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: record.latitude ? '#059669' : '#d97706' }}>
            <CheckCircle size={14} />
            <span>GIS Georeference: <strong>{record.latitude ? 'Polygon Georeferenced' : 'Village Centroid'}</strong></span>
          </div>
        </div>

        {certificates.length > 0 && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Active Certificate Reference: </span>
              <strong className="font-mono" style={{ color: '#0f4c81', fontSize: '13px' }}>
                {certificates[0].certificate_id}
              </strong>
              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '10px' }}>
                Issued: {new Date(certificates[0].issued_at).toLocaleDateString()} • Trust Index: <strong>{certificates[0].trust_score}%</strong>
              </span>
            </div>
            <button 
              className="btn btn-outline btn-sm"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => setActiveCert(certificates[0])}
            >
              Open Full Certificate
            </button>
          </div>
        )}
      </div>

      {/* Section 5: Field Validation Details */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          5. Field-by-Field Validation Status
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Extracted Value</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Rule Diagnostics</th>
              </tr>
            </thead>
            <tbody>
              {record.validation_results && record.validation_results.length > 0 ? (
                record.validation_results.map((vr) => (
                  <tr key={vr.id}>
                    <td style={{ fontWeight: 600 }}>{vr.field_name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{vr.extracted_value || 'N/A'}</td>
                    <td><StatusBadge status={vr.validation_status} /></td>
                    <td><StatusBadge status={vr.confidence} type="confidence" /></td>
                    <td style={{ fontSize: '12px' }}>{vr.validation_message}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                    No validation flags. All standard rules passed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6: Tamper-Evident Audit History */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
          6. Tamper-Evident Audit Trail
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User / Operator</th>
                <th>Audit Details</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '16px' }}>
                    Initial automated entry generated upon digitization.
                  </td>
                </tr>
              ) : (
                audits.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b' }}>{a.timestamp}</td>
                    <td style={{ fontWeight: 600, color: '#0f4c81' }}>{a.action}</td>
                    <td>{a.user_name}</td>
                    <td style={{ fontSize: '12px', color: '#475569' }}>{a.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View for Trust Certificate */}
      {activeCert && (
        <div className="modal-backdrop" style={{ zIndex: 1000, overflowY: 'auto', padding: '30px 10px' }}>
          <div className="modal-card" style={{ maxWidth: '960px', width: '100%', padding: '0', background: 'transparent', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button 
                className="btn btn-outline btn-sm no-print"
                style={{ background: '#ffffff', color: '#0f172a' }}
                onClick={() => setActiveCert(null)}
              >
                ✕ Close Certificate
              </button>
            </div>
            <TrustCertificateView 
              certificate={activeCert} 
              onBack={() => setActiveCert(null)}
              onNavigateToVerify={(cId) => {
                setActiveCert(null);
                if (setActiveTab) setActiveTab('verify-certificate');
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
