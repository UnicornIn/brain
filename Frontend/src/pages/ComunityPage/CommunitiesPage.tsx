"use client"

import {
  Button,
} from "../../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import {
  Search,
  Plus,
  Users,
  Link2,
  BarChart3,
  Calendar,
  Filter,
  ArrowUpRight
} from "lucide-react"
import { Link } from "react-router-dom"
import { useEffect, useState } from "react"

interface Community {
  id: string;
  title: string;
  description: string;
  url: string;
  members: number;
  created_at: string;
  image?: string;
}

interface Stats {
  total?: number;
  members?: number;
  forms?: number;
}

interface Counts {
  active?: number;
  draft?: number;
  archived?: number;
}

interface CommunitiesPageProps {
  stats?: Stats;
  counts?: Counts;
}

// Clave para el LocalStorage
const COMMUNITIES_STORAGE_KEY = 'communities_cache';
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutos en milisegundos

export default function CommunitiesPage({ stats, counts }: CommunitiesPageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para guardar en LocalStorage
  const saveToLocalStorage = (data: Community[]) => {
    const cacheData = {
      data,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(COMMUNITIES_STORAGE_KEY, JSON.stringify(cacheData));
  };

  // Función para cargar desde LocalStorage
  const loadFromLocalStorage = (): Community[] | null => {
    const cachedData = localStorage.getItem(COMMUNITIES_STORAGE_KEY);
    if (!cachedData) return null;
    
    try {
      const parsedData = JSON.parse(cachedData);
      // Verificar si la caché está expirada
      const isExpired = new Date().getTime() - parsedData.timestamp > CACHE_EXPIRATION_TIME;
      return isExpired ? null : parsedData.data;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        
        // Primero intentar cargar desde caché
        const cachedCommunities = loadFromLocalStorage();
        if (cachedCommunities) {
          setCommunities(cachedCommunities);
          setLoading(false);
        }
        
        // Luego hacer la petición a la API de todas formas
        const response = await fetch('http://127.0.0.1:8000/community/get-communities/');
        if (!response.ok) {
          throw new Error('Error al obtener las comunidades');
        }
        const data = await response.json();
        
        // Actualizar el estado y el LocalStorage
        setCommunities(data);
        saveToLocalStorage(data);
        
        // Actualizar estadísticas si no vienen por props
        if (!stats) {
          // Aquí podrías actualizar otros stats según necesites
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // Función para obtener el color basado en el índice
  const getColorByIndex = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-pink-100 text-pink-800'
    ];
    return colors[index % colors.length];
  };

  // Función para obtener el icono basado en el índice
  const getIconByIndex = (index: number) => {
    const icons = [Users, BarChart3, Calendar, Link2, Plus];
    return icons[index % icons.length];
  };

  // Función para calcular "Última actividad"
  const getLastActivity = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays} días`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
    return `${Math.floor(diffDays / 30)} meses`;
  };

  // Función para forzar la actualización de los datos
  const refreshData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/community/get-communities/');
      if (!response.ok) {
        throw new Error('Error al actualizar las comunidades');
      }
      const data = await response.json();
      setCommunities(data);
      saveToLocalStorage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  if (loading && communities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>Cargando comunidades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
        <Button onClick={refreshData} className="ml-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brain de Comunidades</h1>
          <p className="text-muted-foreground">Crea y gestiona comunidades segmentadas para tu negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button asChild>
            <Link to="/communities/create">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Comunidad
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Total Comunidades</CardTitle>
            <CardDescription>Comunidades activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total ?? communities.length}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Total Miembros</CardTitle>
            <CardDescription>Miembros registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.members ?? communities.reduce((sum, community) => sum + community.members, 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Formularios Completados</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.forms ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Buscar comunidades..." className="pl-8" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Activas <Badge className="ml-2 bg-green-100 text-green-800">{counts?.active ?? communities.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="draft">
            Borradores <Badge variant="outline" className="ml-2">{counts?.draft ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archivadas <Badge variant="outline" className="ml-2">{counts?.archived ?? 0}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {communities.map((community, i) => {
              const IconComponent = getIconByIndex(i);
              const colorClass = getColorByIndex(i);
              const lastActivity = getLastActivity(community.created_at);
              
              return (
                <Card key={community.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">{lastActivity}</Badge>
                    </div>
                    <CardTitle className="mt-2">{community.title}</CardTitle>
                    <CardDescription>{community.description}</CardDescription>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>{community.members} miembros</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>1 URL activa</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>0 formularios</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>0 campañas</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/communities/${community.id}`}>
                        Gestionar
                        <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="mt-4">
          <div className="border rounded-md p-8 text-center">
            <p className="text-muted-foreground">Seleccione "Borradores" para ver las comunidades en desarrollo</p>
          </div>
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <div className="border rounded-md p-8 text-center">
            <p className="text-muted-foreground">Seleccione "Archivadas" para ver las comunidades inactivas</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}