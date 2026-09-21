const simulationService = require("./simulationService");
const {updateEmergencyFromSimulation,} = require("./emergencySimulationService");
const {calculateETASeconds,buildSignalETA,} = require("./etaService");

let monitorTimer = null;
let monitoring = false;

const MONITOR_INTERVAL =
  Number(process.env.SIMULATION_POLL_INTERVAL_MS) || 500;

    async function pollSimulation(io) {
    try {
        const state =
            await simulationService.getSimulationState();

            const ambulance =
    state?.ambulance;

    if (ambulance?.available) {
    const etaToUser =
        calculateETASeconds(
        ambulance.distanceToUser,
        ambulance.speed,
        ambulance.allowedSpeed
        );

    const signalETAs =
        buildSignalETA(
        state.signals || [],
        ambulance.speed,
        ambulance.allowedSpeed
        );

    state.eta = {
        toUserSeconds: etaToUser,
    };

    state.signals = signalETAs;
    }

        // Keep your existing simulation broadcast if needed
        io.emit("simulation:state", state);

        // NEW:
        // Attach the live SUMO ambulance to an active emergency
        await updateEmergencyFromSimulation(
        io,
        state
        );
    console.log(
      "🚑 Simulation update:",
      {
        time: state?.simulation?.time,
        ambulance:
          state?.ambulance?.vehicleId,
        edge:
          state?.ambulance?.currentEdge,
        speed:
          state?.ambulance?.speed,
        heading:
          state?.ambulance?.heading,
        signals:
          state?.signals?.length || 0,
      }
    );
  } catch (error) {
    console.error(
      "❌ Simulation monitor error:",
      error.message
    );
  }
}

function startSimulationMonitor(io) {
  if (monitoring) {
    console.log(
      "⚠️ Simulation monitor already running"
    );
    return;
  }

  monitoring = true;

  console.log(
    `📡 Simulation monitor started (${MONITOR_INTERVAL}ms)`
  );

  // Immediate first request
  pollSimulation(io);

  monitorTimer = setInterval(() => {
    pollSimulation(io);
  }, MONITOR_INTERVAL);
}

function stopSimulationMonitor() {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }

  monitoring = false;

  console.log(
    "🛑 Simulation monitor stopped"
  );
}

module.exports = {
  startSimulationMonitor,
  stopSimulationMonitor,
};