import { useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url: string, onMessage: (data: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const connect = useCallback(() => {
    // Limpia conexión anterior
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket conectado');
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = (event) => {
      if (event.code !== 1000 && retryCount.current < maxRetries) {
        const delay = Math.min(3000 * (retryCount.current + 1), 10000);
        retryCount.current += 1;
        console.log(`Reconectando en ${delay}ms (intento ${retryCount.current})`);
        setTimeout(connect, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }, [url, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Componente desmontado');
      }
    };
  }, [connect]);

  return wsRef.current;
};

export default useWebSocket;