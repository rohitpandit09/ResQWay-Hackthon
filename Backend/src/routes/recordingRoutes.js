const express = require("express");

const {
  uploadRecording,
} = require("../controllers/recordingController");

const {
  uploadCallAudio,
} = require("../config/upload");

const router = express.Router();

router.post(
  "/calls/:callId/recording",
  uploadCallAudio.single("audio"),
  uploadRecording
);

module.exports = router;