const express = require("express");
const app = express();

let broadcaster;
const port = 3000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server,{
  cors: {
    origin: "*"
  }
});
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
  socket.on("broadcaster", (user) => {
    socket.join(user)
    socket.broadcast.emit("broadcaster");
  });
  socket.on("watcher", (user) => {
    socket.to(user).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", (user) => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
});
server.listen(port, () => console.log(`Server is running on port ${port}`));
