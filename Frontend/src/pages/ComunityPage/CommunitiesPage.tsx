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

// Puedes obtener los datos vía props, context o llamada fetch
// Ejemplo:
// const { stats, counts, active } = useYourDataFetchingHook()

interface Community {
  id?: string | number;
  name: string;
  color: string;
  icon: React.ElementType;
  lastActivity: string;
  members: number;
  forms: number;
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
  active?: Community[];
}

export default function CommunitiesPage({ stats, counts, active }: CommunitiesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brain de Comunidades</h1>
          <p className="text-muted-foreground">Crea y gestiona comunidades segmentadas para tu negocio</p>
        </div>
        <Button asChild>
          <Link to="/communities/create">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Comunidad
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Total Comunidades</CardTitle>
            <CardDescription>Comunidades activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Total Miembros</CardTitle>
            <CardDescription>Miembros registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.members?.toLocaleString?.() ?? 0}</div>
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
            Activas <Badge className="ml-2 bg-green-100 text-green-800">{counts?.active ?? 0}</Badge>
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
            {(active ?? []).map((community, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${community.color}`}>
                      <community.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">{community.lastActivity}</Badge>
                  </div>
                  <CardTitle className="mt-2">{community.name}</CardTitle>
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
                      <span>{community.forms} formularios</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>2 campañas</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/communities/${community.id ?? i}`}>
                      Gestionar
                      <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
  )
}
