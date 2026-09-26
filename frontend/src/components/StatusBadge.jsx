import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const s = String(status).toUpperCase();

  if (type === 'confidence') {
    const val = parseFloat(status);
    if (val >= 90) {
      return <span className="badge badge-verified">High ({val}%)</span>;
    } else if (val >= 70) {
      return <span className="badge badge-pending">Med ({val}%)</span>;
    } else {
      return <span className="badge badge-duplicate">Low ({val}%)</span>;
    }
  }

  switch (s) {
    case 'VERIFIED':
    case 'VALID':
    case 'AUTO_ACCEPT':
    case 'RESOLVED_NOT_DUPLICATE':
      return <span className="badge badge-verified">✓ {status}</span>;
    case 'PENDING_REVIEW':
    case 'POTENTIAL_DUPLICATE':
    case 'WARNING':
      return <span className="badge badge-pending">⏱ {status}</span>;
    case 'DUPLICATE':
    case 'CONFIRMED_DUPLICATE':
    case 'INVALID':
      return <span className="badge badge-duplicate">✗ {status}</span>;
    case 'CONFLICT':
      return <span className="badge badge-conflict">⚠ CONFLICT DETECTED</span>;
    case 'MISMATCH':
      return <span className="badge badge-mismatch">⚠ MISMATCH</span>;
    default:
      return <span className="badge">{status}</span>;
  }
}
