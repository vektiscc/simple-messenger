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

io.on("connection", (socket) => {

  socket.on("register", (nickname) => {
    users[nickname] = socket.id;
    socket.nickname = nickname;
  });

  socket.on("start_chat", (targetNick) => {
    const targetId = users[targetNick];
    if (!targetId) {
      socket.emit("user_not_found");
      return;
    }

    const roomId = [socket.nickname, targetNick].sort().join("_");

    socket.join(roomId);
    io.sockets.sockets.get(targetId)?.join(roomId);

    io.to(roomId).emit("chat_started", roomId);
  });

  socket.on("send_message", ({ room, message }) => {
    io.to(room).emit("receive_message", {
      author: socket.nickname,
      message
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.nickname];
  });

});

server.listen(3001, () => {
  console.log("Server running");
});