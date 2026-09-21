const fs = require("fs");
const path = require("path");

const Call = require("../models/Call");

const uploadRecording = async (req, res) => {
  try {
    const { callId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    // Recording is allowed only if user explicitly consented
    if (!call.recordingConsent) {
      // Remove uploaded file because consent was not given
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(403).json({
        success: false,
        message: "Recording consent was not granted",
      });
    }

    call.recordingStatus = "READY";
    call.recordingPath = req.file.path;
    call.recordingMimeType = req.file.mimetype;
    call.recordingSize = req.file.size;
    call.recordingUploadedAt = new Date();

    await call.save();

    return res.status(200).json({
      success: true,
      message: "Recording uploaded successfully",
      recording: {
        callId: call._id,
        status: call.recordingStatus,
        mimeType: call.recordingMimeType,
        size: call.recordingSize,
        path: call.recordingPath,
        uploadedAt: call.recordingUploadedAt,
      },
    });
  } catch (error) {
    console.error("Recording upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload recording",
    });
  }
};

module.exports = {
  uploadRecording,
};