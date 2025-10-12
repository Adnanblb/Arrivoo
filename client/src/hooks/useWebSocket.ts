import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  type: string;
  payload?: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

/**
 * Custom WebSocket hook with automatic reconnection.
 * 
 * IMPORTANT: Callbacks are stored in a ref to prevent infinite reconnection loops.
 * The hook creates a stable WebSocket connection that persists across component renders.
 * 
 * Usage Notes:
 * - Callbacks (onMessage, onOpen, etc.) can change between renders without triggering reconnection
 * - The hook automatically reconnects after 3 seconds if connection is lost
 * - Use the `isConnected` state to determine if the socket is ready to send messages
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Store callbacks in refs to avoid recreating connect function
  // This prevents infinite reconnection loops when callbacks change on every render
  const optionsRef = useRef(options);
  
  // Update ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      optionsRef.current.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        optionsRef.current.onMessage?.(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      optionsRef.current.onClose?.();

      // Attempt to reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        connect();
      }, 3000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      optionsRef.current.onError?.(error);
    };

    ws.current = socket;
  }, []); // No dependencies - callbacks accessed via ref

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    ws.current?.close();
    ws.current = null;
    setIsConnected(false);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    send,
    connect,
    disconnect,
  };
}
