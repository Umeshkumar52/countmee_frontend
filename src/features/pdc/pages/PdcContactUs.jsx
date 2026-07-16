

export const PdcContactUs = () => {
  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 sm:p-12 text-center w-full max-w-sm">

        {/* Logo */}
        <img
          src="/countMe_logo.png"
          alt="CountMee Logo"
          className="w-24 h-auto mx-auto mb-6"
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Contact Us :</h2>

        {/* Email */}
        <a
          href="mailto:countmeeapp@gmail.com"
          className="flex items-center justify-center gap-2 text-[#6b21c8] font-medium text-base mb-4 hover:text-[#4c1d95] transition-colors no-underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          countmeeapp@gmail.com
        </a>

        {/* Phone */}
        <a
          href="tel:+919900160707"
          className="flex items-center justify-center gap-2 text-[#6b21c8] font-medium text-base mb-4 hover:text-[#4c1d95] transition-colors no-underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          +919900160707
        </a>

        {/* Location */}
        <div className="flex items-center justify-center gap-2 text-[#6b21c8] font-medium text-base">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.083 3.204-4.399 3.204-6.977a7.5 7.5 0 10-15 0c0 2.578 1.26 4.894 3.204 6.977a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Bengaluru, Karnataka
        </div>

      </div>
    </div>
  );
};

export default PdcContactUs;

