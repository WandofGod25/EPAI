import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthProvider from './components/AuthProvider'
import { ApiKeyProvider } from './components/ApiKeyProvider'
import { Toaster } from './components/ui/toaster'
import DashboardLayout from './components/dashboard/DashboardLayout'
import { LoginPage } from './pages/LoginPage'
import OverviewPage from './pages/OverviewPage'
import ModelsPage from './pages/ModelsPage'
import LogsPage from './pages/LogsPage'
import InsightsPage from './pages/InsightsPage'
import SettingsPage from './pages/SettingsPage'
import IntegrationPage from './pages/IntegrationPage'
import SDKShowroomPage from './pages/SDKShowroomPage'
import TestImport from './test-import'

const AppRoutes = () => {

  return (
    <Router>
      <AuthProvider>
        <ApiKeyProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<OverviewPage />} />
                <Route path="models" element={<ModelsPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="integration" element={<IntegrationPage />} />
                <Route path="sdk-showroom" element={<SDKShowroomPage />} />
                <Route path="test-import" element={<TestImport />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </ApiKeyProvider>
      </AuthProvider>
    </Router>
  )
}

export default AppRoutes
