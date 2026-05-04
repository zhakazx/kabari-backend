import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: 'dashboard',
  cors: { origin: '*' },
})
export class DashboardGateway {
  @WebSocketServer()
  server: Server;

  broadcastStats(eventId: string, stats: Record<string, unknown>) {
    this.server.to(`event:${eventId}`).emit('stats_updated', stats);
  }

  broadcastCheckIn(eventId: string, checkInData: Record<string, unknown>) {
    this.server.to(`event:${eventId}`).emit('check_in', checkInData);
  }
}
