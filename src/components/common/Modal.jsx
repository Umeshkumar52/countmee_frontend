import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // sm, md, lg, xl, full
  className = '',
  contentClassName = ''
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    'full': 'w-[98vw] max-w-[1400px] h-[95vh] flex flex-col',
  };

  const target = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Dialog Card Centered */}
      <div className={`relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${sizeClasses[size]} ${className} z-50 overflow-hidden transform transition-all duration-300 page-transition`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center text-xl transition-all cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div className={`p-6 overflow-y-auto ${size === 'full' ? 'flex-1 max-h-none' : 'max-h-[75vh]'} ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>,
    target
  );
};

export default Modal;
