import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function ProcessingStepper({ currentStep = 0, isProcessing = false }) {
  const steps = [
    'Document Uploaded',
    'OCR Completed',
    'Fields Extracted',
    'Validation Completed',
    'Duplicate Check Completed',
    'Confidence Calculated'
  ];

  return (
    <div style={{ margin: '24px 0', padding: '16px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep && isProcessing;
          
          return (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 2 }}>
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: isDone ? '#059669' : isCurrent ? '#0284c7' : '#e2e8f0',
                  color: isDone || isCurrent ? '#ffffff' : '#64748b',
                  transition: 'all 0.3s ease',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none'
                }}
              >
                {isDone ? (
                  <Check size={16} />
                ) : isCurrent ? (
                  <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  idx + 1
                )}
              </div>
              <span 
                style={{
                  fontSize: '11px',
                  fontWeight: isCurrent ? '700' : '500',
                  color: isDone ? '#059669' : isCurrent ? '#0284c7' : '#64748b',
                  marginTop: '8px',
                  textAlign: 'center',
                  maxWidth: '90px'
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
