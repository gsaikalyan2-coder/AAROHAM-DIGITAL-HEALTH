import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo.jsx';

/**
 * PrivacyConsentModal component
 * Displays a centered privacy consent popup when users enter the website.
 * Matches the requested Apollo / Aaroham Privacy Consent prompt.
 */
export default function PrivacyConsentModal({
  title = "Privacy Consent",
  organizationName = "AAROHAM",
  onAccept,
  forceShow = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    // Check if the user has already consented in this session
    const hasConsented = sessionStorage.getItem('privacy_consent_accepted');
    if (!hasConsented || forceShow) {
      // Small timeout for smooth entrance transition when page loads
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleAccept = () => {
    if (!isChecked) {
      alert("Please accept the terms to proceed.");
      return;
    }
    sessionStorage.setItem('privacy_consent_accepted', 'true');
    setIsOpen(false);
    if (onAccept) onAccept();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Light Frosted Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] transition-all duration-300 animate-fadeIn"
        aria-modal="true"
        role="dialog"
      >
        {/* Mac Glass Popup Modal Card */}
        <div className="relative w-full max-w-xl bg-slate-900/75 dark:bg-slate-950/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-white transform transition-all duration-300 animate-scaleUp">
          
          {/* Header & Brand Logo */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {title}
            </h2>
            <CompanyLogo size={36} />
          </div>

          {/* Consent Checkbox & Text */}
          <div className="flex items-start gap-3 text-slate-200 text-sm sm:text-base leading-relaxed mb-8">
            <label className="relative flex items-center pt-0.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-[#111625] cursor-pointer"
              />
            </label>
            <p className="text-slate-200 text-xs sm:text-sm font-medium">
              By Clicking OK you give consent to process your personal information and agree to the terms of{' '}
              <span className="font-semibold text-blue-300">{organizationName}&apos;s.</span>{' '}
              <button
                type="button"
                onClick={() => setShowPolicyModal(true)}
                className="underline hover:text-blue-300 font-semibold transition-colors focus:outline-none"
              >
                Privacy Policy
              </button>
            </p>
          </div>

          {/* OK Action Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold px-10 py-2.5 rounded-full text-sm sm:text-base shadow-lg shadow-blue-500/30 border border-blue-400/30 backdrop-blur-md transition-all duration-150"
            >
              OK
            </button>
          </div>
        </div>
      </div>

      {/* Nested Privacy Policy Details Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111625] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-xl font-bold text-white">Privacy Policy &amp; Data Consent</h3>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="text-slate-400 hover:text-white text-2xl font-semibold leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <p>
                <strong>1. Information Collection:</strong> We collect essential health records, ABHA IDs, prescription data, and consultation details required to provide continuous, high-quality medical care across healthcare centers.
              </p>
              <p>
                <strong>2. Data Usage &amp; Protection:</strong> Your personal and medical records are stored securely with end-to-end encryption in compliance with National Digital Health Mission (NDHM) guidelines and applicable healthcare privacy regulations.
              </p>
              <p>
                <strong>3. Access Control:</strong> Only certified doctors, registered hospitals, and authorized personnel can view your medical records upon verification of your unique health ID.
              </p>
              <p>
                <strong>4. Consent Revocation:</strong> You retain full rights to review your data sharing preferences and update your consent settings at any time through your worker portal.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="bg-sky-600 hover:bg-sky-500 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
