import React from 'react';

/**
 * CompanyLogo component
 * Renders the Aaroham circular brand emblem from /logo.jpeg.
 */
export default function CompanyLogo({ size = 38, className = '', showShadow = true }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none bg-[#FAF5EE] border border-[#EAE0D2]/80 ${
        showShadow ? 'shadow-md shadow-black/15' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title="Aaroham"
    >
      <img
        src="/logo.jpeg"
        alt="Aaroham Logo"
        className="w-full h-full object-cover rounded-full select-none"
        loading="eager"
      />
    </div>
  );
}
