import { io } from "..";

export default function todoUpdatedEmitter({
  userId,
  socketId,
}: {
  userId: number | undefined;
  socketId: any;
}) {
  if (userId && socketId) {
    io.to("user_" + userId)
      .except(socketId)
      .emit(
        "TodoUpdated",
        "From the server, something changed!" + " " + userId
      );
  }
}
