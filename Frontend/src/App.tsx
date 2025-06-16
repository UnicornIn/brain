import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import LoginPage from "./pages/LoginPage/LoginPage"
import DashboardPage from "./pages/DashboardPage/DashboardPage"
import DatabasePage from "./pages/DatabasePage/DatabasePage"
import BusinessPage from "./pages/BusinessPage/BusinessPage"
import OmnichannelPage from "./pages/OmnichannelPage/OmnichannelPage"
import IntelligencePage from "./pages/IntelligencePage/IntelligencePage"
import CreateCommunityPage from "./pages/ComunityPage/Communities/create"
import CommunityDetailPage from "./pages/ComunityPage/Communities/[id]"
import Manages from "./pages/ComunityPage/Communities/manages"
import CommunitiesPage from "./pages/ComunityPage/CommunitiesPage"
import PublicCommunityPage from "./pages/ComunityPage/Communities/PublicCommunityPage" // Nuevo componente
import Layout from "./components/Layout"
import { TooltipProvider } from "./components/ui/tooltip"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/community/:slug" element={<PublicCommunityPage />} />
            
            {/* Rutas protegidas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/database"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DatabasePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/business"
              element={
                <ProtectedRoute>
                  <Layout>
                    <BusinessPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/omnichannel"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OmnichannelPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateCommunityPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CommunitiesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CommunityDetailPage />
                  </Layout>
                </ProtectedRoute>   
              }
            />
            <Route
              path="/communities/manages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Manages />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/intelligence"
              element={
                <ProtectedRoute>
                  <Layout>
                    <IntelligencePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </AuthProvider>
  )
}

export default App