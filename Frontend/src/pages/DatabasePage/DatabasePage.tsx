import { useState, useEffect } from 'react';

interface Contact {
  _id: string;
  subscriber_id: string;
  canal: string;
  created_at: string;
  last_updated?: string;
  numero?: string;
  info: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    whatsapp_phone?: string;
    ig_username?: string;
    tt_username?: string;
    subscribed?: string;
    numero?: string | null;
    unique_id?: string;
  };
}

const DatabasePage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    facebook: 0,
    instagram: 0,
    whatsapp: 0,
    tiktok: 0
  });
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://staging-brain.rizosfelices.co/client/contacts/info');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setContacts(data.contactos || []);
      setStats({
        total: data.total || 0,
        facebook: data.stats?.by_channel?.facebook || 0,
        instagram: data.stats?.by_channel?.instagram || 0,
        whatsapp: data.stats?.by_channel?.whatsapp || 0,
        tiktok: data.stats?.by_channel?.tiktok || 0
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar contactos');
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const refreshData = () => {
    fetchContacts();
  };

  const filteredContacts = filter === 'all' 
    ? contacts 
    : contacts.filter(c => c.canal === filter);

  const getInitials = (name?: string, lastName?: string) => {
    if (!name || !lastName) return 'NN';
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const renderChannelInfo = (contact: Contact) => {
    switch(contact.canal) {
      case 'facebook':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
            </svg>
            <span>{contact.info.first_name || ''} {contact.info.last_name || ''}</span>
          </div>
        );
      
      case 'instagram':
        return (
          <div className="flex items-center gap-2 text-pink-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            <span>@{contact.info.ig_username || 'sin_usuario'}</span>
          </div>
        );
      
      case 'whatsapp':
        const whatsappNumber = contact.numero || contact.info.numero || contact.info.whatsapp_phone || contact.info.phone;
        return (
          <div className="flex items-center gap-2 text-green-600">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>
              {whatsappNumber ? (
                <a href={`https://wa.me/${whatsappNumber.replace('+', '')}`} target="_blank" rel="noopener noreferrer">
                  {whatsappNumber}
                </a>
              ) : 'Sin número'}
            </span>
          </div>
        );
      
      case 'tiktok':
        return (
          <div className="flex items-center gap-2 text-gray-900">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            <span>@{contact.info.tt_username || 'sin_usuario'}</span>
          </div>
        );
      
      default:
        return <span className="text-gray-500">Información no disponible</span>;
    }
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={fetchContacts}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Base de Datos de Clientes</h1>
          <p className="text-gray-600">Gestión de información y perfiles</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm w-24 text-center">
            <p className="text-gray-500 text-sm">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl shadow-sm w-24 text-center">
            <p className="text-blue-500 text-sm">Facebook</p>
            <p className="text-2xl font-bold text-blue-600">{stats.facebook}</p>
          </div>
          <div className="bg-pink-50 p-4 rounded-xl shadow-sm w-24 text-center">
            <p className="text-pink-500 text-sm">Instagram</p>
            <p className="text-2xl font-bold text-pink-600">{stats.instagram}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl shadow-sm w-24 text-center">
            <p className="text-green-500 text-sm">WhatsApp</p>
            <p className="text-2xl font-bold text-green-600">{stats.whatsapp}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl shadow-sm w-24 text-center">
            <p className="text-gray-700 text-sm">TikTok</p>
            <p className="text-2xl font-bold text-gray-900">{stats.tiktok}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('facebook')}
            className={`px-4 py-2 rounded-full text-sm ${filter === 'facebook' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Facebook
          </button>
          <button 
            onClick={() => setFilter('instagram')}
            className={`px-4 py-2 rounded-full text-sm ${filter === 'instagram' ? 'bg-pink-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Instagram
          </button>
          <button 
            onClick={() => setFilter('whatsapp')}
            className={`px-4 py-2 rounded-full text-sm ${filter === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
          >
            WhatsApp
          </button>
          <button 
            onClick={() => setFilter('tiktok')}
            className={`px-4 py-2 rounded-full text-sm ${filter === 'tiktok' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
          >
            TikTok
          </button>
          <button 
            onClick={refreshData}
            className="px-4 py-2 rounded-full bg-white text-gray-700 text-sm flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        <div className="space-y-3">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(contact => (
              <div key={contact._id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {getInitials(contact.info?.first_name, contact.info?.last_name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {contact.info?.first_name || 'Nombre no disponible'} {contact.info?.last_name || ''}
                      </p>
                      <p className="text-gray-500 text-sm">
                        ID: {contact.info?.unique_id ? `RF-${contact.info.unique_id.padStart(4, '0')}` : contact.subscriber_id || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1">
                    {renderChannelInfo(contact)}
                  </div>

                  <div className="text-gray-500 text-sm md:text-right">
                    <div>Registro: {formatDate(contact.created_at)}</div>
                    {contact.last_updated && (
                      <div>Actualizado: {formatDate(contact.last_updated)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <p className="text-gray-500">No se encontraron contactos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabasePage;