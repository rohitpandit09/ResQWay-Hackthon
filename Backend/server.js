const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const dns = require("dns");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const locationRoutes = require("./src/routes/locationRoutes");

// Database
const { connectDB } = require("./src/config/db");

// Call Socket
const callSocketModule = require("./src/sockets/callSocket");

// DNS fix for MongoDB Atlas
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const port = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json());

/*
|--------------------------------------------------------------------------
| BASIC ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the ResQWay API",
    status: "ok",
  });
});

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);

/*
|--------------------------------------------------------------------------
| HTTP SERVER
|--------------------------------------------------------------------------
|
| We create an HTTP server manually because Socket.IO needs
| to attach itself to this server.
|
*/

const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  },
});

/*
|--------------------------------------------------------------------------
| CALL SOCKET SETUP
|--------------------------------------------------------------------------
|
| This supports:
|
| Client
|   ↓
| Call request
|   ↓
| Driver
|   ↓
| Accept / Reject
|   ↓
| WebRTC signaling
|
*/

const registerCallSocket =
  callSocketModule.registerCallSocket || callSocketModule;

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  /*
   * Register call-related socket events
   */
  registerCallSocket(io, socket);

  /*
   * General disconnect
   */
  socket.on("disconnect", (reason) => {
    console.log(
      `🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`
    );
  });
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

async function startServer() {
  try {
    /*
     * Connect MongoDB
     */
    await connectDB();

    /*
     * Start HTTP + Socket.IO server
     */
    server.listen(port, () => {
      console.log("======================================");
      console.log("🚑 RESQWAY BACKEND");
      console.log("======================================");
      console.log(`🚀 Server running on port: ${port}`);
      console.log(`🌐 API: http://localhost:${port}`);
      console.log(`🔌 Socket.IO: http://localhost:${port}`);
      console.log("======================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();