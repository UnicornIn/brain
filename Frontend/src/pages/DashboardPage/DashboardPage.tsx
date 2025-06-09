import { Link } from "react-router-dom"

const DashboardPage = () => {
  const modules = [
    {
      title: "Base de Datos",
      description: "Gestión de datos de clientes y perfiles",
      path: "/database",
      color: "bg-blue-100 text-blue-700",
      icon: () => (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      title: "Datos de Negocio",
      description: "Gestión de información empresarial, precios, reglas y horarios",
      path: "/business",
      color: "bg-green-100 text-green-700",
      icon: () => (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "Omnicanal",
      description: "Gestión de comunicaciones con clientes",
      path: "/omnichannel",
      color: "bg-purple-100 text-purple-700",
      icon: () => (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      title: "Inteligencia de Negocios",
      description: "Análisis y visualización de datos",
      path: "/intelligence",
      color: "bg-amber-100 text-amber-700",
      icon: () => (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Bienvenido al sistema Brain CRM</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <div key={module.path} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${module.color}`}>
                <module.icon />
              </div>
              <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{module.description}</p>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <Link to={module.path} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Acceder al módulo
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
