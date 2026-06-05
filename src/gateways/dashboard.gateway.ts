import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'dashboard',
  cors: { origin: '*' },
})
export class DashboardGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() payload: { eventId?: string } | string,
    @ConnectedSocket() client: Socket,
  ) {
    const eventId = typeof payload === 'string' ? payload : payload?.eventId;
    if (!eventId) {
      return { joined: false, message: 'eventId is required' };
    }
    client.join(`event:${eventId}`);
    return { joined: true, room: `event:${eventId}` };
  }

  broadcastStats(eventId: string, stats: Record<string, unknown>) {
    this.server.to(`event:${eventId}`).emit('stats_updated', stats);
  }

  broadcastCheckIn(eventId: string, checkInData: Record<string, unknown>) {
    this.server.to(`event:${eventId}`).emit('check_in', checkInData);
  }
}
