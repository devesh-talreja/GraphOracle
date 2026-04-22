import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_URL } from '../utils/constants';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000];

export function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const [status, setStatus] = useState('disconnected'); // connecting | connected | disconnected | error
  const listenersRef = useRef({});

  const on = useCallback((event, handler) => {
    listenersRef.current[event] = handler;
  }, []);

  const emit = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus('connecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setStatus('connected');
      reconnectCountRef.current = 0;
      // Start heartbeat
      const hb = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        } else {
          clearInterval(hb);
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handler = listenersRef.current[msg.type];
        if (handler) handler(msg);
        const wildcardHandler = listenersRef.current['*'];
        if (wildcardHandler) wildcardHandler(msg);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setStatus('disconnected');
      // Exponential backoff reconnect
      const delay = RECONNECT_DELAYS[Math.min(reconnectCountRef.current, RECONNECT_DELAYS.length - 1)];
      reconnectCountRef.current++;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = (e) => {
      console.error('[WS] Error:', e);
      setStatus('error');
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, on, emit };
}
