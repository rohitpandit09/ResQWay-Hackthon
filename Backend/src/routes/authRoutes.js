const express = require('express');
const router = express.Router();
const { clientLogin, clientRegister, driverLogin, driverRegister } = require('../controllers/authController');

router.post('/client/login',clientLogin);
router.post('/client/register',clientRegister);
router.post('/driver/login',driverLogin);
router.post('/driver/register',driverRegister);

module.exports = router;