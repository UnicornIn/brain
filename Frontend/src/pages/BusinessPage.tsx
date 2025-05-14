const BusinessPage = () => {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Datos de Negocio</h1>
        <p className="text-gray-500">Gestión de información empresarial, precios, reglas y horarios</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Reglas de Negocio</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Políticas y reglas aplicadas a los productos y servicios
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Descuentos</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>5% en compras mayores a $500</li>
                <li>10% en compras mayores a $1,000</li>
                <li>15% para clientes corporativos</li>
                <li>Descuento adicional del 3% en pagos en efectivo</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Horarios de Atención</h3>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Lunes a viernes: 9:00 AM - 6:00 PM</li>
                <li>Sábados: 10:00 AM - 2:00 PM</li>
                <li>Domingos: Cerrado</li>
                <li>Días festivos: Horario reducido de 11:00 AM - 4:00 PM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Catálogos de Precios</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Archivos de precios y productos disponibles</p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            <li className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="ml-2 text-sm font-medium text-gray-900">catalogo_precios_Q2_2023.xlsx</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  245 productos
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Última actualización: 15/04/2023 - Procesado y disponible para todos los agentes
              </div>
            </li>
            <li className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="ml-2 text-sm font-medium text-gray-900">politicas_empresa_2023.pdf</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  12 páginas
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Última actualización: 10/03/2023 - Procesado y disponible para todos los agentes
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default BusinessPage
