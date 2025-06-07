import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Types } from 'mongoose';
import JWT from '../core/JWT';
import { AuthFailureError } from '../core/ApiError';
import UserRepo from '../database/repository/UserRepo';
import Logger from '../core/Logger';

interface SocketUser {
  userId: Types.ObjectId;
  socketId: string;
}

class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new AuthFailureError('Authentication token missing');
        }

        const payload = await JWT.validate(token);
        const user = await UserRepo.findById(new Types.ObjectId(payload.sub));
        if (!user) {
          throw new AuthFailureError('User not found');
        }

        // Attach user to socket
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      Logger.info(`User connected: ${user._id}`);

      // Store user connection
      this.connectedUsers.set(user._id.toString(), {
        userId: user._id,
        socketId: socket.id,
      });

      // Handle chat messages
      socket.on('send_message', async (data) => {
        const { chatId, content } = data;
        // Emit to all users in the chat
        this.io.to(chatId).emit('new_message', {
          chatId,
          content,
          sender: user._id,
          timestamp: new Date(),
        });
      });

      // Handle joining chat rooms
      socket.on('join_chat', (chatId: string) => {
        socket.join(chatId);
        Logger.info(`User ${user._id} joined chat ${chatId}`);
      });

      // Handle leaving chat rooms
      socket.on('leave_chat', (chatId: string) => {
        socket.leave(chatId);
        Logger.info(`User ${user._id} left chat ${chatId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.connectedUsers.delete(user._id.toString());
        Logger.info(`User disconnected: ${user._id}`);
      });
    });
  }

  // Method to emit events to specific users
  public emitToUser(userId: string, event: string, data: any) {
    const user = this.connectedUsers.get(userId);
    if (user) {
      this.io.to(user.socketId).emit(event, data);
    }
  }

  // Method to emit events to all users in a chat
  public emitToChat(chatId: string, event: string, data: any) {
    this.io.to(chatId).emit(event, data);
  }
}

export default SocketService;
