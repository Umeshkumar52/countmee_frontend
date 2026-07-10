import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../../components/layout/AuthLayout";
import Input from "../../../components/common/Input";
import Button from "../../../components/common/Button";
import toast from "react-hot-toast";
import { forgotPassword, resetPassword } from "../../../api/auth.api";

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier) {
      setError("Please enter your Email or Mobile Number");
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({ identifier });
      toast.success("OTP sent successfully to your registered contact details");
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to send OTP",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ identifier, otp, newPassword, confirmPassword });
      toast.success("Password reset successfully! Please login.");
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className=" flex items-center gap-2 mb-2">
        
        <h2 className="text-xl font-extrabold text-slate-800 font-display uppercase tracking-wider m-0">
          Reset Password
        </h2>
      </div>

      <p className="text-xs text-slate-500 mb-6">
        {step === 1
          ? "Enter your registered email or mobile number."
          : "Enter the OTP and your new password."}
      </p>

      {error && (
        <div className="w-full mb-4 bg-red-50 text-red-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-100">
          ⚠️ {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="w-full space-y-4">
          <Input
            id="identifier"
            type="text"
            label="Email or Mobile Number"
            placeholder="Email / Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="bg-white/50 border-slate-200 focus:border-brand-purple focus:ring-brand-purple/20"
          />
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm shadow-md shadow-brand-purple/20"
              isLoading={isLoading}
            >
              Send OTP
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="w-full space-y-4">
          <Input
            id="otp"
            type="text"
            label="4-Digit OTP"
            placeholder="1234"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            className="bg-white/50 border-slate-200 text-center tracking-widest font-bold text-lg"
          />
          <Input
            id="newPassword"
            type="password"
            label="New Password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="bg-white/50"
          />
          <Input
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-white/50"
          />
          <div className="pt-4 flex flex-col gap-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-[15px] font-bold shadow-lg shadow-brand-purple/20 transition-all hover:shadow-brand-purple/30 hover:-translate-y-0.5"
              isLoading={isLoading}
            >
              Reset Password
            </Button>
            
            <div className="flex flex-col items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="text-sm font-bold text-brand-purple hover:text-brand-purple-dark transition-colors disabled:opacity-50"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-semibold text-slate-500 hover:text-brand-purple transition-colors"
              >
                Didn't receive the code? Go back
              </button>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
