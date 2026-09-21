module.exports = {
  ambulanceId:
    process.env.SIM_AMBULANCE_ID || "ambulance1",

  ambulanceStartPoint:
    process.env.SIM_AMBULANCE_START || "A1",

  userPoint:
    process.env.SIM_USER_POINT || "D3",

  hospitalPoint:
    process.env.SIM_HOSPITAL_POINT || "A4",
};