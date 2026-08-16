import { Link } from 'react-router-dom';
import {
  CreditCard, Hospital, Stethoscope, FileHeart, CalendarCheck, Brain, BarChart3,
  ArrowRight, ShieldCheck, MapPin, Languages,
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar.jsx';
import Footer from '../../components/layout/Footer.jsx';
import SectionTitle from '../../components/common/SectionTitle.jsx';
import VideoBackground from '../../components/common/VideoBackground.jsx';

const FEATURES = [
  { icon: CreditCard, title: 'Portable Migrant Health ID', text: 'Every worker receives a unique MHID that stays with them across employers, districts and hospitals — no dependency on external ID availability.' },
  { icon: Hospital, title: 'Connected Hospital Network', text: 'Participating hospitals read and write to one shared record. An update in Ernakulam is visible in Kannur the same day.' },
  { icon: FileHeart, title: 'Complete Health Record', text: 'Blood group, allergies, chronic conditions, prescriptions, lab reports, vaccinations and doctor notes in one continuous timeline.' },
  { icon: Stethoscope, title: 'Doctor Portal', text: 'Search by MHID, see the full history before prescribing, record diagnosis, upload reports and schedule follow-up.' },
  { icon: Brain, title: 'Mental Health Module', text: 'PHQ-9 and GAD-7 screening treated as first-class care, with a stricter access tier and explicit worker consent.' },
  { icon: CalendarCheck, title: 'Appointments & Reminders', text: 'Book visits, track follow-up schedules and receive reminders so treatment courses are actually completed.' },
  { icon: BarChart3, title: 'Government Analytics', text: 'District-wise worker counts, disease trends, hospital load and vaccination coverage for evidence-based planning.' },
  { icon: Languages, title: 'Multilingual by Design', text: 'Interface built for English, Malayalam, Hindi and Bengali — the languages migrant workers in Kerala actually use.' },
];

const FLOW = [
  'Worker registration & ABHA ID creation',
  'Profile & Health details saved to PostgreSQL',
  'Doctor searches by ABHA ID at any hospital',
  'Full medical history reviewed',
  'Consultation & prescription recorded',
  'Worker sees the updated record',
  'Government dashboard updates',
];

const PROBLEMS = [
  { title: 'Records are lost on relocation', text: 'Paper prescriptions and reports do not survive a move from one labour camp or district to the next.' },
  { title: 'Tests are repeated needlessly', text: 'Without prior history, each new hospital re-orders the same investigations — costing the worker time and wages.' },
  { title: 'Prescribing without history is unsafe', text: 'Allergies, chronic conditions and current medication are invisible to the next doctor.' },
  { title: 'Follow-ups are missed', text: 'Treatment courses break mid-way, and TB, hypertension and diabetes care goes incomplete.' },
  { title: 'Authorities are flying blind', text: 'No aggregate visibility into disease trends or vaccination coverage among the migrant workforce.' },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col text-gray-900 dark:text-gray-100 transition-colors">
      <VideoBackground videoSrc="/bg-video.mp4" overlayOpacity="" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <PublicNavbar />

        {/* Hero - Full Width & Calm Clinical Aesthetic */}
        <section className="w-full transition-colors">
          <div className="w-full px-6 sm:px-12 lg:px-16 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#8FB8DE] dark:text-[#7DD3C0] tracking-tight">
                Digital Health Records for Migrant Workers in Kerala
              </h1>
              <p className="mt-5 mb-8 text-base sm:text-lg text-slate-300 font-normal max-w-2xl leading-relaxed">
                Aaroham ensures continuous, dignified care with portable medical histories and verified health access across every clinic and district in Kerala.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/login/worker" className="px-7 py-3.5 bg-[#1e405f]/75 hover:bg-[#1e405f]/95 active:scale-95 text-[#D6E6F5] font-medium rounded-full shadow-md border border-[#8FB8DE]/25 backdrop-blur-md transition-all duration-200">
                  Worker Portal
                </Link>
                <Link to="/login/doctor" className="px-7 py-3.5 bg-[#133045]/75 hover:bg-[#133045]/95 active:scale-95 text-[#B6D6F2] font-medium rounded-full shadow-md border border-[#8FB8DE]/20 backdrop-blur-md transition-all duration-200">
                  Doctor Portal
                </Link>
                <Link to="/login/admin" className="px-7 py-3.5 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 active:scale-95 text-slate-800 dark:text-slate-200 font-medium rounded-full shadow-sm border border-white/40 dark:border-white/10 backdrop-blur-md transition-all duration-200">
                  Admin Portal
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <img
                src="/kerala.jpeg"
                alt="Migrant worker in Kerala"
                className="w-full max-w-lg lg:max-w-none rounded-2xl shadow-2xl border border-white/20"
              />
            </div>
          </div>
        </section>

        {/* Problem - Full Width */}
        <section className="w-full px-6 sm:px-12 lg:px-16 py-16">
          <SectionTitle
            align="left"
            eyebrow="The problem"
            title="Kerala hosts over 30 lakh inter-state migrant workers. Their health records do not travel with them."
            description="Care is delivered in fragments — each hospital visit starts from zero."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="gov-card p-6 border-l-4 border-l-gov-saffron bg-white/90 dark:bg-gray-900/90 dark:border-gray-800 shadow-md">
                <h3 className="font-semibold mb-2 dark:text-white text-base">{p.title}</h3>
                <p className="text-sm text-gov-muted dark:text-gray-400 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features - Full Width */}
        <section className="w-full bg-white/80 dark:bg-gray-900/80 border-y border-gov-border/60 dark:border-gray-800/60 transition-colors">
          <div className="w-full px-6 sm:px-12 lg:px-16 py-16">
            <SectionTitle
              eyebrow="Key features"
              title="What Aaroham provides"
              description="Built for three users — the worker, the treating doctor, and the health authority."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="gov-card p-6 h-full bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#8FB8DE] dark:text-[#7DD3C0] mb-4">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold mb-2 text-base dark:text-white">{title}</h3>
                  <p className="text-sm text-gov-muted dark:text-gray-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data flow - Full Width */}
        <section className="w-full px-6 sm:px-12 lg:px-16 py-16">
          <SectionTitle eyebrow="How it works" title="From registration to policy insight" />
          <div className="gov-card p-8 overflow-x-auto bg-white/90 dark:bg-gray-900/90 dark:border-gray-800 shadow-md mt-6">
            <ol className="flex flex-col lg:flex-row lg:items-stretch gap-4 min-w-full">
              {FLOW.map((step, i) => (
                <li key={step} className="flex lg:flex-col items-center gap-4 lg:flex-1">
                  <div className="flex-1 w-full bg-gov-gray dark:bg-gray-800 border border-gov-border dark:border-gray-700 rounded-xl px-4 py-4 text-center">
                    <span className="block text-xs font-semibold text-[#8FB8DE] dark:text-[#7DD3C0] mb-1.5">STEP {i + 1}</span>
                    <span className="text-sm leading-snug dark:text-gray-200 font-medium">{step}</span>
                  </div>
                  {i < FLOW.length - 1 && (
                    <ArrowRight size={18} className="text-gov-muted dark:text-gray-500 rotate-90 lg:rotate-0 shrink-0" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* SDG - Full Width */}
        <section className="w-full bg-gov-navy dark:bg-gray-900 text-white border-t border-gray-800">
          <div className="w-full px-6 sm:px-12 lg:px-16 py-16 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-4">
              <div className="border border-white/20 rounded-2xl p-8 text-center mac-glass">
                <p className="text-6xl font-extrabold text-[#7DD3C0]">03</p>
                <p className="mt-3 font-semibold text-lg">Good Health &amp; Well-being</p>
                <p className="text-sm text-white/60 mt-1">UN Sustainable Development Goal</p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <h2 className="text-3xl font-bold text-white mb-4">Contribution to SDG 3</h2>
              <ul className="space-y-4 text-white/80 text-base">
                <li><strong className="text-[#8FB8DE]">3.8 Universal health coverage —</strong> connects an
                  under-served migrant population to essential health services.</li>
                <li><strong className="text-[#8FB8DE]">3.3 Communicable diseases —</strong> continuous records
                  and vaccination tracking prevent broken TB and hepatitis treatment courses.</li>
                <li><strong className="text-[#8FB8DE]">3.4 Mental health —</strong> structured screening brings migrant health into formal care.</li>
              </ul>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
