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

let notificationsSocket: Socket | null = null;

// اتصال منفصل بمساحة اسم الإشعارات — يبث فوراً أي إشعار جديد (تغيّر حالة
// طلب/حجز) للمستهلك المتصل حالياً
export async function getNotificationsSocket(): Promise<Socket> {
  if (notificationsSocket && notificationsSocket.connected) return notificationsSocket;
  const token = await getToken();
  if (notificationsSocket) notificationsSocket.disconnect();
  notificationsSocket = io(`${API_ORIGIN}/notifications`, {
    auth: { token },
    transports: ['websocket'],
  });
  return notificationsSocket;
}

export function disconnectNotificationsSocket() {
  notificationsSocket?.disconnect();
  notificationsSocket = null;
}
