const { io } = require("socket.io-client");
const socket = io("http://localhost:3001");

socket.on("connect", () => {
  console.log("Connected to server, triggering resetGame...");
  socket.emit("resetGame");
  setTimeout(() => {
    socket.disconnect();
    process.exit(0);
  }, 1000);
});
