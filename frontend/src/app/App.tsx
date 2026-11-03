import type { ReactNode } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
<<<<<<< Updated upstream
import { RequireAuth, RequireAdmin } from './components/RequireAuth';
=======
import { RequireWallet } from './components/RequireWallet';
>>>>>>> Stashed changes
import { Landing } from './components/screens/Landing';
import { UserLogin } from './components/screens/UserLogin';
import { AdminLogin } from './components/screens/AdminLogin';
import { Dashboard } from './components/screens/Dashboard';
import { AdminDashboard } from './components/screens/AdminDashboard';
import { PropertySearch } from './components/screens/PropertySearch';
import { PropertyRegistration } from './components/screens/PropertyRegistration';
import { PropertyTransfer } from './components/screens/PropertyTransfer';
import { InheritanceTransfer } from './components/screens/InheritanceTransfer';
import { PropertyDetails } from './components/screens/PropertyDetails';
import { DocumentVerification } from './components/screens/DocumentVerification';
import { Notifications } from './components/screens/Notifications';
import { Profile } from './components/screens/Profile';
import { Applications } from './components/screens/Applications';
import { ApplicationDetails } from './components/screens/ApplicationDetails';
import { MyProperties } from './components/screens/MyProperties';
import { Transactions } from './components/screens/Transactions';
<<<<<<< Updated upstream
import { LandValuation } from './components/screens/LandValuation';
import { PublicVerify } from './components/screens/PublicVerify';
import { AdminUsers } from './components/screens/AdminUsers';
=======
import { AdminDashboard } from './components/screens/AdminDashboard';
import { PublicVerification } from './components/screens/PublicVerification';
>>>>>>> Stashed changes
import { ScrollToTop } from './components/ScrollToTop';
import { AdminLogin } from './components/screens/Login';

<<<<<<< Updated upstream
function Protected({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function AdminOnly({ children }: { children: ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>;
=======
function Protected({ children, role = 'user' }: { children: ReactNode; role?: 'user' | 'admin' }) {
  return <RequireWallet role={role}>{children}</RequireWallet>;
>>>>>>> Stashed changes
}

export default function App() {
  return (
    <AuthProvider>
<<<<<<< Updated upstream
      <WalletProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/public/verify/:identifier" element={<PublicVerify />} />
            <Route path="/verify/property/:identifier" element={<PublicVerify />} />

            <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
            <Route path="/admin/applications/:applicationId" element={<AdminOnly><ApplicationDetails /></AdminOnly>} />
            <Route path="/admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/properties" element={<Protected><MyProperties /></Protected>} />
            <Route path="/search" element={<Protected><PropertySearch /></Protected>} />
            <Route path="/properties/:propertyId" element={<Protected><PropertyDetails /></Protected>} />
            <Route path="/applications" element={<Protected><Applications /></Protected>} />
            <Route path="/applications/:applicationId" element={<Protected><ApplicationDetails /></Protected>} />
            <Route path="/applications/new" element={<Protected><PropertyRegistration /></Protected>} />
            <Route path="/transfer" element={<Protected><PropertyTransfer /></Protected>} />
            <Route path="/inheritance" element={<Protected><InheritanceTransfer /></Protected>} />
            <Route path="/valuation" element={<Protected><LandValuation /></Protected>} />
            <Route path="/verify" element={<Protected><DocumentVerification /></Protected>} />
            <Route path="/map" element={<Protected><PropertySearch /></Protected>} />
            <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/register" element={<Navigate to="/applications/new" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </WalletProvider>
=======
    <WalletProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
          <Route path="/verify/property/:identifier" element={<PublicVerification />} />

          <Route path="/dashboard" element={<Protected role="user"><Dashboard /></Protected>} />
          <Route path="/properties" element={<Protected><MyProperties /></Protected>} />
          <Route path="/search" element={<Protected><PropertySearch /></Protected>} />
          <Route path="/properties/:propertyId" element={<Protected><PropertyDetails /></Protected>} />
          <Route path="/property/details" element={<Protected><PropertyDetails /></Protected>} />
          <Route path="/applications" element={<Protected><Applications /></Protected>} />
          <Route path="/applications/:applicationId" element={<Protected><ApplicationDetails /></Protected>} />
          <Route path="/applications/new" element={<Protected><PropertyRegistration /></Protected>} />
          <Route path="/transfer" element={<Protected><PropertyTransfer /></Protected>} />
          <Route path="/verify" element={<Protected><DocumentVerification /></Protected>} />
          <Route path="/map" element={<Protected><PropertySearch /></Protected>} />
          <Route path="/transactions" element={<Protected><Transactions /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/register" element={<Navigate to="/applications/new" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WalletProvider>
>>>>>>> Stashed changes
    </AuthProvider>
  );
}
