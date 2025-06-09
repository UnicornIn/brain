const IntelligencePage = () => {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inteligencia de Negocios</h1>
        <p className="text-gray-500">Análisis de datos y generación de insights estratégicos</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Módulo en Desarrollo</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Esta sección está actualmente en construcción</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-12 sm:px-6 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
              <svg
                className="h-8 w-8 text-gray-500"
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
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Brain de Inteligencia</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Este módulo permitirá analizar datos, generar informes y obtener insights estratégicos para la toma de
              decisiones.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Notificarme cuando esté disponible
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntelligencePage
