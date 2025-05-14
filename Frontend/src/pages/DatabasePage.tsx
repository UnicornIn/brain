import { useState, useEffect } from 'react';

interface Subscriber {
  _id: {
    $oid: string;
  };
  subscriber_id: string;
  custom_fields: {
    id: number;
    name: string;
    type: string;
    description: string;
    value: string;
  }[];
  email: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  whatsapp_phone: string | null;
  source_system: string;
  last_update: {
    $date: string;
  };
  subscribed_date?: string;
  subscribed?: string;
  ig_username?: string | null;
  tt_username?: string | null;
  profile_pic?: string;
}

const DatabasePage = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/subscribers/subscribers/contacts/all');
        if (!response.ok) {
          setError(response.statusText);
          return;
        }
        const data = await response.json();
        if (data.status === 'success') {
          setSubscribers(data.data);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, []);

  const getCustomFieldValue = (subscriber: Subscriber, fieldName: string): string => {
    const field = subscriber.custom_fields.find(f => f.name === fieldName);
    return field ? field.value : '';
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    // Filter by search term
    const matchesSearch = 
      subscriber.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscriber.last_name && subscriber.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subscriber.whatsapp_phone && subscriber.whatsapp_phone.includes(searchTerm)) ||
      (subscriber.email && subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by channel
    const matchesChannel = 
      !filterChannel || 
      subscriber.source_system.toLowerCase() === filterChannel.toLowerCase();
    
    return matchesSearch && matchesChannel;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Base de Datos de Clientes</h1>
        <p className="text-gray-500">Gestión de información y perfiles de clientes</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Total Clientes</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Clientes registrados en el sistema</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="text-3xl font-bold text-gray-900">{subscribers.length}</div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
            >
              <option value="">Todos los canales</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="tiktok">TikTok</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <svg
                className="mr-2 -ml-1 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información de Contacto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Canal
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Registro
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscribers.map((subscriber) => {
                const registerDate = subscriber.subscribed_date || subscriber.subscribed || '';
                const formattedDate = registerDate ? new Date(registerDate).toLocaleDateString() : 'No disponible';

                return (
                  <tr key={subscriber._id.$oid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {subscriber.profile_pic ? (
                            <img src={subscriber.profile_pic} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {subscriber.first_name?.charAt(0) || 'C'}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subscriber.first_name} {subscriber.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getCustomFieldValue(subscriber, 'Documento Identidad') || 'ID no disponible'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subscriber.whatsapp_phone || subscriber.phone || 'Teléfono no disponible'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subscriber.email || 'Email no disponible'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getCustomFieldValue(subscriber, 'Ciudad') || 'Ciudad no disponible'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscriber.source_system === "facebook"
                          ? "bg-blue-100 text-blue-800"
                          : subscriber.source_system === "instagram"
                            ? "bg-pink-100 text-pink-800"
                            : subscriber.source_system === "whatsapp"
                              ? "bg-green-100 text-green-800"
                              : subscriber.source_system === "tiktok"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-purple-100 text-purple-800"
                      }`}>
                        {subscriber.source_system}
                      </span>
                      {subscriber.ig_username && (
                        <div className="text-xs text-gray-500 mt-1">@{subscriber.ig_username}</div>
                      )}
                      {subscriber.tt_username && (
                        <div className="text-xs text-gray-500 mt-1">@{subscriber.tt_username}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formattedDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;