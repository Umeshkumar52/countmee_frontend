export const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary, secondary, danger, success, outline
  size = "md", // sm, md, lg
  isLoading = false,
  disabled = false,
  className = "",
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center px-6 py-3 font-medium rounded-xl transition-all outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-brand-purple hover:bg-brand-purple-dark text-white focus:ring-brand-purple",
    secondary:
      "bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-400",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    outline:
      "bg-transparent border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {Icon && <Icon className="mr-2" size={18} />}
      {children}
    </button>
  );
};

export default Button;
