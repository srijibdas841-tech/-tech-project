import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DocumentUploadPage from './pages/DocumentUploadPage.jsx';
import OcrResultPage from './pages/OcrResultPage.jsx';
import ValidationPage from './pages/ValidationPage.jsx';
import DuplicateDetectionPage from './pages/DuplicateDetectionPage.jsx';
import HumanReviewPage from './pages/HumanReviewPage.jsx';
import SearchRecordsPage from './pages/SearchRecordsPage.jsx';
import LandRecordDetailsPage from './pages/LandRecordDetailsPage.jsx';
import LandSearchGisPage from './pages/LandSearchGisPage.jsx';
import AdminPanelPage from './pages/AdminPanelPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import TrustCertificatesPage from './pages/TrustCertificatesPage.jsx';
import CertificateVerificationPage from './pages/CertificateVerificationPage.jsx';
import { dashboardService } from './services/api.js';

function MainApplication() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState(1);
  const [selectedCertId, setSelectedCertId] = useState('');
  const [lastOcrResult, setLastOcrResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Check URL search params for direct QR scan navigation or verification link
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      const urlCert = params.get('cert_id') || params.get('cert');
      if (urlCert) {
        setSelectedCertId(urlCert);
        if (urlTab === 'verify-certificate' || !urlTab) {
          setActiveTab('verify-certificate');
        } else if (urlTab === 'trust-certificates') {
          setActiveTab('trust-certificates');
        }
      } else if (urlTab) {
        setActiveTab(urlTab);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Poll or refresh badges on navigation
  const refreshBadges = async () => {
    try {
      const res = await dashboardService.getStats();
      setPendingCount(res.stats.pending_review || 0);
      setDuplicateCount(res.stats.duplicate_candidates || 0);
    } catch (e) {
      console.warn('Could not fetch badge counts:', e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshBadges();
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f2439', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>BHOOMI AI LAND RECORD SYSTEM</div>
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>Initializing National Cadastre Intelligence Engine...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleProcessComplete = (result) => {
    setLastOcrResult(result);
    if (result.record_id) {
      setSelectedRecordId(result.record_id);
    }
    setActiveTab('ocr-result');
    refreshBadges();
  };

  const handleGlobalSearch = (term) => {
    setSearchTerm(term);
    if (term.trim().length > 0 && activeTab !== 'records') {
      setActiveTab('records');
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        pendingReviewCount={pendingCount} 
        duplicateCount={duplicateCount} 
      />

      <div className="main-content">
        <Topbar 
          onSearch={handleGlobalSearch} 
          searchTerm={searchTerm} 
        />

        <main style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <DashboardPage 
              setActiveTab={setActiveTab} 
              setSelectedRecordId={setSelectedRecordId} 
            />
          )}

          {activeTab === 'upload' && (
            <DocumentUploadPage 
              onProcessComplete={handleProcessComplete} 
            />
          )}

          {activeTab === 'ocr-result' && (
            <OcrResultPage 
              result={lastOcrResult} 
              setActiveTab={setActiveTab} 
              setSelectedRecordId={setSelectedRecordId} 
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage 
              setActiveTab={setActiveTab} 
              onProcessComplete={handleProcessComplete} 
            />
          )}

          {activeTab === 'records' && (
            <SearchRecordsPage 
              setSelectedRecordId={setSelectedRecordId} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'gis-search' && (
            <LandSearchGisPage 
              setSelectedRecordId={setSelectedRecordId} 
              setActiveTab={setActiveTab} 
              initialRecordId={selectedRecordId}
            />
          )}

          {activeTab === 'trust-certificates' && (
            <TrustCertificatesPage 
              setActiveTab={setActiveTab} 
              setSelectedRecordId={setSelectedRecordId} 
              selectedCertId={selectedCertId}
              setSelectedCertId={setSelectedCertId}
            />
          )}

          {activeTab === 'verify-certificate' && (
            <CertificateVerificationPage 
              initialCertId={selectedCertId} 
              setActiveTab={setActiveTab}
              onViewCertificate={(cId) => {
                setSelectedCertId(cId);
                setActiveTab('trust-certificates');
              }}
            />
          )}

          {activeTab === 'record-details' && (
            <LandRecordDetailsPage 
              recordId={selectedRecordId} 
              setActiveTab={setActiveTab} 
              setSelectedRecordId={setSelectedRecordId} 
            />
          )}

          {activeTab === 'validation' && (
            <ValidationPage 
              selectedRecordId={selectedRecordId} 
              setSelectedRecordId={setSelectedRecordId} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'duplicates' && (
            <DuplicateDetectionPage 
              setSelectedRecordId={setSelectedRecordId} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'review-queue' && (
            <HumanReviewPage 
              setSelectedRecordId={setSelectedRecordId} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'audit-logs' && (
            <AuditLogsPage 
              setSelectedRecordId={setSelectedRecordId} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanelPage 
              setActiveTab={setActiveTab} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApplication />
    </AuthProvider>
  );
}
