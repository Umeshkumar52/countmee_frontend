import React, { useState } from 'react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

export const PdcContactUs = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmit, setIsSubmit] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmit(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmit(false);
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left page-transition">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Contact Support</h2>
        <p className="text-xs text-slate-400 mt-1">Get in touch with the CountMee administration support team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Support Cards */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs text-center flex flex-col items-center">
            <span className="text-2xl mb-2">📞</span>
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Call Helpline</h4>
            <p className="text-sm font-semibold text-brand-purple mt-1.5">+91 99999 88888</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Mon to Sat • 9 AM - 6 PM</p>
          </div>

          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs text-center flex flex-col items-center">
            <span className="text-2xl mb-2">✉️</span>
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Email Support</h4>
            <p className="text-sm font-semibold text-brand-purple mt-1.5">support@countmee.in</p>
            <p className="text-[10px] text-slate-400 mt-0.5">We reply within 24 hours</p>
          </div>
        </div>

        {/* Support Request Form */}
        <div className="md:col-span-2 bg-white border border-slate-100 p-6 md:p-8 rounded-2xl shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Send a Support Ticket</h3>
          
          {success && (
            <div className="mb-4 bg-emerald-50 text-emerald-600 text-xs font-semibold px-4 py-2.5 rounded-xl border border-emerald-100">
              ✅ Support ticket sent successfully! We will contact you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Subject"
              id="subject"
              placeholder="e.g. Wallet settlement issue, order missing"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <div className="flex flex-col text-left">
              <label htmlFor="message" className="text-xs font-semibold text-slate-600 mb-1.5">
                Detailed Message
              </label>
              <textarea
                id="message"
                rows={4}
                placeholder="Describe your issue or query in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple"
              />
            </div>

            <Button
              type="submit"
              isLoading={isSubmit}
              className="w-full py-3 bg-brand-purple hover:bg-brand-purple-dark text-white font-bold"
            >
              Submit Support Request
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default PdcContactUs;
