import { Button } from "../../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Phone, Instagram, Facebook, Twitter, MessageSquare } from "lucide-react";

interface AlertItemProps {
  alert?: {
    id: string;
    name: string;
    message: string;
    channel: string;
    priority: 'high' | 'medium' | 'low' | string;
    reason: string;
  };
  status: 'pending' | 'in_progress' | 'resolved';
  onUpdateStatus?: (newStatus: 'pending' | 'in_progress' | 'resolved') => void;
}

const channelIcons = {
  whatsapp: <Phone className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  tiktok: <Twitter className="h-4 w-4" />,
  default: <MessageSquare className="h-4 w-4" />
};

const priorityColors = {
  high: "destructive",
  medium: "default",
  low: "secondary"
} as const;

export default function AlertItem({ alert, status, onUpdateStatus }: AlertItemProps) {
  if (!alert) {
    return (
      <Card className="border-none shadow-none">
        <CardContent className="p-4 text-center text-destructive">
          Error: Información de alerta no disponible
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };

  return (
    <Card className="border-none shadow-none mb-4">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials(alert.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{alert.name}</CardTitle>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {channelIcons[alert.channel.toLowerCase() as keyof typeof channelIcons] || channelIcons.default}
            <span className="text-xs text-muted-foreground capitalize">{alert.channel}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-2">
        <div className="space-y-1">
          <p className="text-sm">
            {alert.message}
          </p>
          <Badge 
            variant={priorityColors[alert.priority.toLowerCase() as keyof typeof priorityColors] || "default"}
            className="mt-1 text-xs"
          >
            {alert.reason}
          </Badge>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end px-4 pb-4 pt-2">
        {status === 'pending' && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onUpdateStatus?.('resolved')}
            className="h-8"
          >
            Resolver
          </Button>
        )}
        {status === 'in_progress' && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onUpdateStatus?.('resolved')}
            className="h-8"
          >
            Marcar como Resuelta
          </Button>
        )}
        {status === 'resolved' && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onUpdateStatus?.('pending')}
            className="h-8"
          >
            Reabrir
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}