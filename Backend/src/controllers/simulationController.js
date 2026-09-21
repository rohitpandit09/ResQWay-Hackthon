const simulationService =
  require("../services/simulationService");

const start = async (req, res) => {
  try {
    const result =
      await simulationService.startSimulation();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Start simulation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const stop = async (req, res) => {
  try {
    const result =
      await simulationService.stopSimulation();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const status = async (req, res) => {
  try {
    const result =
      await simulationService.getSimulationStatus();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const state = async (req, res) => {
  try {
    const result =
      await simulationService.getSimulationState();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  start,
  stop,
  status,
  state,
};