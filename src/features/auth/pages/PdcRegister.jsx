import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerPdc, clearAuthError } from '../authSlice';
import AuthLayout from '../../../components/layout/AuthLayout';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useAuth from '../../../hooks/useAuth';
import { ROLES } from '../../../constants';

// Clean SVG Icons
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export const PdcRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated, user } = useAuth();

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role === ROLES.PDC) {
      // KYC Guard will redirect to /pdc/home if approved, otherwise shows hub
      navigate('/pdc/profile_setup', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // numbers only
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

    if (phone.length !== 10) {
      setValidationError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    dispatch(
      registerPdc({
        name,
        email,
        phone,
        password,
        confirmPassword,
      })
    );
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-extrabold text-slate-800 font-display uppercase tracking-wider">PDC Register</h2>
      <p className="text-xs text-slate-500 mt-1 mb-6">Create your new PDC partner account</p>

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
        <Input
          label="Shop Name"
          id="name"
          type="text"
          placeholder="Enter Shop Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          icon={<UserIcon />}
        />

        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="Enter Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<EnvelopeIcon />}
        />

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

        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Create Password (min. 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          icon={<LockIcon />}
        />

        <Input
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          placeholder="Re-enter Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          icon={<LockIcon />}
        />

        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full mt-4 py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
        >
          Register Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4 w-full">
        <p className="mb-2">Already have a PDC account?</p>
        <Link to="/" className="text-brand-success hover:underline font-bold text-sm">
          Login now
        </Link>
      </div>
    </AuthLayout>
  );
};

export default PdcRegister;
