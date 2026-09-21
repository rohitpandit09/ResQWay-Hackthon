const { io } = require("socket.io-client");

const SOCKET_URL = "http://localhost:5000";

const CLIENT_ID = "6ab1399c6fc94ea6551bc5a5";
const DRIVER_ID = "6ab13a056fc94ea6551bc5a6";

// =====================================================
// DRIVER
// =====================================================

const driver = io(SOCKET_URL);

driver.on("connect", () => {
  console.log("🚑 Driver connected");

  driver.emit("call:register-driver", {
    driverId: DRIVER_ID,
  });
});

driver.on("call:incoming", (data) => {
  console.log("\n📞 Driver received call:");
  console.log(data);

  setTimeout(() => {
    console.log("\n✅ Driver accepting call");

    driver.emit("call:accept", {
      callId: data.callId,
    });
  }, 2000);
});

driver.on("call:accepted", (data) => {
  console.log("\n✅ Driver call accepted:");
  console.log(data);
});

driver.on("call:timeout", (data) => {
  console.log("\n⏱️ Driver call timeout:");
  console.log(data);
});

driver.on("call:rejected", (data) => {
  console.log("\n❌ Driver call rejected:");
  console.log(data);
});

driver.on("call:error", (data) => {
  console.log("\n❌ Driver error:");
  console.log(data);
});

// =====================================================
// CLIENT
// =====================================================

const client = io(SOCKET_URL);

client.on("connect", () => {
  console.log("\n👤 Client connected");

  // IMPORTANT: backend expects userId
  client.emit("call:register-client", {
    userId: CLIENT_ID,
  });

  setTimeout(() => {
    console.log("\n📞 Client requesting ambulance");

    // IMPORTANT: no clientId or driverId here
    client.emit("call:request");
  }, 2000);
});

client.on("call:created", (data) => {
  console.log("\n📞 Call created:");
  console.log(data);
});

client.on("call:accepted", (data) => {
  console.log("\n✅ Client received acceptance:");
  console.log(data);
});

client.on("call:rejected", (data) => {
  console.log("\n❌ Client received rejection:");
  console.log(data);
});

client.on("call:timeout", (data) => {
  console.log("\n⏱️ Client received timeout:");
  console.log(data);
});

client.on("call:no-driver", (data) => {
  console.log("\n🚫 No driver:");
  console.log(data);
});

client.on("call:error", (data) => {
  console.log("\n❌ Client error:");
  console.log(data);
});