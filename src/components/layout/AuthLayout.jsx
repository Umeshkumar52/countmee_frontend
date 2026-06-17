import React from 'react';

export const AuthLayout = ({ children }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden page-transition">
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center">
            {/* Brand Logo Image */}
            <img 
              src="/countMe_logo.png" 
              alt="CountMee Logo" 
              className="h-16 w-auto object-contain mb-6 select-none" 
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
