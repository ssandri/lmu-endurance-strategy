const { calculatePitTime } = require('./pitTime');

const ENERGY_RESERVE = 0.1;
const MAX_STINTS = 200;
const MAX_LAPS = 5000;

function calculateStintLength({ fuelPerLap, energyPerLap, tyreDegFL, tyreDegFR, tyreDegRL, tyreDegRR }) {
  const limits = [];
  if (fuelPerLap > 0) limits.push(Math.floor(100 / fuelPerLap));
  if (energyPerLap > 0) limits.push(Math.floor((100 - ENERGY_RESERVE) / energyPerLap));
  const maxTyreDeg = Math.max(tyreDegFL, tyreDegFR, tyreDegRL, tyreDegRR);
  if (maxTyreDeg > 0) limits.push(Math.floor(100 / maxTyreDeg));
  if (limits.length === 0) return 999;
  return Math.min(...limits);
}

function generateStintPlan({ drivers, estimatedTotalLaps, stintLength, startLap = 1, availableTyres, avgPitFuel = 100, startTime = null, avgLapTimeMs = null, tyreMultiplicity = 1 }) {
  const stints = [];
  let currentLap = startLap;
  let driverIndex = 0;
  let tyresUsed = 0;
  let stintNumber = 1;
  let pitStopIndex = 0;

  const totalLaps = Math.min(estimatedTotalLaps, MAX_LAPS);
  const effectiveStintLength = Math.max(1, stintLength);

  while (currentLap <= totalLaps && stintNumber <= MAX_STINTS) {
    const driver = drivers[driverIndex % drivers.length];
    const remainingLaps = totalLaps - currentLap + 1;
    const lapsThisStint = Math.min(effectiveStintLength, remainingLaps);
    const endLap = currentLap + lapsThisStint - 1;

    const isLastStint = endLap >= totalLaps;
    const changeTyresThisPit = !isLastStint && (pitStopIndex % tyreMultiplicity === 0);
    const tyresChanged = changeTyresThisPit ? 4 : 0;
    if (tyresChanged > 0) tyresUsed += tyresChanged;

    const pitTime = isLastStint ? 0 : calculatePitTime({ fuelAdded: avgPitFuel, tyresChanged, damageType: 'none' });

    let estimatedStartTime = null;
    if (startTime && avgLapTimeMs) {
      const elapsedLaps = currentLap - startLap;
      const prevPitStops = stints.length;
      const avgPitTime = calculatePitTime({ fuelAdded: avgPitFuel, tyresChanged: 4, damageType: 'none' });
      const totalElapsedMs = (elapsedLaps * avgLapTimeMs) + (prevPitStops * avgPitTime * 1000);
      estimatedStartTime = new Date(new Date(startTime).getTime() + totalElapsedMs).toISOString();
    }

    stints.push({
      stintNumber,
      driverId: driver.id,
      driverName: driver.name,
      plannedStartLap: currentLap,
      plannedEndLap: endLap,
      fuelLoad: avgPitFuel,
      tyresChanged,
      estimatedStartTime,
      estimatedPitTime: pitTime,
    });

    currentLap = endLap + 1;
    driverIndex++;
    stintNumber++;
    if (!isLastStint) pitStopIndex++;
  }

  return { stints, tyresUsed, feasible: tyresUsed <= availableTyres };
}

