'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/app');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.socket.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      socket.userId = decoded.userId;
      socket.tenantId = decoded.tenantId;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: user=${socket.userId}, tenant=${socket.tenantId}`);

    
    socket.join(`tenant:${socket.tenantId}`);
    
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: user=${socket.userId}, reason=${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToTenant = (tenantId, event, data) => {
  if (io) {
    io.to(`tenant:${tenantId}`).emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToTenant };
