import { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuthStore } from "@/zustand";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: object;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

const serverApiUrl = import.meta.env.DEV ? "http://localhost:4000" : "/";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { userInfo } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (userInfo) {
      const socket = io(serverApiUrl, {
        withCredentials: true,
        query: { userId: userInfo._id }
      });

      setSocket(socket);

      socket.on("connect", () => { });

      socket.on("users:online", (users) => {
        setOnlineUsers({ ...users });
      });

      return () => {
        socket?.close();
      }
    } else {
      socket?.close();
      setSocket(null);
    }
  }, [userInfo]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export { useSocket, SocketProvider };
