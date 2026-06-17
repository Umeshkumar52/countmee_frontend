import { useEffect } from 'react';
import { useSocketInstance } from '../socket/socketContext';

export const useSocket = (event, callback) => {
  const socket = useSocketInstance();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);

  const emit = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  };

  return { emit, isConnected: !!socket };
};
export default useSocket;
