const {
  createCall,
  acceptCall,
  rejectCall,
  timeoutCall,
  connectCall,
  endCall,
} = require("../services/callService");

// =====================================================
// Temporary in-memory socket mapping
// MongoDB stores the actual call.
// Map is ONLY used to route Socket.IO messages.
// =====================================================

const clientSockets = new Map();
const driverSockets = new Map();

const activeCalls = new Map();
const callTimers = new Map();

function registerCallSocket(io, socket) {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // =====================================================
  // CLIENT REGISTER
  // =====================================================

  socket.on("call:register-client", ({ userId }) => {
    if (!userId) {
      return socket.emit("call:error", {
        message: "userId is required",
      });
    }

    socket.userId = userId;
    socket.role = "CLIENT";

    clientSockets.set(String(userId), socket.id);

    console.log(`👤 Client registered: ${userId}`);
  });

  // =====================================================
  // DRIVER REGISTER
  // =====================================================

  socket.on("call:register-driver", ({ driverId }) => {
    if (!driverId) {
      return socket.emit("call:error", {
        message: "driverId is required",
      });
    }

    socket.driverId = driverId;
    socket.role = "DRIVER";

    driverSockets.set(String(driverId), socket.id);

    console.log(`🚑 Driver registered: ${driverId}`);
  });

  // =====================================================
  // CLIENT REQUESTS CALL
  // =====================================================

  socket.on("call:request", async () => {
    try {
      // Do NOT trust clientId from payload.
      // Use the authenticated socket identity.
      const clientId = socket.userId;

      if (!clientId) {
        return socket.emit("call:error", {
          message: "Client is not registered",
        });
      }

      // Simulation MVP:
      // Only one driver is needed.
      const availableDriver = [...driverSockets.entries()][0];

      if (!availableDriver) {
        return socket.emit("call:no-driver", {
          message: "No ambulance driver is online",
        });
      }

      const [driverId, driverSocketId] = availableDriver;

      // ==========================
      // CREATE REAL MONGODB CALL
      // ==========================

      const call = await createCall(
        clientId,
        driverId
      );

      const callId = call._id.toString();

      // Store socket-routing information
      activeCalls.set(callId, {
        callId,
        clientSocketId: socket.id,
        driverSocketId,
        clientId: String(clientId),
        driverId: String(driverId),
        status: "RINGING",
      });

      console.log(`📞 New call: ${callId}`);

      // Tell client
      socket.emit("call:created", {
        callId,
        status: "RINGING",
      });

      // Tell driver
      io.to(driverSocketId).emit(
        "call:incoming",
        {
          callId,
          clientId,
          status: "RINGING",
          responseTime: 15,
        }
      );

      // ==========================
      // 15 SECOND TIMER
      // ==========================

      const timer = setTimeout(async () => {
        try {
          const missedCall = await timeoutCall(callId);

          if (!missedCall) {
            return;
          }

          const activeCall = activeCalls.get(callId);

          if (!activeCall) {
            return;
          }

          console.log(
            `⏱️ Call timed out: ${callId}`
          );

          // Notify client
          io.to(activeCall.clientSocketId).emit(
            "call:timeout",
            {
              callId,
            }
          );

          // Notify driver
          io.to(activeCall.driverSocketId).emit(
            "call:timeout",
            {
              callId,
            }
          );

          activeCalls.delete(callId);
          callTimers.delete(callId);
        } catch (error) {
          console.error(
            "❌ Timeout error:",
            error
          );
        }
      }, 15000);

      callTimers.set(callId, timer);
    } catch (error) {
      console.error(
        "❌ Call request error:",
        error
      );

      socket.emit("call:error", {
        message: "Failed to create call",
      });
    }
  });

  // =====================================================
  // DRIVER ACCEPTS
  // =====================================================

  socket.on(
    "call:accept",
    async ({ callId }) => {
      try {
        const activeCall = activeCalls.get(callId);

        if (!activeCall) {
          return socket.emit("call:error", {
            message: "Call not found",
          });
        }

        // Make sure THIS socket is the assigned driver
        if (
          activeCall.driverSocketId !== socket.id
        ) {
          return socket.emit("call:error", {
            message:
              "You are not assigned to this call",
          });
        }

        // Stop timer
        const timer = callTimers.get(callId);

        if (timer) {
          clearTimeout(timer);
          callTimers.delete(callId);
        }

        // Update MongoDB
        const call = await acceptCall(
          callId,
          activeCall.driverId
        );

        if (!call) {
          return socket.emit("call:error", {
            message:
              "Call already expired or accepted",
          });
        }

        activeCall.status = "ACCEPTED";
        activeCalls.set(callId, activeCall);

        console.log(
          `✅ Call accepted: ${callId}`
        );

        // Driver
        socket.emit("call:accepted", {
          callId,
        });

        // Client
        io.to(activeCall.clientSocketId).emit(
          "call:accepted",
          {
            callId,
          }
        );
      } catch (error) {
        console.error(
          "❌ Accept error:",
          error
        );

        socket.emit("call:error", {
          message: "Failed to accept call",
        });
      }
    }
  );

  // =====================================================
  // DRIVER REJECTS
  // =====================================================

  socket.on(
    "call:reject",
    async ({ callId }) => {
      try {
        const activeCall = activeCalls.get(callId);

        if (!activeCall) {
          return socket.emit("call:error", {
            message: "Call not found",
          });
        }

        if (
          activeCall.driverSocketId !== socket.id
        ) {
          return socket.emit("call:error", {
            message: "Unauthorized driver",
          });
        }

        const timer = callTimers.get(callId);

        if (timer) {
          clearTimeout(timer);
          callTimers.delete(callId);
        }

        const call = await rejectCall(
          callId,
          activeCall.driverId
        );

        if (!call) {
          return socket.emit("call:error", {
            message:
              "Call already expired or handled",
          });
        }

        console.log(
          `❌ Call rejected: ${callId}`
        );

        io.to(activeCall.clientSocketId).emit(
          "call:rejected",
          {
            callId,
          }
        );

        socket.emit("call:rejected", {
          callId,
        });

        activeCalls.delete(callId);
      } catch (error) {
        console.error(
          "❌ Reject error:",
          error
        );
      }
    }
  );

  // =====================================================
  // WEBRTC OFFER
  // =====================================================

  socket.on(
    "webrtc:offer",
    ({ callId, offer }) => {
      const activeCall = activeCalls.get(callId);

      if (!activeCall || !offer) {
        return;
      }

      const targetSocketId =
        socket.id === activeCall.clientSocketId
          ? activeCall.driverSocketId
          : activeCall.clientSocketId;

      io.to(targetSocketId).emit(
        "webrtc:offer",
        {
          callId,
          offer,
        }
      );
    }
  );

  // =====================================================
  // WEBRTC ANSWER
  // =====================================================

  socket.on(
    "webrtc:answer",
    ({ callId, answer }) => {
      const activeCall = activeCalls.get(callId);

      if (!activeCall || !answer) {
        return;
      }

      const targetSocketId =
        socket.id === activeCall.clientSocketId
          ? activeCall.driverSocketId
          : activeCall.clientSocketId;

      io.to(targetSocketId).emit(
        "webrtc:answer",
        {
          callId,
          answer,
        }
      );
    }
  );

  // =====================================================
  // ICE CANDIDATE
  // =====================================================

  socket.on(
    "webrtc:ice-candidate",
    ({ callId, candidate }) => {
      const activeCall = activeCalls.get(callId);

      if (!activeCall || !candidate) {
        return;
      }

      const targetSocketId =
        socket.id === activeCall.clientSocketId
          ? activeCall.driverSocketId
          : activeCall.clientSocketId;

      io.to(targetSocketId).emit(
        "webrtc:ice-candidate",
        {
          callId,
          candidate,
        }
      );
    }
  );

  // =====================================================
  // CALL CONNECTED
  // =====================================================

  socket.on(
    "call:connected",
    async ({ callId }) => {
      try {
        const activeCall = activeCalls.get(callId);

        if (!activeCall) {
          return;
        }

        const call = await connectCall(callId);

        if (!call) {
          return;
        }

        activeCall.status = "CONNECTED";
        activeCalls.set(callId, activeCall);

        console.log(
          `🎙️ Call connected: ${callId}`
        );

        io.to(activeCall.clientSocketId).emit(
          "call:connected",
          {
            callId,
          }
        );

        io.to(activeCall.driverSocketId).emit(
          "call:connected",
          {
            callId,
          }
        );
      } catch (error) {
        console.error(
          "❌ Connect call error:",
          error
        );
      }
    }
  );

  // =====================================================
  // END CALL
  // =====================================================

  socket.on(
    "call:end",
    async ({ callId }) => {
      try {
        const activeCall = activeCalls.get(callId);

        if (!activeCall) {
          return;
        }

        const timer = callTimers.get(callId);

        if (timer) {
          clearTimeout(timer);
          callTimers.delete(callId);
        }

        const call = await endCall(callId);

        if (!call) {
          return;
        }

        console.log(
          `📴 Call ended: ${callId}`
        );

        io.to(activeCall.clientSocketId).emit(
          "call:ended",
          {
            callId,
          }
        );

        io.to(activeCall.driverSocketId).emit(
          "call:ended",
          {
            callId,
          }
        );

        activeCalls.delete(callId);
      } catch (error) {
        console.error(
          "❌ End call error:",
          error
        );
      }
    }
  );

  // =====================================================
  // DISCONNECT
  // =====================================================

  socket.on("disconnect", () => {
    console.log(
      `🔌 Socket disconnected: ${socket.id}`
    );

    if (socket.userId) {
      clientSockets.delete(
        String(socket.userId)
      );
    }

    if (socket.driverId) {
      driverSockets.delete(
        String(socket.driverId)
      );
    }

    for (const [
      callId,
      activeCall,
    ] of activeCalls.entries()) {
      if (
        activeCall.clientSocketId === socket.id ||
        activeCall.driverSocketId === socket.id
      ) {
        const timer = callTimers.get(callId);

        if (timer) {
          clearTimeout(timer);
          callTimers.delete(callId);
        }

        const otherSocketId =
          activeCall.clientSocketId === socket.id
            ? activeCall.driverSocketId
            : activeCall.clientSocketId;

        io.to(otherSocketId).emit(
          "call:ended",
          {
            callId,
            reason: "peer_disconnected",
          }
        );

        activeCalls.delete(callId);

        console.log(
          `📴 Call cleaned up: ${callId}`
        );
      }
    }
  });
}

module.exports = {
  registerCallSocket,
};