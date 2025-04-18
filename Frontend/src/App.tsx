import { Routes, Route } from "react-router-dom"
import { AppSidebar } from "./components/app-sidebar"
import Dashboard from "./pages/dashboard"
import ClientesPage from "./pages/client"
import BaseDatosPage from "./pages/dataBase"
import ConocimientoPage from "./pages/knowledge"
import AgentePage from "./pages/agent"
import AdminPage from "./pages/admin"
import InteraccionesPage from "./pages/interaction"
import AlertasPage from "./pages/alert"

function App() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/interacciones" element={<InteraccionesPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/base-datos" element={<BaseDatosPage />} />
          <Route path="/conocimiento" element={<ConocimientoPage />} />
          <Route path="/agente" element={<AgentePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
