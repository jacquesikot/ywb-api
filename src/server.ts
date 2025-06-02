import Logger from './core/Logger';
import { port } from './config';
import app from './app';
import initScheduler from './scheduler';
import { createServer } from 'http';
import SocketService from './socket';

// Initialize the scheduler for periodic tasks
initScheduler();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const socketService = new SocketService(server);

// Make socketService available globally
(global as any).socketService = socketService;

server
  .listen(port, () => {
    Logger.info(`server running on port : ${port}`);
  })
  .on('error', (e: any) => Logger.error(e));
