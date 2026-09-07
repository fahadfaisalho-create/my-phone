import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, getToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const token = getToken();
  if (socket) socket.disconnect();
  socket = io(`${API_ORIGIN}/chat`, { auth: { token }, transports: ['websocket'] });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

let notificationsSocket: Socket | null = null;

// اتصال منفصل بمساحة اسم الإشعارات (namespace مختلف عن الشات) — يبث فوراً
// أي إشعار جديد (طلب/حجز جديد أو تغيّر حالته) للمستخدم المتصل حالياً
export function getNotificationsSocket(): Socket {
  if (notificationsSocket && notificationsSocket.connected) return notificationsSocket;
  const token = getToken();
  if (notificationsSocket) notificationsSocket.disconnect();
  notificationsSocket = io(`${API_ORIGIN}/notifications`, { auth: { token }, transports: ['websocket'] });
  return notificationsSocket;
}

export function disconnectNotificationsSocket() {
  notificationsSocket?.disconnect();
  notificationsSocket = null;
}
