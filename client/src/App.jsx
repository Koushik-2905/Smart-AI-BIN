import React from 'react';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}

export default App;
