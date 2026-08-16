import PublicNavbar from '../../components/layout/PublicNavbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import VideoBackground from '../../components/common/VideoBackground.jsx';

const NOVELTY = [
  ['Portable Migrant Health ID (MHID)', 'Issued by the platform itself, so registration never blocks on external ID availability. An ABHA number can be linked optionally when the worker has one.'],
  ['Continuity across districts', 'The record follows the worker from Ernakulam to Kozhikode to Kannur. Each entry carries the hospital and district that created it.'],
  ['Government scheme recommendation', 'Age, gender, occupation, district and health conditions are evaluated against scheme eligibility rules, with an explanation of why each scheme applies.'],
  ['Connected hospital network', 'One shared record instead of isolated hospital silos, with a full audit trail of who read or wrote what.'],
  ['Mental health as first-class care', 'PHQ-9 and GAD-7 screening with a separate, stricter access tier and explicit worker consent.'],
  ['Government analytics dashboard', 'District-wise worker counts, disease trends, hospital load, vaccination and screening coverage for planning.'],
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <VideoBackground videoSrc="/bg-video.mp4" overlayOpacity="bg-black/20 dark:bg-slate-950/40" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicNavbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-12 py-14">
          <SectionTitle align="left" eyebrow="About" title="Why Aaroham exists" />

          <div className="mac-glass-card p-6 space-y-4 text-slate-700 dark:text-slate-200 leading-relaxed shadow-lg">
            <p>
              Kerala hosts one of India's largest inter-state migrant workforces. These workers move
              frequently between employers, worksites and districts — and their medical records, which
              are almost entirely paper-based, do not move with them.
            </p>
            <p>
              The consequence is care delivered in fragments. A worker treated for hypertension in
              Ernakulam arrives in Kozhikode months later with no prescription, no diagnosis and no
              record of a penicillin allergy. Tests are repeated at the worker's own cost in lost wages.
              Treatment courses for tuberculosis, diabetes and hypertension break mid-way. Mental health
              is rarely screened at all.
            </p>
            <p>
              Aaroham issues each worker a portable Migrant Health ID and keeps one continuous
              record behind it. Any authorised hospital in the network can read the latest version and
              write to it, and every access is logged. Health authorities see aggregate trends without
              seeing identifiable records.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-blue-600 dark:text-blue-400">What makes it different</h2>
          <div className="space-y-3.5">
            {NOVELTY.map(([title, text], i) => (
              <div key={title} className="mac-glass-card p-5 flex gap-4 hover:scale-[1.01] transition-transform">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-blue-600/90 text-white text-sm font-bold shadow-md shadow-blue-500/25 shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mt-10 mb-4 text-blue-600 dark:text-blue-400">System particulars</h2>
          <div className="mac-glass-card overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Administering Department', 'Department of Health & Family Welfare, Government of Kerala'],
                  ['System Category', 'Public Health Information System'],
                  ['Beneficiary Group', 'Inter-state migrant workers registered in Kerala'],
                  ['Current Status', 'Working prototype · Milestone I'],
                  ['Data Protection', 'Role-based access · consent-gated sensitive records · append-only audit trail'],
                  ['Technology Platform', 'React · Node.js / Express · PostgreSQL · Chart.js'],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-white/20 dark:border-white/10 last:border-0">
                    <th scope="row" className="text-left px-4 py-3 font-semibold text-blue-700 dark:text-blue-300 w-52 bg-white/30 dark:bg-white/5">{k}</th>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
