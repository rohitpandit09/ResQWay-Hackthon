const Emergency = require("../models/Emergency");

const getEmergency = async (req, res) => {
  try {
    const { emergencyId } =
      req.params;

    const emergency =
      await Emergency.findById(
        emergencyId
      )
        .populate(
          "clientId",
          "name email phone"
        )
        .populate(
          "driverId",
          "name email phone ambulanceNumber"
        );

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Emergency not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: emergency,
    });
  } catch (error) {
    console.error(
      "Get emergency error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch emergency",
    });
  }
};

module.exports = {
  getEmergency,
};