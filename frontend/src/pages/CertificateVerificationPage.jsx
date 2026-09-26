import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Compass, 
  FileCheck2, 
  ArrowRight, 
  Printer, 
  Copy, 
  Check, 
  QrCode, 
  Calendar, 
  User, 
  FileText,
  LandPlot,
  Info
} from 'lucide-react';
import { certificateService } from '../services/api.js';

export default function CertificateVerificationPage({ 
  initialCertId = '', 
  onViewCertificate = null,
  setActiveTab = null 
}) {
  const [certIdInput, setCertIdInput] = useState(initialCertId);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-verify if initialCertId provided (e.g. via QR scan or URL param)
  useEffect(() => {
    if (initialCertId && initialCertId.trim()) {
      setCertIdInput(initialCertId.trim());
      handleVerify(initialCertId.trim());
    }
  }, [initialCertId]);

  const handleVerify = async (idToVerify) => {
    const targetId = (idToVerify || certIdInput).trim();
    if (!targetId) {
      setErrorMsg('Please enter a valid Certificate Reference Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setVerificationResult(null);

    try {
      const data = await certificateService.verify(targetId);
      setVerificationResult(data);
    } catch (err) {
      console.error('Verification query failed:', err);
      const detail = err.response?.data?.detail || `Certificate '${targetId}' could not be verified in the registry.`;
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Strip out domain if URL was pasted
        let clean = text.trim();
        if (clean.includes('cert_id=')) {
          clean = clean.split('cert_id=')[1].split('&')[0];
        } else if (clean.includes('/verify/')) {
          clean = clean.split('/verify/')[1].split('?')[0];
        }
        setCertIdInput(clean);
        handleVerify(clean);
      }
    } catch (e) {
      // Clipboard read permission might not be granted
    }
  };

  const handleCopyRef = () => {
    if (verificationResult?.certificate_id) {
      navigator.clipboard.writeText(verificationResult.certificate_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Buyer Trust Certificate Verification</h2>
          <p>Instant verification portal for prospective buyers to validate certificate authenticity against the live cadastral registry</p>
        </div>

        {setActiveTab && (
          <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('trust-certificates')}>
            <FileText size={15} />
            <span>Browse Certificates</span>
          </button>
        )}
      </div>

      {/* Search & Verification Input Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81', marginBottom: '8px' }}>
          Enter Certificate Reference ID or Scan QR Code
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
          Every official Buyer Trust Certificate generated on Bhoomi Cadastre contains a unique reference formatted as <code style={{ fontFamily: 'var(--font-mono)', color: '#0284c7' }}>BTC-2026-STATE-RECORD-XXXXXX</code>.
        </p>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="e.g. BTC-2026-WB-0001-A4F92B"
              value={certIdInput}
              onChange={(e) => setCertIdInput(e.target.value)}
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '14px', 
                fontWeight: 600,
                letterSpacing: '0.5px',
                paddingLeft: '36px'
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ShieldCheck size={16} />
            <span>{loading ? 'Validating Registry...' : 'Verify Certificate'}</span>
          </button>

          <button 
            type="button" 
            className="btn btn-outline"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <span>Paste ID</span>
          </button>
        </form>

        {/* Quick Demo Test Buttons */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Quick Demos:</span>
          <button 
            type="button"
            className="badge badge-verified"
            style={{ cursor: 'pointer', border: 'none', padding: '4px 8px' }}
            onClick={() => {
              setCertIdInput('BTC-2026-WB-0001-DEMO01');
              handleVerify('BTC-2026-WB-0001-DEMO01');
            }}
          >
            Verified: Moyna Plot 45 (WB)
          </button>
          <button 
            type="button"
            className="badge badge-pending"
            style={{ cursor: 'pointer', border: 'none', padding: '4px 8px' }}
            onClick={() => {
              setCertIdInput('BTC-2026-MH-0003-DEMO02');
              handleVerify('BTC-2026-MH-0003-DEMO02');
            }}
          >
            Conditional: Wagholi Farmland (MH)
          </button>
          <button 
            type="button"
            className="badge badge-duplicate"
            style={{ cursor: 'pointer', border: 'none', padding: '4px 8px' }}
            onClick={() => {
              setCertIdInput('BTC-2026-WB-0002-FLAG01');
              handleVerify('BTC-2026-WB-0002-FLAG01');
            }}
          >
            Conflict / Review: Duplicate Dag (WB)
          </button>
        </div>
      </div>

      {/* Error / Not Found Message */}
      {errorMsg && (
        <div 
          className="card" 
          style={{ 
            backgroundColor: '#fff1f2', 
            borderColor: '#fecdd3', 
            padding: '20px', 
            marginBottom: '20px' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <XCircle size={22} style={{ color: '#e11d48', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#9f1239' }}>
                Certificate Verification Failed
              </div>
              <div style={{ fontSize: '13px', color: '#4c0519', marginTop: '4px' }}>
                {errorMsg}
              </div>
              <div style={{ fontSize: '12px', color: '#881337', marginTop: '8px', lineHeight: 1.4 }}>
                <strong>Buyer Advisory:</strong> Do not proceed with any land transaction without verifying authentic physical deed documents and title records at the local Sub-Registrar / BL&LRO office.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Success Details */}
      {verificationResult && (
        <div className="verification-result-container">
          
          {/* Validity Banner */}
          <div 
            className="card"
            style={{ 
              backgroundColor: verificationResult.is_valid ? '#ecfdf5' : '#fff1f2',
              borderColor: verificationResult.is_valid ? '#10b981' : '#f43f5e',
              marginBottom: '20px',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: verificationResult.is_valid ? '#10b981' : '#f43f5e',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  {verificationResult.is_valid ? <CheckCircle2 size={26} /> : <AlertTriangle size={26} />}
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: verificationResult.is_valid ? '#065f46' : '#9f1239' }}>
                    Authenticity Verification Result:
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: verificationResult.is_valid ? '#065f46' : '#9f1239' }}>
                    {verificationResult.is_valid ? 'AUTHENTIC CERTIFICATE VERIFIED IN REGISTRY' : 'CERTIFICATE INVALID OR EXPIRED'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                    Reference: <strong className="font-mono">{verificationResult.certificate_id}</strong> • Issued by {verificationResult.generated_by_name}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline btn-sm" onClick={handleCopyRef}>
                  {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied Ref!' : 'Copy Reference'}</span>
                </button>
                {onViewCertificate && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onViewCertificate(verificationResult.certificate_id)}
                  >
                    <span>View Full Certificate</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trust Status & Live Registry State */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Status Card 1 */}
            <div className="card">
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Buyer Trust Status Tier
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span 
                  className={`badge ${
                    verificationResult.trust_status === 'VERIFIED' ? 'badge-verified' : 
                    verificationResult.trust_status === 'VERIFIED_WITH_CONDITIONS' ? 'badge-pending' : 'badge-duplicate'
                  }`}
                  style={{ fontSize: '14px', padding: '6px 12px', fontWeight: 700 }}
                >
                  {verificationResult.trust_status === 'VERIFIED' ? '✔ Verified' : 
                   verificationResult.trust_status === 'VERIFIED_WITH_CONDITIONS' ? '⚠ Verified with Conditions' : '✖ Requires Further Verification'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f4c81' }}>
                  ({verificationResult.trust_score}% Trust Rating)
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Evaluated across deed transcription, rule schema, duplicate title collision scan, and GIS cadastral georeference.
              </div>
            </div>

            {/* Status Card 2 */}
            <div className="card">
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Live Registry Record Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span 
                  className={`badge ${
                    verificationResult.current_record_status === 'VERIFIED' ? 'badge-verified' : 
                    verificationResult.current_record_status === 'PENDING_REVIEW' ? 'badge-pending' : 'badge-duplicate'
                  }`}
                  style={{ fontSize: '14px', padding: '6px 12px', fontWeight: 700 }}
                >
                  {verificationResult.current_record_status}
                </span>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                  ✔ Live Sync Active
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Current live standing in the National Cadastre database. Detects subsequent mutations or disputes.
              </div>
            </div>

            {/* Status Card 3 */}
            <div className="card">
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                Issuance & Validity Window
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
                Issued: {new Date(verificationResult.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Valid Until: {new Date(verificationResult.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '8px', fontWeight: 600 }}>
                Record Ref: #{verificationResult.record_id}
              </div>
            </div>

          </div>

          {/* Property Reference & GIS Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            
            {/* Property Reference */}
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} />
                <span>Verified Property Reference</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Plot / Khasra No:</span>
                  <strong style={{ color: '#0f4c81' }}>{verificationResult.property_reference?.plot_number || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Survey / Dag No:</span>
                  <strong style={{ color: '#0284c7' }}>{verificationResult.property_reference?.survey_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Khatian Number:</span>
                  <span className="font-mono">{verificationResult.property_reference?.khatian_number || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Registered Land Area:</span>
                  <strong>{verificationResult.property_reference?.area_acres} Acres ({verificationResult.property_reference?.area_sq_meters} sq.m)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Village / Mauza:</span>
                  <span>{verificationResult.property_reference?.village}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>District & State:</span>
                  <span>{verificationResult.property_reference?.district}, {verificationResult.property_reference?.state}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Registered Owner:</span>
                  <strong>{verificationResult.property_reference?.owner_name}</strong>
                </div>
                {verificationResult.property_reference?.father_or_guardian_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Father's / Guardian's Name:</span>
                    <span>{verificationResult.property_reference?.father_or_guardian_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* GIS Cadastral Summary */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f4c81', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={16} />
                  <span>GIS Cadastral Georeference</span>
                </h3>
                {verificationResult.gis_summary?.google_maps_url && (
                  <a 
                    href={verificationResult.gis_summary.google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#0284c7' }}
                  >
                    <ExternalLink size={12} />
                    <span>Google Maps</span>
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Centroid Coordinates:</span>
                  <span className="font-mono" style={{ color: '#0369a1', fontWeight: 700 }}>
                    {verificationResult.gis_summary?.latitude?.toFixed(5)}° N, {verificationResult.gis_summary?.longitude?.toFixed(5)}° E
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Boundary Geometry:</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    Closed Polygon ({verificationResult.gis_summary?.boundary_vertices_count || 0} vertices)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Spatial Datum:</span>
                  <span className="font-mono">WGS 84 (EPSG:4326)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Cadastral Highlighting:</span>
                  <span style={{ color: '#0284c7' }}>High-Resolution Hybrid Satellite Matched</span>
                </div>
              </div>

              {/* Physical Verification Advisory */}
              <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                <strong style={{ color: '#0f4c81' }}>Buyer GIS Tip:</strong> Verify that on-ground boundary stones and fencing align with these coordinates and the registered extent of {verificationResult.property_reference?.area_acres} Acres.
              </div>
            </div>

          </div>

          {/* Forensic Checkpoints Summary */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Multi-Point Forensic Verification Summary
            </h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Verification Checkpoint</th>
                    <th>Score</th>
                    <th>Result Status</th>
                    <th>Diagnostic Details</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationResult.verification_summary?.map((cp, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{cp.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {cp.score !== undefined ? `${cp.score}%` : 'N/A'}
                      </td>
                      <td>
                        <span className={`cert-cp-badge ${cp.status ? cp.status.toLowerCase() : 'passed'}`}>
                          {cp.status || 'PASSED'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#475569' }}>{cp.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mandatory Buyer Protection Notice (Requirement 8) */}
          <div className="cert-disclaimer-box" style={{ marginBottom: '20px' }}>
            <div className="disclaimer-header">
              <AlertTriangle size={16} color="#b45309" />
              <span>STATUTORY BUYER PROTECTION NOTICE</span>
            </div>
            <p className="disclaimer-text">
              “ {verificationResult.disclaimer || "This certificate summarizes the verification results available in the platform. It does not by itself constitute a legal title, ownership guarantee, or government-issued clearance. Buyers should complete all required legal and official verification before purchasing property."} ”
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
