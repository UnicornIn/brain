import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/auth-context"
import { AuthGuard } from "./components/auth-guard"
import { AppSidebar } from "./components/app-sidebar"
import { Toaster } from "./components/ui/toaster"
import Dashboard from "./pages/dashboard"
import ClientPage from "./pages/client"
import DataBasePage from "./pages/dataBase"
import KnowledgePage from "./pages/knowledge"
import AgentPage from "./pages/agent"
import AdminPage from "./pages/admin"
import InteractionPage from "./pages/interaction"
import AlertPage from "./pages/alert"
import ProfilePage from "./pages/profile"
import LoginPage from "./pages/auth/login"
import ResetPasswordPage from "./pages/auth/reset-password"

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/clientes" element={<ClientPage />} />
          <Route path="/interacciones" element={<InteractionPage />} />
          <Route path="/alertas" element={<AlertPage />} />
          <Route path="/base-datos" element={<DataBasePage />} />
          <Route path="/conocimiento" element={<KnowledgePage />} />
          <Route path="/agente" element={<AgentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}

// Layout component that wraps all protected routes
function Layout() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="/clientes" element={<ClientPage />} />
          <Route path="/interacciones" element={<InteractionPage />} />
          <Route path="/alertas" element={<AlertPage />} />
          <Route path="/base-datos" element={<DataBasePage />} />
          <Route path="/conocimiento" element={<KnowledgePage />} />
          <Route path="/agente" element={<AgentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App