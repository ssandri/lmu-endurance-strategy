const { test, describe } = require('node:test');
const assert = require('node:assert');
const { calculatePitTime, getRefuelTime } = require('../engine/pitTime');
const { generateVariants, calculateStintLength } = require('../engine/strategy');

describe('Pit Time Calculator', () => {
  test('refuel time matches appendix A1', () => {
    assert.strictEqual(getRefuelTime(1), 2.2);
    assert.strictEqual(getRefuelTime(50), 20.0);
    assert.strictEqual(getRefuelTime(100), 40.0);
    assert.strictEqual(getRefuelTime(80), 32.0);
  });

  test('refuel time interpolates between values', () => {
    const time = getRefuelTime(50.5);
    assert(time > 20.0 && time < 20.4);
  });

  test('tyre change time matches appendix A3', () => {
    assert.strictEqual(calculatePitTime({ fuelAdded: 0, tyresChanged: 0, damageType: 'none' }), 0);
    assert.strictEqual(calculatePitTime({ fuelAdded: 0, tyresChanged: 1, damageType: 'none' }), 5);
    assert.strictEqual(calculatePitTime({ fuelAdded: 0, tyresChanged: 4, damageType: 'none' }), 12);
  });

  test('damage time matches appendix A2', () => {
    assert.strictEqual(calculatePitTime({ fuelAdded: 0, tyresChanged: 0, damageType: 'bodywork' }), 32.5);
    assert.strictEqual(calculatePitTime({ fuelAdded: 0, tyresChanged: 0, damageType: 'bodywork_rear_wing' }), 60);
    assert.strictEqual(calculatePitTime({ fuelAdded: 0, tyresChanged: 0, damageType: 'red_suspension' }), 180);
  });

  test('total pit time is sum of components', () => {
    const time = calculatePitTime({ fuelAdded: 80, tyresChanged: 4, damageType: 'bodywork' });
    assert.strictEqual(time, 32.0 + 12 + 32.5);
  });
});

describe('Strategy Engine', () => {
  test('stint length respects fuel limit', () => {
    const length = calculateStintLength({ fuelPerLap: 5, energyPerLap: 0, tyreDegFL: 0, tyreDegFR: 0, tyreDegRL: 0, tyreDegRR: 0 });
    assert.strictEqual(length, 20);
  });

  test('stint length respects energy limit with reserve', () => {
    const length = calculateStintLength({ fuelPerLap: 0, energyPerLap: 5, tyreDegFL: 0, tyreDegFR: 0, tyreDegRL: 0, tyreDegRR: 0 });
    assert.strictEqual(length, 19); // (100 - 0.1) / 5 = 19.98 -> floor = 19
  });

  test('stint length respects tyre limit', () => {
    const length = calculateStintLength({ fuelPerLap: 0, energyPerLap: 0, tyreDegFL: 2, tyreDegFR: 3, tyreDegRL: 1, tyreDegRR: 1 });
    assert.strictEqual(length, 33); // 100 / 3 = 33.33 -> floor = 33
  });

  test('stint length is minimum of all limits', () => {
    const length = calculateStintLength({ fuelPerLap: 5, energyPerLap: 10, tyreDegFL: 2, tyreDegFR: 2, tyreDegRL: 2, tyreDegRR: 2 });
    assert.strictEqual(length, 9); // energy: (99.9/10)=9
  });

  test('generates 3 variants', () => {
    const race = { fuel_per_lap: 3.5, energy_per_lap: 2, tyre_deg_fl: 1, tyre_deg_fr: 1, tyre_deg_rl: 1, tyre_deg_rr: 1, estimated_total_laps: 100, available_tyres: 32 };
    const drivers = [{ id: 1, name: 'Alice', avg_lap_time_ms: 90000 }, { id: 2, name: 'Bob', avg_lap_time_ms: 91000 }];
    const variants = generateVariants({ race, drivers, startTime: null, overrides: {} });
    assert.strictEqual(variants.length, 3);
    assert.strictEqual(variants[0].name, 'Normal Pace');
    assert.strictEqual(variants[1].name, 'Fuel Save');
    assert.strictEqual(variants[2].name, 'Mixed');
  });

  test('fuel save variant has longer stints', () => {
    const race = { fuel_per_lap: 3.5, energy_per_lap: 2, tyre_deg_fl: 1, tyre_deg_fr: 1, tyre_deg_rl: 1, tyre_deg_rr: 1, estimated_total_laps: 100, available_tyres: 32 };
    const drivers = [{ id: 1, name: 'Alice', avg_lap_time_ms: 90000 }];
    const variants = generateVariants({ race, drivers, startTime: null, overrides: {} });
    assert(variants[1].stintLength >= variants[0].stintLength);
  });

  test('feasibility flag when tyres insufficient', () => {
    const race = { fuel_per_lap: 10, energy_per_lap: 0, tyre_deg_fl: 0, tyre_deg_fr: 0, tyre_deg_rl: 0, tyre_deg_rr: 0, estimated_total_laps: 200, available_tyres: 4 };
    const drivers = [{ id: 1, name: 'Alice', avg_lap_time_ms: 90000 }];
    const variants = generateVariants({ race, drivers, startTime: null, overrides: {} });
    assert.strictEqual(variants[0].feasible, false);
  });
});
