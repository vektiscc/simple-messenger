const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const users = {}; // userId -> { nickname, socketId }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", ({ userId, nickname }) => {
    users[userId] = {
      nickname,
      socketId: socket.id
    };

    io.emit("users_update", users);
  });

  socket.on("create_dialog", ({ fromUserId, toUserId, fromNickname }) => {
    if (users[toUserId]) {
      io.to(users[toUserId].socketId).emit("dialog_created", {
        userId: fromUserId,
        nickname: fromNickname
      });
    }
  });

  socket.on("send_message", ({ fromUserId, toUserId, message, time }) => {
    if (users[toUserId]) {
      io.to(users[toUserId].socketId).emit("receive_message", {
        fromUserId,
        message,
        time
      });
    }
  });

  socket.on("disconnect", () => {
    for (const id in users) {
      if (users[id].socketId === socket.id) {
        delete users[id];
      }
    }
    io.emit("users_update", users);
  });
});

socket.on("typing", ({ toUserId }) => {
  if (users[toUserId]) {
    io.to(users[toUserId].socketId).emit("typing", {
      fromUserId: socket.id
    });
  }
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});

