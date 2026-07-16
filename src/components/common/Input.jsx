

export const Input = ({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  icon,
  className = '',
  required = false,
  maxLength,
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col text-left ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center">
          {label} {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative rounded-xl shadow-xs">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          required={required}
          className={`w-full bg-white border rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple ${
            icon ? 'pl-9' : ''
          } ${
            error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-brand-purple-soft'
          }`}
          {...props}
        />
      </div>
      
      {error && (
        <span className="text-[11px] text-red-500 font-semibold mt-1 pl-1">
          ⚠️ {error}
        </span>
      )}
    </div>
  );
};

export default Input;
