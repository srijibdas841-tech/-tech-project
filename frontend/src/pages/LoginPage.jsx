import React, { useState } from 'react';
import { LandPlot, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login, loginWithDemo } = useAuth();
  const [email, setEmail] = useState('officer@landrecords.gov.in');
  const [password, setPassword] = useState('officer123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleKey) => {
    const creds = DEMO_ACCOUNTS[roleKey];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.password);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f2439 0%, #0b3459 100%)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '14px', padding: '36px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #0284c7, #0d9488)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
            <LandPlot size={32} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            INTELLIGENT LAND RECORD SYSTEM
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SIH Problem Statement: SIH26018 • Team #TECH
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Government Email / Service ID</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@landrecords.gov.in"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '11px', marginTop: '10px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Revenue Portal'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <ShieldCheck size={16} color="#0284c7" />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
              One-Click Demo Accounts (SIH Evaluators):
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ justifyContent: 'space-between', fontSize: '12px', padding: '7px 12px' }}
              onClick={() => loginWithDemo('admin')}
            >
              <span>🏛️ <strong>Admin (Director)</strong></span>
              <span style={{ color: '#64748b' }}>admin@landrecords.gov.in</span>
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ justifyContent: 'space-between', fontSize: '12px', padding: '7px 12px' }}
              onClick={() => loginWithDemo('officer')}
            >
              <span>⚖️ <strong>Revenue Officer</strong></span>
              <span style={{ color: '#64748b' }}>officer@landrecords.gov.in</span>
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ justifyContent: 'space-between', fontSize: '12px', padding: '7px 12px' }}
              onClick={() => loginWithDemo('reviewer')}
            >
              <span>🔍 <strong>Cadastral Reviewer</strong></span>
              <span style={{ color: '#64748b' }}>reviewer@landrecords.gov.in</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
