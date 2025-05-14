import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import LoginPage from "./pages/LoginPage"
import DashboardPage from "./pages/DashboardPage"
import DatabasePage from "./pages/DatabasePage"
import BusinessPage from "./pages/BusinessPage"
import OmnichannelPage from "./pages/OmnichannelPage"
import IntelligencePage from "./pages/IntelligencePage"
import Layout from "./components/Layout"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
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
    </AuthProvider>
  )
}

export default App
