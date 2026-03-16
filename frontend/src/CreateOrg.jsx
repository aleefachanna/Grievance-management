import React, { useState, useRef, useCallback } from 'react';
import { api } from './api';
import './CreateOrg.css';

// ── Step definitions ──────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Email'  },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Details'},
  { id: 4, label: 'Branding'},
  { id: 5, label: 'Confirm'},
];

const ORG_TYPES = [
  { value: 'private',    label: 'Private' },
  { value: 'government', label: 'Government' },
  { value: 'ngo',        label: 'NGO' },
  { value: 'educational',label: 'Educational' },
];

const CATEGORIES = [
  { label: 'For-Profit',          value: 'for_profit' },
  { label: 'Non-Profit',          value: 'non_profit' },
  { label: 'Government',          value: 'govt' },
  { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
  { label: 'Partnership',         value: 'partnership' },
  { label: 'Company',             value: 'company' },
  { label: 'Cooperative',         value: 'cooperative' },
];

// ── Reusable Field ────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="co-form-group-full">
    <label className="co-label">{label}</label>
    {children}
  </div>
);

const Row = ({ children }) => (
  <div className="co-form-row">{children}</div>
);

// ── Progress Bar ──────────────────────────────────────────────
const ProgressBar = ({ current }) => (
  <div className="co-progress">
    {STEPS.map((step, idx) => {
      const status = current > step.id ? 'done' : current === step.id ? 'active' : '';
      return (
        <React.Fragment key={step.id}>
          {idx > 0 && (
            <div className={`co-step-line ${current > step.id ? 'done' : ''}`} />
          )}
          <div className="co-step-item">
            <div className={`co-step-circle ${status}`}>
              {current > step.id ? '✓' : step.id}
            </div>
            <span className={`co-step-label ${status}`}>{step.label}</span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

// ── Main Component ────────────────────────────────────────────
const CreateOrg = () => {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [successData, setSuccessData] = useState(null);

  // Form state
  const [adminEmail, setAdminEmail] = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [logoFile, setLogoFile]     = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [form, setForm] = useState({
    orgName:     '',
    orgType:     'private',
    cin:         '',
    gstin:       '',
    description: '',
    city:        '',
    state:       '',
    country:     '',
    categories:  [],
    email:       '',
    phone:       '',
    website:     '',
    adminName:   '',
  });

  const otpRefs = useRef([]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleCategory = (val) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(val)
        ? f.categories.filter(c => c !== val)
        : [...f.categories, val],
    }));
  };

  // ── OTP input logic ──────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    const cleaned = val.replace(/\D/, '').slice(0, 1);
    const updated = [...otp];
    updated[idx] = cleaned;
    setOtp(updated);
    if (cleaned && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = [...otp];
    text.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtp(updated);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  // ── Logo upload ──────────────────────────────────────────────
  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // ── Step 1: Send OTP ─────────────────────────────────────────
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!adminEmail) { setError('Email is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/organisation/send-otp/', { email: adminEmail });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────
  const verifyOtp = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit OTP.'); return; }
    setError('');
    // We don't verify OTP separately — it's verified at submit time
    setStep(3);
  };

  // ── Step 5: Submit ───────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = new FormData();
      payload.append('adminEmail',  adminEmail);
      payload.append('otp',         otp.join(''));
      payload.append('adminName',   form.adminName);
      payload.append('orgName',     form.orgName);
      payload.append('orgType',     form.orgType);
      payload.append('cin',         form.cin);
      payload.append('gstin',       form.gstin);
      payload.append('description', form.description);
      payload.append('city',        form.city);
      payload.append('state',       form.state);
      payload.append('country',     form.country);
      payload.append('email',       form.email);
      payload.append('phone',       form.phone);
      payload.append('website',     form.website);
      payload.append('categories',  JSON.stringify(form.categories));
      if (logoFile) payload.append('logo', logoFile);

      const res = await api.post('/organisation/create/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create organisation.');
      // If OTP error, send back to step 2
      if (err.response?.data?.error?.toLowerCase().includes('otp')) setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const next = () => { setError(''); setStep(s => s + 1); };
  const back = () => { setError(''); setStep(s => s - 1); };

  // ── Success ──────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="co-wrapper">
        <div className="co-brand">
          <div className="co-brand-logo">ResolvePro</div>
          <div className="co-brand-tagline">Grievance Management Platform</div>
        </div>
        <div className="co-card" style={{ textAlign: 'center' }}>
          <div className="co-success-icon">✓</div>
          <h2 style={{ color: '#fff', fontSize: 26, marginBottom: 8 }}>Organisation Created!</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 0 }}>
            Your organisation is live. Save these credentials — they won't be shown again.
          </p>
          <div className="co-warning-box" style={{ marginTop: 20 }}>
            ⚠️ Copy these credentials now. The temporary password cannot be recovered.
          </div>
          <div className="co-cred-box">
            <div className="co-cred-row">
              <span className="co-cred-label">Manager Email</span>
              <span className="co-cred-value">{successData.manager_email}</span>
            </div>
            <div className="co-cred-row">
              <span className="co-cred-label">Temp Password</span>
              <span className="co-cred-value">{successData.password}</span>
            </div>
            <div className="co-cred-row">
              <span className="co-cred-label">Org Slug</span>
              <span className="co-cred-value">{successData.organisation_slug}</span>
            </div>
          </div>
          <a
            href="/manager-login"
            className="co-btn-primary"
            style={{ display: 'block', textDecoration: 'none', marginTop: 8, textAlign: 'center', lineHeight: '1' }}
          >
            Go to Manager Login →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="co-wrapper">
      {/* Brand */}
      <div className="co-brand">
        <div className="co-brand-logo">ResolvePro</div>
        <div className="co-brand-tagline">Register your organisation</div>
      </div>

      {/* Progress */}
      <ProgressBar current={step} />

      {/* Card */}
      <div className="co-card">
        {error && <div className="co-error">⚠ {error}</div>}

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <form onSubmit={sendOtp}>
            <div className="co-step-header">
              <div className="co-step-tag">Step 1 of 5</div>
              <h2 className="co-step-title">Verify your email</h2>
              <p className="co-step-subtitle">
                We'll send a one-time code to your admin email address to confirm your identity.
              </p>
            </div>

            <Field label="Admin Email Address *">
              <input
                className="co-input"
                type="email"
                placeholder="admin@yourcompany.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                required
                autoFocus
              />
            </Field>

            <div className="co-btn-row">
              <button type="submit" className="co-btn-primary" disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP Code →'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={verifyOtp}>
            <div className="co-step-header">
              <div className="co-step-tag">Step 2 of 5</div>
              <h2 className="co-step-title">Enter the OTP</h2>
              <p className="co-step-subtitle">
                Check your <strong style={{ color: '#a78bfa' }}>Django terminal</strong> for the 6-digit code sent to <strong style={{ color: '#fff' }}>{adminEmail}</strong>.
              </p>
            </div>

            <div className="co-otp-wrapper" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => (otpRefs.current[i] = el)}
                  className="co-otp-digit"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            <div className="co-resend">
              Didn't receive it?{' '}
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await api.post('/organisation/send-otp/', { email: adminEmail });
                    setError('');
                  } catch (err) {
                    setError('Could not resend OTP.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Resend OTP
              </button>
            </div>

            <div className="co-btn-row">
              <button type="button" className="co-btn-secondary" onClick={back}>← Back</button>
              <button type="submit" className="co-btn-primary" disabled={otp.join('').length < 6}>
                Verify & Continue →
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Organisation Details ── */}
        {step === 3 && (
          <form onSubmit={e => { e.preventDefault(); next(); }}>
            <div className="co-step-header">
              <div className="co-step-tag">Step 3 of 5</div>
              <h2 className="co-step-title">Organisation Details</h2>
              <p className="co-step-subtitle">Tell us about your organisation.</p>
            </div>

            <Row>
              <div className="co-form-group">
                <label className="co-label">Organisation Name *</label>
                <input className="co-input" type="text" placeholder="Acme Corp Ltd."
                  value={form.orgName} onChange={e => setField('orgName', e.target.value)} required />
              </div>
              <div className="co-form-group">
                <label className="co-label">Organisation Type *</label>
                <select className="co-select" value={form.orgType} onChange={e => setField('orgType', e.target.value)}>
                  {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </Row>

            <Row>
              <div className="co-form-group">
                <label className="co-label">CIN (Corporate ID)</label>
                <input className="co-input" type="text" placeholder="U12345MH2020PTC..."
                  value={form.cin} onChange={e => setField('cin', e.target.value)} />
              </div>
              <div className="co-form-group">
                <label className="co-label">GSTIN</label>
                <input className="co-input" type="text" placeholder="22AAAAA0000A1Z5"
                  value={form.gstin} onChange={e => setField('gstin', e.target.value)} />
              </div>
            </Row>

            <Field label="Office Address / Description">
              <textarea className="co-textarea" placeholder="Registered office address or brief description…"
                value={form.description} onChange={e => setField('description', e.target.value)} />
            </Field>

            <Row>
              <div className="co-form-group">
                <label className="co-label">City *</label>
                <input className="co-input" type="text" placeholder="Mumbai"
                  value={form.city} onChange={e => setField('city', e.target.value)} required />
              </div>
              <div className="co-form-group">
                <label className="co-label">State *</label>
                <input className="co-input" type="text" placeholder="Maharashtra"
                  value={form.state} onChange={e => setField('state', e.target.value)} required />
              </div>
              <div className="co-form-group">
                <label className="co-label">Country *</label>
                <input className="co-input" type="text" placeholder="India"
                  value={form.country} onChange={e => setField('country', e.target.value)} required />
              </div>
            </Row>

            <div className="co-section-divider">Organisation Categories</div>
            <div className="co-checkbox-grid">
              {CATEGORIES.map(opt => (
                <label key={opt.value} className="co-checkbox-item">
                  <input type="checkbox" value={opt.value}
                    checked={form.categories.includes(opt.value)}
                    onChange={() => toggleCategory(opt.value)} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="co-btn-row">
              <button type="button" className="co-btn-secondary" onClick={back}>← Back</button>
              <button type="submit" className="co-btn-primary">Next: Branding →</button>
            </div>
          </form>
        )}

        {/* ── STEP 4: Branding & Contact ── */}
        {step === 4 && (
          <form onSubmit={e => { e.preventDefault(); next(); }}>
            <div className="co-step-header">
              <div className="co-step-tag">Step 4 of 5</div>
              <h2 className="co-step-title">Branding & Contact</h2>
              <p className="co-step-subtitle">Upload your logo and add public contact details.</p>
            </div>

            <Field label="Organisation Logo">
              <div className="co-logo-upload">
                <input type="file" accept="image/*" onChange={handleLogo} />
                {logoPreview ? (
                  <>
                    <img src={logoPreview} alt="Logo preview" className="co-logo-preview" />
                    <p className="co-logo-text">Click to change logo</p>
                  </>
                ) : (
                  <>
                    <div className="co-logo-icon">🏢</div>
                    <p className="co-logo-text"><strong>Click to upload</strong> or drag & drop<br />PNG, JPG, SVG — max 2 MB</p>
                  </>
                )}
              </div>
            </Field>

            <Row>
              <div className="co-form-group">
                <label className="co-label">Official Email *</label>
                <input className="co-input" type="email" placeholder="contact@acme.com"
                  value={form.email} onChange={e => setField('email', e.target.value)} required />
              </div>
              <div className="co-form-group">
                <label className="co-label">Contact Phone</label>
                <input className="co-input" type="tel" placeholder="+91 98765 43210"
                  value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </div>
            </Row>

            <Field label="Website">
              <input className="co-input" type="url" placeholder="https://www.acme.com"
                value={form.website} onChange={e => setField('website', e.target.value)} />
            </Field>

            <div className="co-btn-row">
              <button type="button" className="co-btn-secondary" onClick={back}>← Back</button>
              <button type="submit" className="co-btn-primary">Next: Confirm →</button>
            </div>
          </form>
        )}

        {/* ── STEP 5: Admin & Review ── */}
        {step === 5 && (
          <form onSubmit={handleSubmit}>
            <div className="co-step-header">
              <div className="co-step-tag">Step 5 of 5</div>
              <h2 className="co-step-title">Review & Submit</h2>
              <p className="co-step-subtitle">Confirm your details and create the organisation.</p>
            </div>

            <Field label="Admin Full Name *">
              <input className="co-input" type="text" placeholder="John Doe"
                value={form.adminName} onChange={e => setField('adminName', e.target.value)} required autoFocus />
            </Field>

            <div className="co-section-divider">Summary</div>
            <div className="co-review-grid">
              {[
                ['Organisation',  form.orgName],
                ['Type',          ORG_TYPES.find(t => t.value === form.orgType)?.label],
                ['Location',      [form.city, form.state, form.country].filter(Boolean).join(', ')],
                ['Admin Email',   adminEmail],
                ['Official Email',form.email],
                ['CIN',           form.cin || '—'],
                ['GSTIN',         form.gstin || '—'],
                ['Phone',         form.phone || '—'],
                ['Website',       form.website || '—'],
                ['Logo',          logoFile ? logoFile.name : 'Not uploaded'],
              ].map(([key, val]) => (
                <div className="co-review-item" key={key}>
                  <span className="co-review-key">{key}</span>
                  <span className="co-review-val">{val}</span>
                </div>
              ))}
            </div>

            <div className="co-btn-row">
              <button type="button" className="co-btn-secondary" onClick={back}>← Back</button>
              <button type="submit" className="co-btn-primary" disabled={loading}>
                {loading ? 'Creating…' : '🚀 Create Organisation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOrg;