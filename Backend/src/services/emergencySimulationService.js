const Emergency = require("../models/Emergency");

const liveEmergencyState = new Map();

/**
 * Stores the latest live simulation state in memory.
 *
 * Key:
 * emergencyId
 *
 * Value:
 * {
 *   ambulanceId,
 *   position,
 *   speed,
 *   heading,
 *   currentEdge,
 *   currentLane,
 *   routeIndex,
 *   simulationTime,
 *   updatedAt
 * }
 */

async function updateEmergencyFromSimulation(
  io,
  simulationState
) {
  const ambulance =
    simulationState?.ambulance;

  if (!ambulance?.available) {
    return;
  }

  const ambulanceId =
    ambulance.vehicleId;

  if (!ambulanceId) {
    return;
  }

  // Find the active emergency for this simulated ambulance
  const emergency =
    await Emergency.findOne({
      ambulanceId,
      status: {
        $in: [
          "ACTIVE",
          "EN_ROUTE_TO_USER",
          "USER_PICKED_UP",
          "EN_ROUTE_TO_HOSPITAL",
        ],
      },
    });

  if (!emergency) {
    // No active emergency currently owns this ambulance
    return;
  }

  const emergencyId =
    emergency._id.toString();

  const currentState = {
    ambulanceId,

    position: ambulance.position,

    speed: ambulance.speed,

    heading: ambulance.heading,

    currentEdge:
      ambulance.currentEdge,

    currentLane:
      ambulance.currentLane,

    routeIndex:
      ambulance.routeIndex,

    simulationTime:
      ambulance.simulationTime,

    updatedAt: new Date(),

  };

  const etaToUser =
    simulationState?.eta?.toUserSeconds ?? null;

    const signalData =
    simulationState?.signals || [];

    emergency.distanceToUser =
    ambulance.distanceToUser ?? null;

    emergency.etaToUser =
    etaToUser;

    emergency.signalData =
    signalData;

  // Fast live state
  liveEmergencyState.set(
    emergencyId,
    currentState
  );

  /*
   * Keep latest state in MongoDB too.
   *
   * We are NOT creating a new MongoDB document
   * for every update.
   *
   * We simply update the currentAmbulanceState
   * inside the existing emergency document.
   */
  emergency.currentAmbulanceState = {
    latitude: null,
    longitude: null,

    speed: ambulance.speed,

    heading: ambulance.heading,

    currentEdge:
      ambulance.currentEdge,

    simulationTime:
      ambulance.simulationTime,

    updatedAt: new Date(),
  };

  await emergency.save();

  /*
   * Send only to clients associated with this emergency.
   *
   * We will use:
   *
   * emergency:<emergencyId>
   */
  io.to(`emergency:${emergencyId}`)
    .emit(
      "emergency:ambulance-update",
      {
        emergencyId,

        ambulance: currentState,

        emergencyStatus:
          emergency.status,
      }
    );

    io.to(`emergency:${emergencyId}`).emit(
        "emergency:eta-update",
        {
            emergencyId,

            etaToUser,

            signals: signalData,
        }
    );

  return {
    emergencyId,
    ambulance: currentState,
  };
}

function getLiveEmergencyState(
  emergencyId
) {
  return liveEmergencyState.get(
    String(emergencyId)
  ) || null;
}

function removeLiveEmergencyState(
  emergencyId
) {
  liveEmergencyState.delete(
    String(emergencyId)
  );
}

module.exports = {
  updateEmergencyFromSimulation,
  getLiveEmergencyState,
  removeLiveEmergencyState,
};