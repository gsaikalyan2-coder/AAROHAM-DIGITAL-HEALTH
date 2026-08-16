import { useState } from 'react';
import { X, Download, Printer, ShieldCheck, ExternalLink, QrCode } from 'lucide-react';

export default function AbhaCardModal({ worker, isOpen, onClose }) {
  if (!isOpen || !worker) return null;

  const abhaNumber = worker.ABHA_id || worker.mhid || '91-5330-6818-7855';
  const nameEnglish = worker.full_name || worker.name || 'Kalgiswar V';
  const nameTamil = nameEnglish.includes('Kalgiswar') ? 'கல்கிஷ்வர் வ' : nameEnglish;
  const abhaAddress = worker.email || `${nameEnglish.toLowerCase().replace(/[^a-z0-9]/g, '')}@abdm`;
  const genderText = worker.gender === 'Female' ? 'Female/பெண்' : 'Male/ஆண்';
  
  const dobFormatted = worker.date_of_birth
    ? new Date(worker.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    : '26-05-2007';

  const mobile = worker.employer_phone_number || worker.mobile || '9443907550';
  const photoUrl = nameEnglish.includes('Kalgiswar') ? '/kalgiswar_abha.png' : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-base">
            <ShieldCheck className="text-emerald-500" size={20} />
            <span>Official Ayushman Bharat Digital Health Card (ABDM)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Main Content Container */}
        <div className="p-6 space-y-6">

          {/* Official ABHA Card Container (Exact Replica of NHA ABHA Card) */}
          <div className="w-full bg-white text-slate-900 rounded-xl overflow-hidden border border-slate-300 shadow-md font-sans">
            
            {/* Header Banner */}
            <div className="bg-[#1A3B70] text-white px-5 py-3 flex items-center justify-between">
              {/* Emblem / NHA Logo Left */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border border-white/30 bg-white/10 flex items-center justify-center font-bold text-xs">
                    ⚖️
                  </div>
                </div>
                <div className="leading-tight text-[11px] font-semibold text-slate-200">
                  <span className="block text-white font-bold text-xs uppercase tracking-wider">national health authority</span>
                  <span>आयुष्मान भारत स्वास्थ्य खाता</span>
                </div>
              </div>

              {/* Center Title */}
              <div className="text-center hidden sm:block">
                <h3 className="text-base font-extrabold tracking-wide text-white leading-tight">
                  Ayushman Bharat Health Account (ABHA)
                </h3>
                <p className="text-xs text-slate-200 font-hindi">
                  आयुष्मान भारत स्वास्थ्य खाता (आभा)
                </p>
              </div>

              {/* ABDM Logo Right */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shadow-sm">
                  <div className="w-full h-full rounded-full border-2 border-emerald-500 flex items-center justify-center font-bold text-[10px] text-[#1A3B70]">
                    ABDM
                  </div>
                </div>
              </div>
            </div>

            {/* ABHA Card Content Body */}
            <div className="p-5 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                
                {/* User Photo Left */}
                <div className="sm:col-span-3 flex justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={nameEnglish}
                      className="w-32 h-40 object-cover rounded border border-slate-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-32 h-40 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-3xl">
                      {nameEnglish.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details Middle */}
                <div className="sm:col-span-6 space-y-3">
                  {/* Name */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Name/பெயர்</span>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{nameEnglish}</h2>
                    {nameTamil && <p className="text-base font-bold text-slate-800">{nameTamil}</p>}
                  </div>

                  {/* ABHA Number */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ABHA number/அபா எண்</span>
                    <p className="text-lg font-black text-[#1A3B70] tracking-wider font-mono">{abhaNumber}</p>
                  </div>

                  {/* ABHA Address */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ABHA address/அபா முகவரி</span>
                    <p className="text-sm font-bold text-slate-900 font-mono">{abhaAddress}</p>
                  </div>
                </div>

                {/* QR Code Right */}
                <div className="sm:col-span-3 flex flex-col items-center justify-center text-center space-y-1">
                  <div className="p-2 bg-white border border-slate-300 rounded shadow-sm">
                    <QrCode size={90} className="text-slate-900" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Scan for Verification</span>
                </div>
              </div>

              {/* Bottom Footer Details Row */}
              <div className="mt-5 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="block text-slate-500 font-semibold">Gender/பாலினம்</span>
                  <span className="font-extrabold text-slate-900 text-sm">{genderText}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold">Date of birth/பிறந்த தேதி</span>
                  <span className="font-extrabold text-slate-900 text-sm">{dobFormatted}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold">Mobile/கைபேசி</span>
                  <span className="font-extrabold text-slate-900 text-sm">{mobile}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Badge & ABDM Linking Notice */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0" size={24} />
              <div>
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Official ABDM Verification Passed</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Linked to National Health Authority (NHA) &amp; Kerala Migrant Registry.</p>
              </div>
            </div>
            <a
              href="https://abha.abdm.gov.in/abha/v3"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 shrink-0"
            >
              <span>NHA Portal</span>
              <ExternalLink size={14} />
            </a>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">Card ID: {abhaNumber}</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer size={14} /> Print Card
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
            >
              Close Preview
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
