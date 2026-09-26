import React, { useState, useEffect } from 'react';
import { Files, Play, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import { documentService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DocumentsPage({ setActiveTab, onProcessComplete }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchDocs = async () => {
    try {
      const data = await documentService.list();
      setDocs(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleProcess = async (docId) => {
    setProcessingId(docId);
    try {
      const res = await documentService.process(docId);
      if (onProcessComplete) {
        onProcessComplete(res);
      }
    } catch (err) {
      alert('Processing error: ' + (err.response?.data?.detail || err.message));
      setProcessingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Uploaded Land Documents</h2>
          <p>Registry of scanned deeds, Khatians, and Satbara extracts submitted for OCR processing</p>
        </div>

        <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
          Upload New Document
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Doc ID</th>
                <th>File Name</th>
                <th>Language</th>
                <th>Upload Date</th>
                <th>OCR Status</th>
                <th>Pipeline Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>#{d.id}</td>
                    <td style={{ fontWeight: 600 }}>{d.file_name}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '11px', color: '#64748b' }}>{d.language}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(d.upload_date).toLocaleDateString()}
                    </td>
                    <td>
                      <StatusBadge status={d.OCR_status} />
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{d.processing_status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={processingId === d.id}
                        onClick={() => handleProcess(d.id)}
                      >
                        <Play size={13} />
                        <span>{processingId === d.id ? 'Processing...' : 'Run OCR Pipeline'}</span>
                      </button>
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
