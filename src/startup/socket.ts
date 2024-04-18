import { Server } from "socket.io";
import { Server as IServer } from "http";
import Config from "config";

export default function makeSocket(server: IServer) {
  const io = new Server(server, { cors: { origin: Config.get("origin") } });

  io.on("connection", (socket) => {
    socket.on("auth", (userId) => {
      socket.join("user_" + userId);
    });
  });

  return io;
}
