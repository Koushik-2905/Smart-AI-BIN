import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [detection, setDetection] = useState(null);
  const [binStatus, setBinStatus] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const newSocket = io(serverUrl);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('detectionUpdate', (data) => {
      console.log('Detection update:', data);
      setDetection(data);
    });

    newSocket.on('binStatus', (data) => {
      console.log('Bin status update:', data);
      setBinStatus(data);
    });

    newSocket.on('systemStatus', (data) => {
      console.log('System status:', data);
      setSystemStatus(data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const value = {
    socket,
    connected,
    detection,
    binStatus,
    systemStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
