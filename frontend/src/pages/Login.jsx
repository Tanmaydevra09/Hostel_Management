import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import {
  Building2, Eye, EyeOff, LogIn, ArrowLeft,
  ShieldCheck, KeyRound, Mail, Users, CreditCard,
  BarChart3, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

const features = [
  { icon: Users,     color: '#5FCB8D', bg: 'rgba(95,203,141,0.15)', text: 'Student Management',  sub: 'Admissions, profiles, rooms' },
  { icon: CreditCard,color: '#A9C5FF', bg: 'rgba(169,197,255,0.15)', text: 'Fee Tracking',        sub: 'Payments, receipts, dues' },
  { icon: BarChart3, color: '#F6B545', bg: 'rgba(246,181,69,0.15)',  text: 'Detailed Reports',    sub: 'Analytics and PDF exports' },
  { icon: Bell,      color: '#F16C6C', bg: 'rgba(241,108,108,0.15)', text: 'Smart Notifications', sub: 'Real-time alerts and updates' },
];

export default function Login() {
  const { login, verifyLogin } = useAuth();
  const navigate = useNavigate();

  const [view, setView]       = useState('login');
  const [form, setForm]       = useState({ username: '', password: '', email: '', newPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [otpData, setOtpData]       = useState({ userId: null, email: '' });
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if ((view === 'otp' || view === 'reset-password') && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, resendTimer]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error('Please enter credentials'); return; }
    setLoading(true);
    try {
      const res = await login(form.username, form.password);
      if (res.forcePasswordChange) {
        setOtpData({ userId: res.userId, email: '' });
        setView('force-password');
        toast.error('You must change your default password to continue.', { icon: '⚠️' });
      } else if (res.otpRequired) {
        setOtpData({ userId: res.userId, email: res.email });
        setView('otp');
        setResendTimer(30);
        toast.success(res.message);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) { toast.error('Please enter full OTP'); return; }
    setLoading(true);
    try {
      await verifyLogin(otpData.userId, otpCode);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await authAPI.resendOtp({ userId: otpData.userId });
      toast.success(res.data.message || 'OTP resent successfully');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally { setLoading(false); }
  };

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.forceChangePassword({ userId: otpData.userId, newPassword: form.newPassword });
      toast.success('Password updated! Please log in again.');
      setForm({ ...form, password: '', newPassword: '' });
      setView('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: form.email });
      setOtpData({ userId: res.data.userId, email: form.email });
      toast.success(res.data.message);
      setView('reset-password');
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) { toast.error('Please enter full OTP'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ userId: otpData.userId, otp: otpCode, newPassword: form.newPassword });
      toast.success('Password reset successfully! Please log in.');
      setView('login');
      setForm({ ...form, password: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) newOtp[i] = pastedData[i] || '';
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const fillDemo = (role) => {
    const creds = { admin: 'admin', warden: 'warden', student: 'john@gmail.com' };
    const pass  = role === 'student' ? 'HMS001@123' : 'Admin@123';
    setForm({ ...form, username: creds[role], password: pass });
  };

  return (
    <div className="login-page">
      {/* ── Left Panel ─────────────────────────────── */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand-icon">
            <Building2 size={34} />
          </div>
          <h1 className="login-brand-title">
            Hostel <span>Hub</span>
          </h1>
          <p className="login-brand-desc">
            A complete hostel management solution.<br />
            Streamline admissions, fees, and more.
          </p>

          <div className="login-features">
            {features.map((f, i) => (
              <div key={i} className="login-feature">
                <div className="login-feature-icon" style={{ background: f.bg, color: f.color }}>
                  <f.icon size={18} />
                </div>
                <div>
                  <div className="login-feature-text">{f.text}</div>
                  <div className="login-feature-sub">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-wrap">
          {/* Mobile logo */}
          <div className="login-logo-mobile">
            <div className="login-logo-icon-sm"><Building2 size={22} /></div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>Hostel Hub</span>
          </div>

          {/* ── Login View ──────────────────────────── */}
          {view === 'login' && (
            <div className="animate-fade">
              <h2 className="login-heading">Welcome back</h2>
              <p className="login-desc">Sign in to your account to continue</p>

              <form onSubmit={handleLoginSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label">Email or Student ID</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Enter your email or ID"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <button type="button" className="btn-link text-xs" onClick={() => setView('forgot-password')}>
                      Forgot Password?
                    </button>
                  </div>
                  <div className="password-field">
                    <input
                      className="form-control"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      autoComplete="current-password"
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full login-btn" disabled={loading}>
                  {loading
                    ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in…</>
                    : <><LogIn size={18} /> Sign In</>
                  }
                </button>
              </form>

              <div className="login-demo">
                <p className="login-demo-label">Demo Accounts</p>
                <div className="demo-btns">
                  {[
                    { role: 'admin',   label: 'Admin',   badge: 'badge-info',    creds: 'admin / Admin@123' },
                    { role: 'warden',  label: 'Warden',  badge: 'badge-warning', creds: 'warden / Admin@123' },
                    { role: 'student', label: 'Student', badge: 'badge-success', creds: 'john@gmail.com / HMS001@123' },
                  ].map(d => (
                    <button key={d.role} className="demo-btn" onClick={() => fillDemo(d.role)}>
                      <span className={`badge ${d.badge}`}>{d.label}</span>
                      <span className="demo-btn-creds">{d.creds}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── OTP View ────────────────────────────── */}
          {view === 'otp' && (
            <div className="otp-container animate-fade">
              <button className="btn btn-ghost btn-sm btn-back" onClick={() => setView('login')}>
                <ArrowLeft size={16} /> Back to Login
              </button>
              <div className="otp-header">
                <div className="otp-icon-wrap"><ShieldCheck size={30} color="var(--primary-dark)" /></div>
                <h2 className="login-heading">Two-Step Verification</h2>
                <p className="login-desc">
                  We've sent a 6-digit code to<br />
                  <strong style={{ color: 'var(--primary-dark)' }}>{otpData.email}</strong>
                </p>
              </div>
              <form onSubmit={handleOtpSubmit} className="otp-form">
                <div className="otp-inputs">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      className="otp-input"
                      maxLength={6}
                      value={digit}
                      placeholder="·"
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full login-btn"
                  disabled={loading || otp.join('').length < 6}>
                  {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</> : 'Verify & Sign In'}
                </button>
              </form>
              <div className="otp-resend">
                <p className="text-sm text-muted" style={{ marginBottom: 6 }}>Didn't receive the code?</p>
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{ opacity: resendTimer > 0 ? 0.5 : 1 }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* ── Force Password Change ────────────────── */}
          {view === 'force-password' && (
            <div className="animate-fade">
              <div className="otp-header">
                <div className="otp-icon-wrap"><KeyRound size={30} color="var(--primary-dark)" /></div>
                <h2 className="login-heading">Set New Password</h2>
                <p className="login-desc">For security, you must change your default password before continuing.</p>
              </div>
              <form onSubmit={handleForcePasswordChange} className="login-form">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-field">
                    <input
                      className="form-control"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={form.newPassword}
                      onChange={e => setForm({ ...form, newPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full login-btn" disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Updating…</> : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* ── Forgot Password ──────────────────────── */}
          {view === 'forgot-password' && (
            <div className="animate-fade">
              <button className="btn btn-ghost btn-sm btn-back" onClick={() => setView('login')} style={{ marginBottom: 16 }}>
                <ArrowLeft size={16} /> Back to Login
              </button>
              <div className="otp-header">
                <div className="otp-icon-wrap"><Mail size={30} color="var(--primary-dark)" /></div>
                <h2 className="login-heading">Forgot Password?</h2>
                <p className="login-desc">Enter your registered email to receive a reset code.</p>
              </div>
              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="student@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full login-btn" disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending…</> : 'Send Reset Code'}
                </button>
              </form>
            </div>
          )}

          {/* ── Reset Password ───────────────────────── */}
          {view === 'reset-password' && (
            <div className="otp-container animate-fade">
              <button className="btn btn-ghost btn-sm btn-back" onClick={() => setView('login')}>
                <ArrowLeft size={16} /> Back to Login
              </button>
              <div className="otp-header">
                <div className="otp-icon-wrap"><KeyRound size={30} color="var(--primary-dark)" /></div>
                <h2 className="login-heading">Reset Password</h2>
                <p className="login-desc">
                  Enter the code sent to<br />
                  <strong style={{ color: 'var(--primary-dark)' }}>{otpData.email}</strong>
                </p>
              </div>
              <form onSubmit={handleResetPassword} className="otp-form">
                <div className="otp-inputs">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[i] = el}
                      type="text"
                      className="otp-input"
                      maxLength={6}
                      value={digit}
                      placeholder="·"
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-field">
                    <input
                      className="form-control"
                      type={showPwd ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={form.newPassword}
                      onChange={e => setForm({ ...form, newPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg w-full login-btn"
                  disabled={loading || otp.join('').length < 6}>
                  {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Resetting…</> : 'Reset Password'}
                </button>
              </form>
              <div className="otp-resend">
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{ opacity: resendTimer > 0 ? 0.5 : 1 }}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
