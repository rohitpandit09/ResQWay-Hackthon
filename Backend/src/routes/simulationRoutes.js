const express = require("express");

const {
  start,
  stop,
  status,
  state,
} = require("../controllers/simulationController");

const router = express.Router();

router.post("/start", start);

router.post("/stop", stop);

router.get("/status", status);

router.get("/state", state);

module.exports = router;