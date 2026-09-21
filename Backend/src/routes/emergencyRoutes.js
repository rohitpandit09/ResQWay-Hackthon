const express = require("express");

const {
  getEmergency,
} = require("../controllers/emergencyController");

const router = express.Router();

router.get(
  "/:emergencyId",
  getEmergency
);

module.exports = router;