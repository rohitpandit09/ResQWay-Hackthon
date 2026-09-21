const express = require("express");

const {
  analyzeEmergencyCall,
} = require("../controllers/aiController");

const router = express.Router();

router.post(
  "/calls/:callId/analyze",
  analyzeEmergencyCall
);

module.exports = router;