import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, getToken } from './api';

let socket: Socket | null = null;

// اتصال واحد يُعاد استخدامه طوال عمر الجلسة، بمصادقة JWT عبر handshake.auth
export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) return socket;
  const token = await getToken();
  if (socket) {
    socket.disconnect();
  }
  socket = io(`${API_ORIGIN}/chat`, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
