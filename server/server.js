const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let users = {};

function broadcastUsers() {
  io.emit("online_users", Object.keys(users));
}

io.on("connection", (socket) => {

  socket.on("register", (nickname) => {
    if (users[nickname]) {
      socket.emit("nickname_taken");
      return;
    }

    users[nickname] = { socketId: socket.id };
    socket.nickname = nickname;

    socket.emit("register_success");
    broadcastUsers();
  });

  socket.on("start_chat", (targetNick) => {
    const target = users[targetNick];
    if (!target) {
      socket.emit("user_not_found");
      return;
    }

    const roomId = [socket.nickname, targetNick].sort().join("_");

    socket.join(roomId);
    io.sockets.sockets.get(target.socketId)?.join(roomId);

    io.to(roomId).emit("chat_started", {
      room: roomId,
      users: [socket.nickname, targetNick]
    });
  });

  socket.on("send_message", ({ room, message, time }) => {
io.to(room).emit("receive_message", {
  room,
  author: socket.nickname,
  message,
  time
});
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      delete users[socket.nickname];
      broadcastUsers();
    }
  });

});

server.listen(3001, () => {
  console.log("Server running");
});

