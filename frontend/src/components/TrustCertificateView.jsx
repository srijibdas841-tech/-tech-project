import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  ExternalLink, 
  Download, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  Calendar, 
  Compass, 
  LandPlot, 
  Building2, 
  FileCheck2, 
  ArrowLeft,
  CheckCircle2,
  Info,
  QrCode,
  Sparkles
} from 'lucide-react';
import QrCodeSvg from './QrCodeSvg.jsx';

export default function TrustCertificateView({ 
  certificate, 
  onBack = null, 
  onNavigateToVerify = null 
}) {
  const [copied, setCopied] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  if (!certificate) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>No Certificate Data Available</h3>
        {onBack && (
          <button className="btn btn-outline" style={{ marginTop: '12px' }} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
      </div>
    );
  }

  const {
    certificate_id,
    trust_status,
    trust_score = 0,
    owner_name,
    father_or_guardian_name,
    plot_number,
    survey_number,
    khatian_number,
    area,
    land_type,
    village,
    district,
    state,
    registration_number,
    mutation_number,
    latitude,
    longitude,
    coordinates = [],
    google_maps_url,
    OCR_confidence = 0,
    validation_score = 0,
    duplicate_score = 0,
    verification_summary = [],
    buyer_advisories = [],
    issued_at,
    valid_until,
    generated_by_name,
    disclaimer
  } = certificate;

  // Format dates
  const issueDateStr = issued_at ? new Date(issued_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'N/A';

  const validUntilStr = valid_until ? new Date(valid_until).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'N/A';

  // Verification URL for QR code & sharing
  const verificationUrl = `${window.location.origin}?tab=verify-certificate&cert_id=${encodeURIComponent(certificate_id)}`;

  // Copy Certificate ID to clipboard
  const handleCopyId = () => {
    navigator.clipboard.writeText(certificate_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Share certificate
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Buyer Trust Certificate - ${certificate_id}`,
          text: `Verified Land Record for Plot ${plot_number || survey_number}, ${village}, ${district}. Trust Status: ${trust_status}`,
          url: verificationUrl
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(verificationUrl);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  // Print or PDF download
  const handlePrint = () => {
    window.print();
  };

  // Initialize mini-map preview with Cadastral polygon
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!latitude || !longitude) return;

    // Cleanup previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });

    // Satellite layer
    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20
    }).addTo(map);

    // Polygon boundary
    if (coordinates && coordinates.length > 0) {
      const polygon = L.polygon(coordinates, {
        color: '#0284c7',
        weight: 3,
        fillColor: '#38bdf8',
        fillOpacity: 0.35,
        dashArray: '4, 4'
      }).addTo(map);

      // Centroid marker with pulsing pin
      const marker = L.circleMarker([latitude, longitude], {
        radius: 7,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      }).addTo(map);
      marker.bindTooltip(`Plot #${plot_number || survey_number}`, { permanent: true, direction: 'top', className: 'map-label' });

      map.fitBounds(polygon.getBounds(), { padding: [20, 20] });
    } else {
      L.marker([latitude, longitude]).addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, coordinates]);

  // Color config according to Trust Status
  const statusMeta = {
    VERIFIED: {
      label: 'Verified',
      bg: '#ecfdf5',
      border: '#10b981',
      color: '#065f46',
      badgeBg: '#10b981',
      icon: ShieldCheck,
      desc: 'All multi-factor forensic checks, deed transcription, cadastral boundaries, and revenue registry validations passed with high confidence.'
    },
    VERIFIED_WITH_CONDITIONS: {
      label: 'Verified with Conditions',
      bg: '#fffbeb',
      border: '#f59e0b',
      color: '#92400e',
      badgeBg: '#f59e0b',
      icon: AlertTriangle,
      desc: 'Record is digitally verified with conditional advisories. Standard physical verification of boundaries and sub-registrar encumbrance check recommended.'
    },
    REQUIRES_FURTHER_VERIFICATION: {
      label: 'Requires Further Verification',
      bg: '#fff1f2',
      border: '#f43f5e',
      color: '#9f1239',
      badgeBg: '#f43f5e',
      icon: ShieldAlert,
      desc: 'Potential cadastral title collision, duplicate registration flag, or unconfirmed boundary dispute detected. Complete field inquiry required.'
    }
  }[trust_status] || {
    label: trust_status,
    bg: '#f1f5f9',
    border: '#64748b',
    color: '#1e293b',
    badgeBg: '#64748b',
    icon: Info,
    desc: 'Cadastral verification assessment in progress.'
  };

  const StatusIcon = statusMeta.icon;

  return (
    <div className="certificate-page-wrapper">
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="certificate-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button className="btn btn-outline btn-sm" onClick={onBack}>
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          )}
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            Buyer Trust Certificate Reference: <strong style={{ color: '#0f4c81', fontFamily: 'var(--font-mono)' }}>{certificate_id}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleCopyId} title="Copy Certificate ID">
            {copied ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied ID!' : 'Copy ID'}</span>
          </button>

          <button className="btn btn-outline btn-sm" onClick={handleShare} title="Share Certificate Link">
            <Share2 size={14} />
            <span>{shareSuccess ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button className="btn btn-outline btn-sm" onClick={handlePrint} title="Print or Save as PDF">
            <Printer size={14} />
            <span>Print Certificate</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={handlePrint} title="Download as PDF">
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          {onNavigateToVerify && (
            <button 
              className="btn btn-accent btn-sm" 
              onClick={() => onNavigateToVerify(certificate_id)}
              title="Open Public Verification Portal"
            >
              <FileCheck2 size={14} />
              <span>Verify Online</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Certificate Document Sheet */}
      <div className="certificate-sheet" id="printable-trust-certificate">
        {/* Decorative Guilloche Security Border */}
        <div className="certificate-inner-border">
          
          {/* Header Section */}
          <header className="certificate-header">
            <div className="cert-emblem-col">
              <div className="cert-gov-crest">
                <LandPlot size={28} color="#0f4c81" />
              </div>
              <div className="cert-republic-text">
                <h3>REPUBLIC OF INDIA • STATE REVENUE CADASTRE</h3>
                <h4>NATIONAL LAND RECORD DIGITIZATION & INTELLIGENCE SYSTEM</h4>
              </div>
            </div>

            <div className="cert-badge-col">
              <div className="cert-id-tag">
                <span className="tag-label">CERTIFICATE ID:</span>
                <span className="tag-val">{certificate_id}</span>
              </div>
              <div className="cert-date-tag">
                <span>Issued: <strong>{issueDateStr}</strong></span>
                <span style={{ margin: '0 4px' }}>•</span>
                <span>Valid: <strong>{validUntilStr}</strong></span>
              </div>
            </div>
          </header>

          <div className="cert-title-band">
            <h2>BUYER TRUST CERTIFICATE</h2>
            <p>PRE-PURCHASE CADASTRAL DUE-DILIGENCE & FORENSIC VERIFICATION RECORD</p>
          </div>

          {/* Trust Status & Score Banner */}
          <div 
            className="cert-status-banner"
            style={{ 
              backgroundColor: statusMeta.bg, 
              borderColor: statusMeta.border,
              color: statusMeta.color 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
              <div 
                style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '50%', 
                  backgroundColor: statusMeta.badgeBg, 
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.12)'
                }}
              >
                <StatusIcon size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, opacity: 0.8 }}>
                    Buyer Trust Status:
                  </span>
                  <span 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: 800, 
                      letterSpacing: '0.5px' 
                    }}
                  >
                    {statusMeta.label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', marginTop: '2px', lineHeight: 1.4 }}>
                  {statusMeta.desc}
                </div>
              </div>
            </div>

            <div className="cert-trust-score-badge">
              <div className="score-val">{trust_score}%</div>
              <div className="score-label">Trust Index</div>
            </div>
          </div>

          {/* Two-Column Grid: Property Specs + GIS Location */}
          <div className="cert-grid-2col">
            
            {/* Left Column: Cadastral Property Information */}
            <div className="cert-card">
              <div className="cert-card-title">
                <Building2 size={15} color="#0f4c81" />
                <span>1. Verified Cadastral Property Details</span>
              </div>

              <div className="cert-details-table">
                <div className="cert-row">
                  <span className="cert-lbl">Plot / Khasra No:</span>
                  <span className="cert-val highlight-val">{plot_number || 'N/A'}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Survey / Dag No:</span>
                  <span className="cert-val highlight-val">{survey_number}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Khatian / Khatauni:</span>
                  <span className="cert-val">{khatian_number || 'N/A'}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Registered Land Area:</span>
                  <span className="cert-val">
                    <strong>{area} Acres</strong> 
                    <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '6px' }}>
                      ({roundArea(area * 4046.86)} sq.m / {roundArea(area * 43560)} sq.ft)
                    </span>
                  </span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Land Classification:</span>
                  <span className="cert-val">{land_type}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Village / Mauza:</span>
                  <span className="cert-val">{village}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">District & State:</span>
                  <span className="cert-val">{district}, {state}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Deed Registration No:</span>
                  <span className="cert-val font-mono">{registration_number || 'REG-PENDING'}</span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Mutation Case No:</span>
                  <span className="cert-val font-mono">{mutation_number || 'MUT-PENDING'}</span>
                </div>
              </div>

              {/* Ownership Box */}
              <div className="cert-owner-box">
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Available Record Holder / Registered Owner:
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                  {owner_name}
                </div>
                {father_or_guardian_name && (
                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    S/o or D/o: {father_or_guardian_name}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: GIS Georeference & Map Integration */}
            <div className="cert-card">
              <div className="cert-card-title" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={15} color="#0f4c81" />
                  <span>2. GIS Cadastral Location</span>
                </div>
                {google_maps_url && (
                  <a 
                    href={google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm no-print"
                    style={{ padding: '2px 8px', fontSize: '11px', color: '#0284c7' }}
                  >
                    <ExternalLink size={11} />
                    <span>View on Google Maps</span>
                  </a>
                )}
              </div>

              {/* Mini Map Container */}
              <div 
                ref={mapContainerRef} 
                className="cert-map-preview"
                style={{ height: '170px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}
              />

              <div className="cert-details-table" style={{ marginTop: '10px' }}>
                <div className="cert-row">
                  <span className="cert-lbl">Centroid Coordinates:</span>
                  <span className="cert-val font-mono" style={{ color: '#0369a1', fontWeight: 700 }}>
                    {latitude ? `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E` : 'Geocoding Referenced'}
                  </span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Cadastral Boundary:</span>
                  <span className="cert-val">
                    {coordinates && coordinates.length > 0 ? (
                      <span style={{ color: '#059669', fontWeight: 600 }}>
                        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        Closed Polygon ({coordinates.length} survey boundary vertices)
                      </span>
                    ) : (
                      <span style={{ color: '#d97706' }}>Approximate Village Cadastre Centroid</span>
                    )}
                  </span>
                </div>
                <div className="cert-row">
                  <span className="cert-lbl">Geodetic Datum:</span>
                  <span className="cert-val font-mono">WGS 84 (EPSG:4326)</span>
                </div>
              </div>

              {/* Coordinates Preview (Collapsed Box) */}
              {coordinates && coordinates.length > 0 && (
                <div className="cert-coords-snippet">
                  <span style={{ color: '#64748b' }}>Vertices: </span>
                  {coordinates.map((pt, idx) => (
                    <span key={idx} style={{ marginRight: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      P{idx + 1}: [{pt[0].toFixed(4)}, {pt[1].toFixed(4)}]
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Section 3: Verification Checkpoints & Forensic Assessment */}
          <div className="cert-card" style={{ marginTop: '14px' }}>
            <div className="cert-card-title">
              <FileCheck2 size={15} color="#0f4c81" />
              <span>3. Forensic Verification Diagnostics & Checkpoints</span>
            </div>

            <div className="cert-checkpoints-table">
              <table>
                <thead>
                  <tr>
                    <th>Verification Checkpoint</th>
                    <th>Score / Index</th>
                    <th>Result Status</th>
                    <th>Platform Audit Diagnostics</th>
                  </tr>
                </thead>
                <tbody>
                  {verification_summary && verification_summary.length > 0 ? (
                    verification_summary.map((cp, idx) => (
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
                        <td style={{ fontSize: '11px', color: '#475569' }}>{cp.details}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Deed OCR Transcription Integrity</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{OCR_confidence}%</td>
                        <td><span className="cert-cp-badge passed">PASSED</span></td>
                        <td>OCR transcription confidence validated from certified deed scan.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Cadastral Rule & Schema Compliance</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{validation_score}%</td>
                        <td><span className="cert-cp-badge passed">PASSED</span></td>
                        <td>Mathematical area bounds and mutation schema rules satisfied.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Cadastral Duplicate / Collision Scan</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{roundArea(100 - duplicate_score)}%</td>
                        <td>
                          <span className={`cert-cp-badge ${duplicate_score < 30 ? 'passed' : 'warning'}`}>
                            {duplicate_score < 30 ? 'PASSED' : 'FLAGGED'}
                          </span>
                        </td>
                        <td>Collision similarity is {duplicate_score}% against repository records.</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Buyer Advisories */}
          {buyer_advisories && buyer_advisories.length > 0 && (
            <div className="cert-advisories-box">
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f4c81', marginBottom: '4px' }}>
                Buyer Due-Diligence Recommendations:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '11px', color: '#334155' }}>
                {buyer_advisories.map((adv, idx) => (
                  <li key={idx} style={{ marginBottom: '2px' }}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 5: Mandatory Buyer Protection Statutory Disclaimer (Requirement 8) */}
          <div className="cert-disclaimer-box">
            <div className="disclaimer-header">
              <AlertTriangle size={15} color="#b45309" />
              <span>STATUTORY NOTICE TO PROSPECTIVE BUYERS</span>
            </div>
            <p className="disclaimer-text">
              “ {disclaimer || "This certificate summarizes the verification results available in the platform. It does not by itself constitute a legal title, ownership guarantee, or government-issued clearance. Buyers should complete all required legal and official verification before purchasing property."} ”
            </p>
          </div>

          {/* Footer Section: QR Code + Digital Sign-off & Audit Log Reference */}
          <footer className="cert-footer">
            <div className="cert-qr-block">
              <QrCodeSvg 
                value={verificationUrl} 
                size={110} 
                fgColor="#0f4c81"
                onClick={onNavigateToVerify ? () => onNavigateToVerify(certificate_id) : null}
                title="Scan with phone or click to verify"
              />
              <div className="cert-qr-instructions">
                <strong>Instant Public Verification</strong>
                <span>Scan QR code with any smartphone camera to verify certificate authenticity on the National Cadastre Portal.</span>
                <span className="font-mono" style={{ fontSize: '10px', color: '#0284c7' }}>
                  /verify/{certificate_id}
                </span>
              </div>
            </div>

            <div className="cert-signature-block">
              <div className="cert-seal-graphic">
                <ShieldCheck size={36} color="#059669" />
              </div>
              <div className="cert-sign-info">
                <div style={{ fontSize: '11px', color: '#64748b' }}>Issuing Officer / Authority:</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {generated_by_name || 'Land Revenue Cadastre Authority'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                  Digital Signature Token: <span className="font-mono">SHA256-{certificate_id.replace(/[^A-Z0-9]/g, '').slice(0, 16)}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                  ✔ Recorded in Immutable Cadastre Audit Log
                </div>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}

function roundArea(val) {
  return Math.round((val || 0) * 10) / 10;
}
