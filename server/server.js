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

const users = {};

io.on("connection", (socket) => {

  socket.on("join", ({ userId, nickname }) => {

    const nicknameTaken = Object.values(users).some(
      u => u.nickname === nickname && u.socketId
    );

    if (nicknameTaken) {
      socket.emit("nickname_taken");
      return;
    }

    users[userId] = {
      nickname,
      socketId: socket.id
    };

    socket.userId = userId;
    socket.nickname = nickname;

    io.emit("users_update", users);
  });

  socket.on("typing", ({ room, to }) => {
    io.to(room).emit("typing", {
      from: socket.userId
    });
  });

  socket.on("stop_typing", ({ room }) => {
    io.to(room).emit("stop_typing", {
      from: socket.userId
    });
  });

  socket.on("start_dialog", ({ room }) => {
    socket.join(room);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", {
      ...data,
      authorId: socket.userId,
      authorName: socket.nickname
    });
  });

  socket.on("delete_message", ({ room, messageId }) => {
    io.to(room).emit("message_deleted", { room, messageId });
  });

  socket.on("delete_chat", ({ room }) => {
    io.to(room).emit("chat_deleted", { room });
  });

  socket.on("disconnect", () => {
    if (socket.userId && users[socket.userId]) {
      users[socket.userId].socketId = null;
      io.emit("users_update", users);
    }
  });

});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
