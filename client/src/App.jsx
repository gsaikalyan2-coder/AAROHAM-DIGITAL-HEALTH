import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/public/LandingPage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import LoginSelectPage from './pages/public/LoginSelectPage.jsx';
import NotFound from './pages/public/NotFound.jsx';

import WorkerLogin from './pages/auth/WorkerLogin.jsx';
import DoctorLogin from './pages/auth/DoctorLogin.jsx';
import AdminLogin from './pages/auth/AdminLogin.jsx';

import DashboardLayout from './components/layout/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

import WorkerDashboard from './pages/worker/WorkerDashboard.jsx';
import WorkerProfile from './pages/worker/WorkerProfile.jsx';
import MedicalHistory from './pages/worker/MedicalHistory.jsx';
import Prescriptions from './pages/worker/Prescriptions.jsx';
import WorkerAppointments from './pages/worker/WorkerAppointments.jsx';
import Vaccinations from './pages/worker/Vaccinations.jsx';
import MentalHealth from './pages/worker/MentalHealth.jsx';
import Schemes from './pages/worker/Schemes.jsx';
import LabReports from './pages/worker/LabReports.jsx';

import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import PatientSearch from './pages/doctor/PatientSearch.jsx';
import PatientRecord from './pages/doctor/PatientRecord.jsx';
import DoctorConsultations from './pages/doctor/DoctorConsultations.jsx';
import DoctorAppointments from './pages/doctor/DoctorAppointments.jsx';
import DoctorPatients from './pages/doctor/DoctorPatients.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Analytics from './pages/admin/Analytics.jsx';
import DataImport from './pages/admin/DataImport.jsx';
import Hospitals from './pages/admin/Hospitals.jsx';
import WorkerRegistry from './pages/admin/WorkerRegistry.jsx';
import AuditLogs from './pages/admin/AuditLogs.jsx';

import AIChatbot from './components/common/AIChatbot.jsx';
import PrivacyConsentModal from './components/common/PrivacyConsentModal.jsx';

export default function App() {
  return (
    <>
      {/* Privacy Consent Popup on website entry */}
      <PrivacyConsentModal />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginSelectPage />} />
        <Route path="/login/worker" element={<WorkerLogin />} />
        <Route path="/login/doctor" element={<DoctorLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />

        {/* Worker portal */}
        <Route
          path="/worker"
          element={
            <ProtectedRoute role="worker">
              <DashboardLayout role="worker" />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkerDashboard />} />
          <Route path="profile" element={<WorkerProfile />} />
          <Route path="history" element={<MedicalHistory />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="appointments" element={<WorkerAppointments />} />
          <Route path="vaccinations" element={<Vaccinations />} />
          <Route path="lab-reports" element={<LabReports />} />
          <Route path="mental-health" element={<MentalHealth />} />
          <Route path="schemes" element={<Schemes />} />
        </Route>

        {/* Doctor portal */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute role="doctor">
              <DashboardLayout role="doctor" />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="search" element={<PatientSearch />} />
          <Route path="patient/:mhid" element={<PatientRecord />} />
          <Route path="consultations" element={<DoctorConsultations />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatients />} />
        </Route>

        {/* Government admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="import" element={<DataImport />} />
          <Route path="hospitals" element={<Hospitals />} />
          <Route path="workers" element={<WorkerRegistry />} />
          <Route path="audit" element={<AuditLogs />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>

      {/* Floating AI Health Chatbot */}
      <AIChatbot />
    </>
  );
}
