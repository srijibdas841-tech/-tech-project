import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  Copy, 
  Check, 
  Plus, 
  Download, 
  Building2, 
  FileCheck2, 
  RefreshCw,
  LandPlot
} from 'lucide-react';
import { certificateService, recordService } from '../services/api.js';
import TrustCertificateView from '../components/TrustCertificateView.jsx';

export default function TrustCertificatesPage({ 
  setActiveTab, 
  setSelectedRecordId,
  selectedCertId = null,
  setSelectedCertId = null
}) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Quick generation modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [eligibleRecords, setEligibleRecords] = useState([]);
  const [genLoading, setGenLoading] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await certificateService.list(100);
      setCertificates(data);

      // If selectedCertId passed, open it immediately
      if (selectedCertId) {
        const found = data.find(c => c.certificate_id.toLowerCase() === selectedCertId.toLowerCase());
        if (found) {
          setActiveCertificate(found);
        } else {
          // Fetch directly by ID
          try {
            const certData = await certificateService.get(selectedCertId);
            setActiveCertificate(certData);
          } catch (e) {
            console.warn('Could not fetch initial cert:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [selectedCertId]);

  const handleOpenGenModal = async () => {
    setShowGenModal(true);
    try {
      const recs = await recordService.list({ limit: 50 });
      setEligibleRecords(recs);
    } catch (e) {
      console.error('Error loading records for generation:', e);
    }
  };

  const handleGenerateForRecord = async (recordId) => {
    setGenLoading(true);
    try {
      const newCert = await certificateService.generate(recordId);
      setShowGenModal(false);
      await fetchCertificates();
      setActiveCertificate(newCert);
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Could not generate certificate: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGenLoading(false);
    }
  };

  const handleCopy = (id, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If viewing a single certificate
  if (activeCertificate) {
    return (
      <div className="page-container">
        <TrustCertificateView 
          certificate={activeCertificate} 
          onBack={() => {
            setActiveCertificate(null);
            if (setSelectedCertId) setSelectedCertId(null);
          }}
          onNavigateToVerify={(cId) => {
            if (setSelectedCertId) setSelectedCertId(cId);
            setActiveTab('verify-certificate');
          }}
        />
      </div>
    );
  }

  // Filtered list
  const filtered = certificates.filter(c => {
    const matchesStatus = !statusFilter || c.trust_status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;
    const matchesSearch = 
      (c.certificate_id && c.certificate_id.toLowerCase().includes(term)) ||
      (c.owner_name && c.owner_name.toLowerCase().includes(term)) ||
      (c.village && c.village.toLowerCase().includes(term)) ||
      (c.district && c.district.toLowerCase().includes(term)) ||
      (c.survey_number && c.survey_number.toLowerCase().includes(term)) ||
      (c.plot_number && c.plot_number.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  // Calculate summary stats
  const totalCount = certificates.length;
  const verifiedCount = certificates.filter(c => c.trust_status === 'VERIFIED').length;
  const conditionalCount = certificates.filter(c => c.trust_status === 'VERIFIED_WITH_CONDITIONS').length;
  const reviewCount = certificates.filter(c => c.trust_status === 'REQUIRES_FURTHER_VERIFICATION').length;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <h2>Buyer Trust Certificates Repository</h2>
          <p>Official registry of generated land-verification certificates for prospective buyers and conveyancing due diligence</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline btn-sm" onClick={fetchCertificates} title="Refresh">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={handleOpenGenModal}>
            <Plus size={15} />
            <span>Generate New Certificate</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid #0f4c81' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Issued</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f4c81', marginTop: '4px' }}>{totalCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Active Trust Certificates</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#059669', fontWeight: 700 }}>Verified Tier</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{verifiedCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Clean Title & High Confidence</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#d97706', fontWeight: 700 }}>Verified with Conditions</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{conditionalCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Conditional Clearance</div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#dc2626', fontWeight: 700 }}>Requires Review</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{reviewCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Collision or Boundary Flagged</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="Search by Certificate ID, Owner, Plot, Survey, or Village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          </div>

          <div style={{ width: '220px' }}>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Trust Statuses</option>
              <option value="VERIFIED">Verified (Green)</option>
              <option value="VERIFIED_WITH_CONDITIONS">Verified with Conditions (Amber)</option>
              <option value="REQUIRES_FURTHER_VERIFICATION">Requires Further Verification (Red)</option>
            </select>
          </div>

          {searchTerm || statusFilter ? (
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Certificate Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Trust Status</th>
                <th>Trust Index</th>
                <th>Parcel Reference</th>
                <th>Registered Owner</th>
                <th>Location</th>
                <th>Issue Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Loading Trust Certificates...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <Award size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                    <div>No Buyer Trust Certificates match your search criteria.</div>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ marginTop: '12px' }}
                      onClick={handleOpenGenModal}
                    >
                      Generate First Certificate
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((cert) => {
                  const statusClass = 
                    cert.trust_status === 'VERIFIED' ? 'badge-verified' :
                    cert.trust_status === 'VERIFIED_WITH_CONDITIONS' ? 'badge-pending' : 'badge-duplicate';
                  
                  return (
                    <tr 
                      key={cert.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveCertificate(cert)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="font-mono" style={{ fontWeight: 700, color: '#0f4c81', fontSize: '12px' }}>
                            {cert.certificate_id}
                          </span>
                          <button 
                            className="btn-icon"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', color: '#94a3b8' }}
                            onClick={(e) => handleCopy(cert.certificate_id, e)}
                            title="Copy Certificate ID"
                          >
                            {copiedId === cert.certificate_id ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Record #{cert.record_id}</div>
                      </td>

                      <td>
                        <span className={`badge ${statusClass}`} style={{ fontSize: '11px' }}>
                          {cert.trust_status === 'VERIFIED' ? '✔ Verified' :
                           cert.trust_status === 'VERIFIED_WITH_CONDITIONS' ? '⚠ With Conditions' : '✖ Requires Review'}
                        </span>
                      </td>

                      <td>
                        <strong style={{ color: '#0f4c81', fontFamily: 'var(--font-mono)' }}>
                          {cert.trust_score}%
                        </strong>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>Plot #{cert.plot_number || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Survey: {cert.survey_number} • {cert.area} Acres</div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cert.owner_name}</div>
                        {cert.father_or_guardian_name && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>S/o: {cert.father_or_guardian_name}</div>
                        )}
                      </td>

                      <td>
                        <div>{cert.village}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{cert.district}, {cert.state}</div>
                      </td>

                      <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => setActiveCertificate(cert)}
                            title="View Certificate"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          <button 
                            className="btn btn-accent btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => {
                              if (setSelectedCertId) setSelectedCertId(cert.certificate_id);
                              setActiveTab('verify-certificate');
                            }}
                            title="Verify on Public Portal"
                          >
                            <FileCheck2 size={12} />
                            <span>Verify</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Quick Generate for Record */}
      {showGenModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '650px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f4c81' }}>
                Generate Buyer Trust Certificate
              </h3>
              <button 
                className="btn-icon" 
                onClick={() => setShowGenModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              Select an existing digitized land record to generate an official, tamper-evident Buyer Trust Certificate with AI score evaluation, GIS georeference, and QR code verification:
            </p>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {eligibleRecords.map((r) => (
                <div 
                  key={r.id}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                      Record #{r.id} — Plot #{r.plot_number || 'N/A'}, Survey #{r.survey_number}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      Owner: <strong>{r.owner_name}</strong> • {r.village}, {r.district}, {r.state} ({r.area} Acres)
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Status: <strong style={{ color: r.status === 'VERIFIED' ? '#059669' : '#d97706' }}>{r.status}</strong> • OCR Conf: {r.OCR_confidence}% • Val: {r.validation_score}%
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary btn-sm"
                    disabled={genLoading}
                    onClick={() => handleGenerateForRecord(r.id)}
                  >
                    <span>Generate</span>
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowGenModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
