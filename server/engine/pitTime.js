const REFUEL_TABLE = {};
const exactValues = {
  1:2.2,2:2.4,3:2.6,4:2.8,5:3.1,6:3.3,7:3.5,8:3.7,9:3.9,10:4.1,
  11:4.4,12:4.8,13:5.2,14:5.6,15:6.0,16:6.4,17:6.8,18:7.2,19:7.6,20:8.0,
  21:8.4,22:8.8,23:9.2,24:9.6,25:10.0,26:10.4,27:10.8,28:11.2,29:11.6,30:12.0,
  31:12.4,32:12.8,33:13.2,34:13.6,35:14.0,36:14.4,37:14.8,38:15.2,39:15.6,40:16.0,
  41:16.4,42:16.8,43:17.2,44:17.6,45:18.0,46:18.4,47:18.8,48:19.2,49:19.6,50:20.0,
  51:20.4,52:20.8,53:21.2,54:21.6,55:22.0,56:22.4,57:22.8,58:23.2,59:23.6,60:24.0,
  61:24.4,62:24.8,63:25.2,64:25.6,65:26.0,66:26.4,67:26.8,68:27.2,69:27.6,70:28.0,
  71:28.4,72:28.8,73:29.2,74:29.6,75:30.0,76:30.4,77:30.8,78:31.2,79:31.6,80:32.0,
  81:32.4,82:32.8,83:33.2,84:33.6,85:34.0,86:34.4,87:34.8,88:35.2,89:35.6,90:36.0,
  91:36.4,92:36.8,93:37.2,94:37.6,95:38.0,96:38.4,97:38.8,98:39.2,99:39.6,100:40.0
};
Object.entries(exactValues).forEach(([k, v]) => { REFUEL_TABLE[Number(k)] = v; });

function getRefuelTime(fuelPct) {
  if (fuelPct <= 0) return 0;
  if (fuelPct >= 100) return REFUEL_TABLE[100];
  const lower = Math.floor(fuelPct);
  const upper = Math.ceil(fuelPct);
  if (lower === upper) return REFUEL_TABLE[lower] || 0;
  const lowerTime = REFUEL_TABLE[lower] || 0;
  const upperTime = REFUEL_TABLE[upper] || 0;
  return lowerTime + (upperTime - lowerTime) * (fuelPct - lower);
}

const DAMAGE_TIME = {
  none: 0,
  bodywork: 32.5,
  bodywork_rear_wing: 60,
  yellow_suspension: 32.5,
  orange_suspension: 110,
  red_suspension: 180,
};

const TYRE_CHANGE_TIME = { 0: 0, 1: 5, 2: 5, 3: 12, 4: 12 };

function calculatePitTime({ fuelAdded = 0, tyresChanged = 4, damageType = 'none' }) {
  const refuel = getRefuelTime(fuelAdded);
  const damage = DAMAGE_TIME[damageType] || 0;
  const tyres = TYRE_CHANGE_TIME[tyresChanged] || 0;
  return refuel + damage + tyres;
}

module.exports = { calculatePitTime, getRefuelTime, DAMAGE_TIME, TYRE_CHANGE_TIME };
