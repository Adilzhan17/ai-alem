import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import SearchPage from './pages/SearchPage.tsx'
import ResultsPage from './pages/ResultsPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import BlueprintPage from './pages/BlueprintPage.tsx'
import EstimatePage from './pages/EstimatePage.tsx'
import ContractorsPage from './pages/ContractorsPage.tsx'
import BrokerPage from './pages/BrokerPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import MyListingsPage from './pages/MyListingsPage.tsx'
import CreateListingPage from './pages/CreateListingPage.tsx'
import ProjectsPage from './pages/ProjectsPage.tsx'
import ProjectDetailsPage from './pages/ProjectDetailsPage.tsx'
import ContractorDashboardPage from './pages/ContractorDashboardPage.tsx'
import SupplierDashboardPage from './pages/SupplierDashboardPage.tsx'
import ClientRequestsPage from './pages/ClientRequestsPage.tsx'

// Backoffice
import BackofficeLayout from './pages/backoffice/BackofficeLayout.tsx'
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard.tsx'
import BackofficeModeration from './pages/backoffice/BackofficeModeration.tsx'
import BackofficeUsers from './pages/backoffice/BackofficeUsers.tsx'
import BackofficeAudit from './pages/backoffice/BackofficeAudit.tsx'
import BackofficeListings from './pages/backoffice/BackofficeListings.tsx'
import BackofficeComplaints from './pages/backoffice/BackofficeComplaints.tsx'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen bg-qal-bg flex items-center justify-center text-qal-text-secondary">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="h-screen bg-qal-bg flex items-center justify-center text-qal-text-secondary">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.system_role || !['admin', 'moderator'].includes(user.system_role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const RoleRoute = ({ children, allowed }: { children: React.ReactNode, allowed: Array<'client' | 'contractor' | 'supplier-materials'> }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="h-screen bg-qal-bg flex items-center justify-center text-qal-text-secondary">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!user?.role || !allowed.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const RoleHome = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <div className="h-screen bg-qal-bg flex items-center justify-center text-qal-text-secondary">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === 'contractor') return <ContractorDashboardPage />;
  if (user?.role === 'supplier-materials') return <SupplierDashboardPage />;
  return <DashboardPage />;
};

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Pages */}
      <Route path="/" element={<RoleHome />} />
      <Route path="/dashboard" element={<RoleRoute allowed={['client']}><DashboardPage /></RoleRoute>} />
      <Route path="/search" element={<RoleRoute allowed={['client']}><SearchPage /></RoleRoute>} />
      <Route path="/results" element={<RoleRoute allowed={['client']}><ResultsPage /></RoleRoute>} />
      <Route path="/blueprint" element={<RoleRoute allowed={['client']}><BlueprintPage /></RoleRoute>} />
      <Route path="/projects" element={<RoleRoute allowed={['client']}><ProjectsPage /></RoleRoute>} />
      <Route path="/projects/:id" element={<RoleRoute allowed={['client']}><ProjectDetailsPage /></RoleRoute>} />
      <Route path="/estimate" element={<RoleRoute allowed={['client']}><EstimatePage /></RoleRoute>} />
      <Route path="/contractors" element={<RoleRoute allowed={['client']}><ContractorsPage /></RoleRoute>} />
      <Route path="/broker" element={<RoleRoute allowed={['client']}><BrokerPage /></RoleRoute>} />
      <Route path="/requests" element={<RoleRoute allowed={['client']}><ClientRequestsPage /></RoleRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/listings" element={<RoleRoute allowed={['client']}><ResultsPage /></RoleRoute>} />
      <Route path="/my-listings" element={<RoleRoute allowed={['client']}><MyListingsPage /></RoleRoute>} />
      <Route path="/listings/create" element={<RoleRoute allowed={['client']}><CreateListingPage /></RoleRoute>} />

      {/* Role panels */}
      <Route path="/contractor" element={<RoleRoute allowed={['contractor']}><ContractorDashboardPage /></RoleRoute>} />
      <Route path="/supplier" element={<RoleRoute allowed={['supplier-materials']}><SupplierDashboardPage /></RoleRoute>} />

      {/* Backoffice */}
      <Route path="/backoffice" element={<AdminRoute><BackofficeLayout /></AdminRoute>}>
        <Route index element={<BackofficeDashboard />} />
        <Route path="moderation" element={<BackofficeModeration />} />
        <Route path="listings" element={<BackofficeListings />} />
        <Route path="users" element={<BackofficeUsers />} />
        <Route path="complaints" element={<BackofficeComplaints />} />
        <Route path="audit" element={<BackofficeAudit />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
