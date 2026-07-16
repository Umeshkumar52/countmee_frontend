import  { useState } from 'react';
import { verifyCredentials, sendOtp, verifyOtp } from '../../../api/admin.api';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

export const WalletVerificationModal = ({ isOpen, onClose, onVerificationSuccess, actionLabel, actionType, amount }) => {
  const [step, setStep] = useState(1); // 1: Email/Password, 2: Phone Selection, 3: OTP
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('7411199281');
  const [otp, setOtp] = useState('');
  
  const [credentialsToken, setCredentialsToken] = useState('');
  const [otpToken, setOtpToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCredentials = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Step 1: Verify admin credentials
      const res = await verifyCredentials({ email, password });
      setCredentialsToken(res.data?.data?.credentialsToken || res.data?.credentialsToken);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid security credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Step 2: Send OTP to selected phone
      const res = await sendOtp({ 
        phone: selectedPhone, 
        action_type: actionType, 
        amount: parseFloat(amount) || 0, 
        credentialsToken 
      });
      setOtpToken(res.data?.data?.otpToken || res.data?.otpToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP to registered number');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Step 3: Verify OTP
      const res = await verifyOtp({ otp, otpToken });
      const finalToken = res.data?.data?.verificationToken || res.data?.verificationToken;

      // Execute target action
      onVerificationSuccess(finalToken);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Security Check: ${actionLabel}`}
    >
      {step === 1 && (
        <form onSubmit={handleVerifyCredentials} className="space-y-4 text-left">
          <p className="text-xs text-slate-500">
            For security reasons, please enter your Admin Credentials to authorize this wallet action.
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <Input
            label="Admin Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Security Password"
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose} variant="secondary" size="sm">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} variant="primary" size="sm">
              Continue
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSendOtp} className="space-y-4 text-left">
          <p className="text-xs text-slate-500">
            Select one of the registered admin phone numbers to receive the verification OTP.
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-2.5 border border-slate-100 p-4 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="registeredPhone"
                value="7411199281"
                checked={selectedPhone === '7411199281'}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="w-4 h-4 text-brand-purple focus:ring-brand-purple/20"
              />
              <span className="text-sm font-semibold text-slate-700">7411199281 (Admin Primary)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="registeredPhone"
                value="9900160707"
                checked={selectedPhone === '9900160707'}
                onChange={(e) => setSelectedPhone(e.target.value)}
                className="w-4 h-4 text-brand-purple focus:ring-brand-purple/20"
              />
              <span className="text-sm font-semibold text-slate-700">9900160707 (Admin Secondary)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setStep(1)} variant="secondary" size="sm">
              Back
            </Button>
            <Button type="submit" isLoading={isLoading} variant="primary" size="sm">
              Send OTP
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
          <p className="text-xs text-slate-500">
            A verification OTP has been sent to <strong>{selectedPhone}</strong>. Please enter the 4-digit code (Demo OTP is <strong>1234</strong>).
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <Input
            label="Verification OTP"
            id="otp"
            placeholder="Enter 4-digit code"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setStep(2)} variant="secondary" size="sm">
              Back
            </Button>
            <Button type="submit" isLoading={isLoading} variant="success" size="sm">
              Verify & Authorize
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default WalletVerificationModal;
