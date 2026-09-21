const {
  analyzeCall,
} = require("../services/aiService");

const analyzeEmergencyCall = async (
  req,
  res
) => {
  try {
    const { callId } = req.params;

    if (!callId) {
      return res.status(400).json({
        success: false,
        message: "callId is required",
      });
    }

    const result =
      await analyzeCall(callId);

    return res.status(200).json({
      success: true,
      message:
        "Call analyzed successfully",

      data: result,
    });
  } catch (error) {
    console.error(
      "AI analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to analyze call",
    });
  }
};

module.exports = {
  analyzeEmergencyCall,
};