function generateVariants({ race, drivers, startTime, overrides = {} }) {
  const params = {
    fuelPerLap: overrides.fuelPerLap ?? race.fuel_per_lap,
    energyPerLap: overrides.energyPerLap ?? race.energy_per_lap,
    tyreDegFL: overrides.tyreDegFL ?? race.tyre_deg_fl,
    tyreDegFR: overrides.tyreDegFR ?? race.tyre_deg_fr,
    tyreDegRL: overrides.tyreDegRL ?? race.tyre_deg_rl,
    tyreDegRR: overrides.tyreDegRR ?? race.tyre_deg_rr,
  };

  const estimatedTotalLaps = overrides.estimatedTotalLaps ?? race.estimated_total_laps;
  const availableTyres = race.available_tyres;
  const tyreMultiplicity = overrides.tyreMultiplicity ?? 1;

  const avgLapTimeMs = drivers.length > 0
    ? drivers.reduce((sum, d) => sum + d.avg_lap_time_ms, 0) / drivers.length
    : null;

  const normalStintLength = calculateStintLength(params);
  const fuelSaveParams = { ...params, fuelPerLap: params.fuelPerLap * 0.85 };
  const fuelSaveStintLength = calculateStintLength(fuelSaveParams);
  const mixedStintLength = Math.floor((normalStintLength + fuelSaveStintLength) / 2);

  const commonOpts = { drivers, estimatedTotalLaps, availableTyres, startTime, avgLapTimeMs, tyreMultiplicity };

  const normalPlan = generateStintPlan({ ...commonOpts, stintLength: normalStintLength });
  const fuelSavePlan = generateStintPlan({ ...commonOpts, stintLength: fuelSaveStintLength });
  const mixedPlan = generateStintPlan({ ...commonOpts, stintLength: mixedStintLength });

  const pitTimePerStop = calculatePitTime({ fuelAdded: 100, tyresChanged: 4, damageType: 'none' });
  const pitTimeNoTyres = calculatePitTime({ fuelAdded: 100, tyresChanged: 0, damageType: 'none' });

  function computeTotalPitTimeSec(plan) {
    return plan.stints.reduce((sum, s) => sum + (s.estimatedPitTime || 0), 0);
  }

  function computeRequiredTyreSets(plan) {
    return plan.tyresUsed / 4;
  }

  const tyreMultiplicityRecommendation = availableTyres > 0
    ? Math.ceil((normalPlan.stints.length - 1) / (availableTyres / 4))
    : 1;

  const variants = [
    {
      name: 'Normal Pace',
      stintLength: normalStintLength,
      ...normalPlan,
      params,
      estimatedTotalLaps,
      pitStops: normalPlan.stints.length - 1,
      avgPace: avgLapTimeMs,
      totalPitTimeSec: computeTotalPitTimeSec(normalPlan),
      requiredTyreSets: computeRequiredTyreSets(normalPlan),
      availableTyres,
      tyreMultiplicityRecommendation,
    },
    {
      name: 'Fuel Save',
      stintLength: fuelSaveStintLength,
      ...fuelSavePlan,
      params: fuelSaveParams,
      estimatedTotalLaps,
      pitStops: fuelSavePlan.stints.length - 1,
      avgPace: avgLapTimeMs ? Math.round(avgLapTimeMs * 1.02) : null,
      totalPitTimeSec: computeTotalPitTimeSec(fuelSavePlan),
      requiredTyreSets: computeRequiredTyreSets(fuelSavePlan),
      availableTyres,
      tyreMultiplicityRecommendation,
      fuelSaveTargets: drivers.map(d => ({
        driverId: d.id,
        driverName: d.name,
        targetFuelPerLap: fuelSaveParams.fuelPerLap,
        targetEnergyPerLap: (overrides.energyPerLap ?? race.energy_per_lap) * 0.9,
        maxPaceLoss: '2%',
      })),
    },
    {
      name: 'Mixed',
      stintLength: mixedStintLength,
      ...mixedPlan,
      params: { ...params, fuelPerLap: (params.fuelPerLap + fuelSaveParams.fuelPerLap) / 2 },
      estimatedTotalLaps,
      pitStops: mixedPlan.stints.length - 1,
      avgPace: avgLapTimeMs ? Math.round(avgLapTimeMs * 1.01) : null,
      totalPitTimeSec: computeTotalPitTimeSec(mixedPlan),
      requiredTyreSets: computeRequiredTyreSets(mixedPlan),
      availableTyres,
      tyreMultiplicityRecommendation,
    },
  ];

  return variants;
}

function recalculateFromLap({ race, drivers, strategy, confirmedStints, currentLap, startTime }) {
  const params = {
    fuelPerLap: strategy.fuel_per_lap || race.fuel_per_lap,
    energyPerLap: strategy.energy_per_lap || race.energy_per_lap,
    tyreDegFL: strategy.tyre_deg_fl || race.tyre_deg_fl,
    tyreDegFR: strategy.tyre_deg_fr || race.tyre_deg_fr,
    tyreDegRL: strategy.tyre_deg_rl || race.tyre_deg_rl,
    tyreDegRR: strategy.tyre_deg_rr || race.tyre_deg_rr,
  };

  const strategyData = strategy.data ? (typeof strategy.data === 'string' ? JSON.parse(strategy.data) : strategy.data) : {};
  const tyreMultiplicity = strategyData.tyreMultiplicity ?? 1;

  const estimatedTotalLaps = race.estimated_total_laps;
  const stintLength = calculateStintLength(params);
  const availableTyres = race.available_tyres;
  const tyresUsedConfirmed = confirmedStints.reduce((sum, s) => sum + (s.tyres_changed || 0), 0);
  const remainingTyres = availableTyres - tyresUsedConfirmed;

  const lastConfirmedDriverIndex = confirmedStints.length > 0
    ? drivers.findIndex(d => d.id === confirmedStints[confirmedStints.length - 1].driver_id)
    : -1;

  const rotatedDrivers = [];
  for (let i = 0; i < drivers.length; i++) {
    rotatedDrivers.push(drivers[(lastConfirmedDriverIndex + 1 + i) % drivers.length]);
  }

  const avgLapTimeMs = drivers.length > 0
    ? drivers.reduce((sum, d) => sum + d.avg_lap_time_ms, 0) / drivers.length
    : null;

  const plan = generateStintPlan({
    drivers: rotatedDrivers,
    estimatedTotalLaps,
    stintLength,
    startLap: currentLap,
    availableTyres: remainingTyres,
    startTime,
    avgLapTimeMs,
    tyreMultiplicity,
  });

  plan.stints = plan.stints.map((s, i) => ({
    ...s,
    stintNumber: confirmedStints.length + i + 1,
  }));

  return plan;
}

module.exports = { generateVariants, recalculateFromLap, calculateStintLength };
