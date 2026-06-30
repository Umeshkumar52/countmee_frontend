import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser, clearAuthError } from '../authSlice';
import AuthLayout from '../../../components/layout/AuthLayout';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../constants';

// Clean SVG Icons
const EnvelopeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export const UnifiedLogin = () => {
  const [activeTab, setActiveTab] = useState('PDC'); // PDC, ADMIN
  
  // Credentials states
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Errors states
  const [validationError, setValidationError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useAuth();

  // Reset errors and values on tab switch
  useEffect(() => {
    dispatch(clearAuthError());
    setValidationError('');
    setPhoneError('');
    setPassword('');
    setPhone('');
    setEmail('');
  }, [activeTab, dispatch]);

  // Handle role-based redirections on load or successful auth
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === ROLES.PDC) {
        // KYC Guard will redirect to /pdc/home if already approved,
        // or stay on /pdc/profile_setup for the onboarding hub
        navigate('/pdc/profile_setup', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // keep digits only
    setPhone(value);
    
    if (value && value.length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (activeTab === 'PDC') {
      if (phone.length !== 10) {
        setValidationError('Please enter a valid 10-digit mobile number');
        return;
      }
      dispatch(loginUser({ phone, password }));
    } else {
      if (!email) {
        setValidationError('Please enter your admin email');
        return;
      }
      dispatch(loginUser({ email, password }));
    }
  };

  return (
    <AuthLayout>
      {/* Sliding Tabs */}
      <div className="w-full flex bg-slate-100 p-1 rounded-xl mb-6 relative select-none">
        <button
          type="button"
          onClick={() => setActiveTab('PDC')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'PDC'
              ? 'bg-white text-brand-purple shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          PDC Partner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ADMIN')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'ADMIN'
              ? 'bg-white text-brand-purple shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Administrator
        </button>
      </div>

      <h2 className="text-xl font-extrabold text-slate-800 font-display uppercase tracking-wider">
        {activeTab === 'PDC' ? 'PDC Partner Login' : 'Admin Login'}
      </h2>
      <p className="text-xs text-slate-500 mt-1 mb-6">
        {activeTab === 'PDC' ? 'Manage your hub shipments' : 'Platform administrative access'}
      </p>

      {/* Error Displays */}
      {validationError && (
        <div className="w-full mb-4 bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
          ⚠️ {validationError}
        </div>
      )}
      {error && (
        <div className="w-full mb-4 bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
        {activeTab === 'PDC' ? (
          <Input
            label="Mobile Number"
            id="phone"
            type="text"
            placeholder="Enter Mobile Number"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={10}
            required
            error={phoneError}
            icon={<PhoneIcon />}
          />
        ) : (
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="admin@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<EnvelopeIcon />}
          />
        )}

        <div className="relative">
          <Input
            label="Password"
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<LockIcon />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-8.5 right-3 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full mt-4 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
        >
          Login
        </Button>
      </form>

      {activeTab === 'PDC' && (
        <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4 w-full">
          <p className="mb-2">New to Countmee?</p>
          <Link to="/pdc/register" className="text-brand-success hover:underline font-bold text-sm">
            Register now
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};

export default UnifiedLogin;
