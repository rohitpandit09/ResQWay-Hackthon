const Call = require("../models/Call");

const createCall = async (clientId, driverId) => {
  console.log("🟡 Creating call in MongoDB...");
  console.log("clientId:", clientId);
  console.log("driverId:", driverId);

  try {
    const call = await Call.create({
      clientId,
      driverId,
      status: "RINGING",
    });

    console.log("🟢 Call saved:", call._id.toString());

    return call;
  } catch (error) {
    console.error("🔴 Failed to save call:");
    console.error(error);
    throw error;
  }
};

const acceptCall = async (callId, driverId) => {
  return await Call.findOneAndUpdate(
    {
      _id: callId,
      driverId,
      status: "RINGING",
    },
    {
      $set: {
        status: "ACCEPTED",
        startedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );
};

const rejectCall = async (callId, driverId) => {
  return await Call.findOneAndUpdate(
    {
      _id: callId,
      driverId,
      status: "RINGING",
    },
    {
      $set: {
        status: "REJECTED",
        endedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );
};

const timeoutCall = async (callId) => {
  return await Call.findOneAndUpdate(
    {
      _id: callId,
      status: "RINGING",
    },
    {
      $set: {
        status: "MISSED",
        endedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );
};

const connectCall = async (callId) => {
  return await Call.findOneAndUpdate(
    {
      _id: callId,
      status: "ACCEPTED",
    },
    {
      $set: {
        status: "CONNECTED",
        connectedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );
};

const endCall = async (callId) => {
  return await Call.findOneAndUpdate(
    {
      _id: callId,
      status: {
        $in: ["ACCEPTED", "CONNECTED"],
      },
    },
    {
      $set: {
        status: "ENDED",
        endedAt: new Date(),
      },
    },
    {
      new: true,
    }
  );
};

module.exports = {
  createCall,
  acceptCall,
  rejectCall,
  timeoutCall,
  connectCall,
  endCall,
};