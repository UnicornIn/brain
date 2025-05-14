const OmnichannelPage = () => {
  const conversations = [
    {
      name: "María González",
      message: "Tengo una consulta sobre mi último pedido...",
      time: "Hace 5 min",
      channel: "whatsapp",
      status: "open",
    },
    {
      name: "Carlos Rodríguez",
      message: "¿Cuándo estará disponible el producto X?",
      time: "Hace 15 min",
      channel: "facebook",
      status: "pending",
    },
    {
      name: "Ana Martínez",
      message: "Gracias por la información proporcionada...",
      time: "Hace 30 min",
      channel: "email",
      status: "resolved",
    },
    {
      name: "Juan López",
      message: "Necesito cambiar la dirección de entrega...",
      time: "Hace 1 hora",
      channel: "instagram",
      status: "open",
    },
    {
      name: "Laura Sánchez",
      message: "¿Tienen disponible el producto en color azul?",
      time: "Hace 2 horas",
      channel: "tiktok",
      status: "pending",
    },
  ]

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Omnicanal</h1>
        <p className="text-gray-500">Gestión centralizada de comunicaciones con clientes</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Bandeja de Entrada Unificada</h2>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg
              className="mr-2 -ml-1 h-5 w-5"
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
            Nueva Conversación
          </button>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation, index) => (
              <li key={index} className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">{conversation.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{conversation.name}</p>
                      <p className="text-xs text-gray-500">{conversation.time}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conversation.message}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          conversation.channel === "facebook"
                            ? "bg-blue-100 text-blue-800"
                            : conversation.channel === "instagram"
                              ? "bg-pink-100 text-pink-800"
                              : conversation.channel === "whatsapp"
                                ? "bg-green-100 text-green-800"
                                : conversation.channel === "tiktok"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {conversation.channel}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          conversation.status === "open"
                            ? "bg-blue-100 text-blue-800"
                            : conversation.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {conversation.status === "open"
                          ? "Abierto"
                          : conversation.status === "pending"
                            ? "Pendiente"
                            : "Resuelto"}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OmnichannelPage
