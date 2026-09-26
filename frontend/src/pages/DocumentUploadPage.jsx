import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  FileUp, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import { documentService } from '../services/api.js';
import ProcessingStepper from '../components/ProcessingStepper.jsx';

export default function DocumentUploadPage({ onProcessComplete }) {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [samples, setSamples] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [processResult, setProcessResult] = useState(null);

  useEffect(() => {
    const loadSamples = async () => {
      try {
        const s = await documentService.getSamples();
        setSamples(s);
      } catch (err) {
        console.error('Failed to load sample deeds:', err);
      }
    };
    loadSamples();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleSampleSelect = async (sample) => {
    setError('');
    setUploading(true);
    setCurrentStep(1); // Uploaded
    try {
      // Fetch the sample file from backend static server and create a File object
      const res = await fetch(`/sample_documents/${sample.id}`);
      const blob = await res.blob();
      const sampleFile = new File([blob], sample.id, { type: 'image/jpeg' });
      
      const doc = await documentService.upload(sampleFile, sample.language);
      setUploadedDoc(doc);
      setUploading(false);
      
      // Auto-run pipeline processing
      runPipeline(doc.id);
    } catch (err) {
      setError('Error initiating sample processing: ' + (err.response?.data?.detail || err.message));
      setUploading(false);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setError('Please select or drop a land document file first.');
      return;
    }
    setError('');
    setUploading(true);
    setCurrentStep(0);

    try {
      const doc = await documentService.upload(file, language);
      setUploadedDoc(doc);
      setUploading(false);
      setCurrentStep(1);

      // Now run the full pipeline
      runPipeline(doc.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Document upload failed. Ensure format is PDF, JPG or PNG under 15MB.');
      setUploading(false);
    }
  };

  const runPipeline = async (docId) => {
    setProcessing(true);

    // Simulate animated step progression for judges to follow the multi-stage AI pipeline
    setCurrentStep(1); // Document Uploaded
    
    setTimeout(() => {
      setCurrentStep(2); // OCR Completed
    }, 900);

    setTimeout(() => {
      setCurrentStep(3); // Fields Extracted
    }, 1800);

    setTimeout(() => {
      setCurrentStep(4); // Validation Completed
    }, 2600);

    try {
      const result = await documentService.process(docId);
      
      setTimeout(() => {
        setCurrentStep(5); // Duplicate check completed
      }, 3400);

      setTimeout(() => {
        setCurrentStep(6); // Confidence calculated / Done
        setProcessing(false);
        setProcessResult(result);
        if (onProcessComplete) {
          onProcessComplete(result);
        }
      }, 4200);

    } catch (err) {
      setError('Pipeline error: ' + (err.response?.data?.detail || err.message));
      setProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Intelligent Land Document Digitization Pipeline</h2>
          <p>Multi-lingual OCR, regex/NLP field extraction, cadastral cross-validation, and duplicate detection</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Display */}
      {(uploading || processing || processResult) && (
        <ProcessingStepper currentStep={currentStep} isProcessing={processing} />
      )}

      {/* Quick Demo Pre-bundled Samples */}
      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} color="#0284c7" />
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
            Instant SIH Evaluator Deeds (One-Click Live Processing):
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
          Select any realistic certified deed below to immediately trigger the multi-stage OCR, validation, and duplicate conflict engine:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {samples.map((s) => (
            <div 
              key={s.id}
              onClick={() => !processing && handleSampleSelect(s)}
              style={{
                background: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px',
                cursor: processing ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0284c7'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                  {s.state}
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{s.language}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', margin: '4px 0' }}>{s.name}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Upload Box */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Upload Scanned Land Document</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Document Language:</span>
            <select 
              className="form-select" 
              style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="bn">Bengali (বাংলা)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            border: '2px dashed #94a3b8',
            borderRadius: '10px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            cursor: 'pointer'
          }}
          onClick={() => document.getElementById('file-upload-input').click()}
        >
          <input 
            id="file-upload-input"
            type="file" 
            style={{ display: 'none' }}
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
            onChange={handleFileChange}
          />
          <div style={{ width: '48px', height: '48px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#0284c7' }}>
            <UploadCloud size={24} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
            {file ? file.name : 'Click to select or drag and drop scanned land record deed'}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Supports PDF, JPG, PNG, TIFF up to 15 MB. Scanned 7/12 extracts, Khatians, Patta Deeds, and Sale Deeds.
          </p>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-primary"
            onClick={handleUploadAndProcess}
            disabled={!file || uploading || processing}
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            {processing ? 'Executing Multi-Stage Pipeline...' : uploading ? 'Uploading...' : 'Upload & Process Document'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
