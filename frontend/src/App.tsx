import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import LandingPage from './pages/LandingPage.tsx'
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

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-qal-bg text-qal-text-secondary">
    Loading session...
  </div>
)

const getHomeRouteByRole = (role?: 'client' | 'contractor' | 'supplier-materials') => {
  if (role === 'contractor') return '/contractor'
  if (role === 'supplier-materials') return '/supplier'
  return '/dashboard'
}

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ from }} replace />
  }

  return <>{children}</>
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ from }} replace />
  }
  if (!user?.system_role || !['admin', 'moderator'].includes(user.system_role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const RoleRoute = ({ children, allowed }: { children: React.ReactNode, allowed: Array<'client' | 'contractor' | 'supplier-materials'> }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" state={{ from }} replace />
  }
  if (!user?.role || !allowed.includes(user.role)) {
    return <Navigate to={getHomeRouteByRole(user?.role)} replace />
  }
  return <>{children}</>
}

const RoleHome = () => {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <LandingPage />
  return <Navigate to={getHomeRouteByRole(user?.role)} replace />
}

const AuthPageRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to={getHomeRouteByRole(user?.role)} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<AuthPageRoute><LoginPage /></AuthPageRoute>} />
      <Route path="/register" element={<AuthPageRoute><RegisterPage /></AuthPageRoute>} />

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
