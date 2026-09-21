const Emergency = require("../models/Emergency");
const Call = require("../models/Call");

const {
  ambulanceId,
  ambulanceStartPoint,
  userPoint,
  hospitalPoint,
} = require("../config/simulation");

const createEmergencyFromCall = async (callId) => {
  // Get call
  const call = await Call.findById(callId);

  if (!call) {
    throw new Error("Call not found");
  }

  // AI must verify emergency
  if (!call.emergencyDetected) {
    throw new Error(
      "Emergency was not verified by AI"
    );
  }

  // Prevent duplicate emergency
  const existingEmergency =
    await Emergency.findOne({ callId });

  if (existingEmergency) {
    return existingEmergency;
  }

  const emergency =
    await Emergency.create({
      callId: call._id,

      clientId: call.clientId,

      driverId: call.driverId,

      ambulanceId,

      status: "ACTIVE",

      simulation: {
        userPoint,
        hospitalPoint,
        ambulanceStartPoint,
      },

      startedAt: new Date(),
    });

  return emergency;
};

const updateEmergencyStatus = async (
  emergencyId,
  status
) => {
  const emergency =
    await Emergency.findById(emergencyId);

  if (!emergency) {
    throw new Error("Emergency not found");
  }

  emergency.status = status;

  if (
    status === "COMPLETED" ||
    status === "CANCELLED"
  ) {
    emergency.completedAt = new Date();
  }

  await emergency.save();

  return emergency;
};

module.exports = {
  createEmergencyFromCall,
  updateEmergencyStatus,
};