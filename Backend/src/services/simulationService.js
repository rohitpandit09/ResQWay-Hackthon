const SIMULATION_BRIDGE_URL =
  process.env.SIMULATION_BRIDGE_URL ||
  "http://127.0.0.1:7000";

async function requestBridge(endpoint, options = {}) {
  const response = await fetch(
    `${SIMULATION_BRIDGE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Simulation bridge returned ${response.status}`
    );
  }

  return data;
}

async function startSimulation() {
  return requestBridge("/simulation/start", {
    method: "POST",
  });
}

async function stopSimulation() {
  return requestBridge("/simulation/stop", {
    method: "POST",
  });
}

async function getSimulationStatus() {
  return requestBridge("/simulation/status");
}

async function getAmbulanceState() {
  return requestBridge("/simulation/ambulance");
}

async function getUpcomingSignals() {
  return requestBridge("/simulation/signals");
}

async function getSimulationState() {
  return requestBridge("/simulation/state");
}

module.exports = {
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  getAmbulanceState,
  getUpcomingSignals,
  getSimulationState,
};