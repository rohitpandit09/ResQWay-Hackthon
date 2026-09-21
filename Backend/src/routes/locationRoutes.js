const express = require('express');
const router = express.Router();
const { getClientLocation, getDriverLocation } = require('../utils/getLocation');
const {clientMiddleware, driverMiddleware} = require('../middleware/authMiddleware');

router.post('/client/:clientId/location', clientMiddleware, getClientLocation);
router.post('/driver/:driverId/location', driverMiddleware, getDriverLocation);

module.exports = router;