function calculateETASeconds(
  distanceMeters,
  actualSpeedMps,
  fallbackSpeedMps
) {
  if (
    distanceMeters === null ||
    distanceMeters === undefined ||
    distanceMeters < 0
  ) {
    return null;
  }

  let speed = actualSpeedMps;

  /*
   * If ambulance is basically stopped, using 0
   * would make ETA infinite.
   *
   * For the simulation's predicted ETA, fall back
   * to the vehicle's allowed speed.
   */
  if (!speed || speed < 0.5) {
    speed = fallbackSpeedMps;
  }

  if (!speed || speed <= 0) {
    return null;
  }

  return distanceMeters / speed;
}

function calculateETAForSignal(
  distanceMeters,
  actualSpeedMps,
  fallbackSpeedMps
) {
  return calculateETASeconds(
    distanceMeters,
    actualSpeedMps,
    fallbackSpeedMps
  );
}

function buildSignalETA(
  signals,
  actualSpeedMps,
  fallbackSpeedMps
) {
  return signals.map((signal) => ({
    ...signal,

    etaSeconds:
      calculateETAForSignal(
        signal.distance,
        actualSpeedMps,
        fallbackSpeedMps
      ),
  }));
}

module.exports = {
  calculateETASeconds,
  buildSignalETA,
};