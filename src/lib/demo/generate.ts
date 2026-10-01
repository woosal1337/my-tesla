import { createRandom, type Random } from "./random";
import { car, geofences, placeByKey, places, type Place } from "./world";

export const demoCarId = 2;
const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const localOffset = -7 * hour;

type PositionRow = {
  id: number;
  date: Date;
  latitude: number;
  longitude: number;
  speed: number | null;
  power: number | null;
  odometer: number;
  ideal_battery_range_km: number;
  rated_battery_range_km: number;
  est_battery_range_km: number;
  battery_level: number;
  usable_battery_level: number;
  outside_temp: number;
  inside_temp: number;
  elevation: number;
  is_climate_on: boolean;
  car_id: number;
  drive_id: number | null;
  tpms_pressure_fl: number | null;
  tpms_pressure_fr: number | null;
  tpms_pressure_rl: number | null;
  tpms_pressure_rr: number | null;
};

type DriveRow = {
  id: number;
  start_date: Date;
  end_date: Date;
  outside_temp_avg: number;
  inside_temp_avg: number;
  speed_max: number;
  power_max: number;
  power_min: number;
  start_ideal_range_km: number;
  end_ideal_range_km: number;
  start_rated_range_km: number;
  end_rated_range_km: number;
  start_km: number;
  end_km: number;
  distance: number;
  duration_min: number;
  car_id: number;
  start_address_id: number;
  end_address_id: number;
  start_position_id: number;
  end_position_id: number;
  start_geofence_id: number | null;
  end_geofence_id: number | null;
  ascent: number;
  descent: number;
};

type ChargingProcessRow = {
  id: number;
  start_date: Date;
  end_date: Date;
  charge_energy_added: number;
  charge_energy_used: number;
  start_ideal_range_km: number;
  end_ideal_range_km: number;
  start_rated_range_km: number;
  end_rated_range_km: number;
  start_battery_level: number;
  end_battery_level: number;
  duration_min: number;
  outside_temp_avg: number;
  car_id: number;
  position_id: number;
  address_id: number;
  geofence_id: number | null;
  cost: number | null;
};

type ChargeRow = {
  id: number;
  date: Date;
  battery_level: number;
  usable_battery_level: number;
  charge_energy_added: number;
  charger_actual_current: number;
  charger_phases: number | null;
  charger_pilot_current: number | null;
  charger_power: number;
  charger_voltage: number;
  fast_charger_present: boolean;
  fast_charger_brand: string | null;
  fast_charger_type: string;
  conn_charge_cable: string;
  ideal_battery_range_km: number;
  rated_battery_range_km: number;
  outside_temp: number;
  battery_heater_on: boolean;
  charging_process_id: number;
};

type StateRow = {
  id: number;
  state: "online" | "offline" | "asleep";
  start_date: Date;
  end_date: Date | null;
  car_id: number;
};

type UpdateRow = {
  id: number;
  start_date: Date;
  end_date: Date;
  version: string;
  car_id: number;
};

type AddressRow = {
  id: number;
  display_name: string;
  latitude: number;
  longitude: number;
  name: string;
  house_number: string | null;
  road: string;
  city: string;
  country: string;
  inserted_at: Date;
  updated_at: Date;
};

type GeofenceRow = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  cost_per_unit: number | null;
  billing_type: "per_kwh";
  inserted_at: Date;
  updated_at: Date;
};

export type DemoData = {
  addresses: AddressRow[];
  geofences: GeofenceRow[];
  positions: PositionRow[];
  drives: DriveRow[];
  chargingProcesses: ChargingProcessRow[];
  charges: ChargeRow[];
  states: StateRow[];
  updates: UpdateRow[];
};

type Trip = { at: number; to: string; chargeTo?: number };

type Car = {
  soc: number;
  odometer: number;
  place: Place;
  cabin: number;
  leak: number;
};

const round = (value: number, digits = 2) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

function distanceKm(a: Place | Point, b: Place | Point): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

type Point = { latitude: number; longitude: number };

function outsideTemp(at: number, start: number, days: number, random: Random) {
  const progress = (at - start) / (days * day);
  const mean = 31 - 8 * progress;
  const localHour = ((at + localOffset) % day) / hour;
  return round(
    mean +
      6 * Math.sin(((localHour - 9) / 24) * 2 * Math.PI) +
      random.between(-0.8, 0.8),
    1,
  );
}

function elevationAt(point: Point) {
  return Math.round(
    Math.max(300, 340 + (point.latitude - 33.45) * 1000) +
      25 * Math.sin(point.latitude * 40) +
      20 * Math.cos(point.longitude * 35),
  );
}

function routeWaypoints(from: Place, to: Place, random: Random): Point[] {
  const bends = random.int(2, 4);
  const points: Point[] = [from];
  const dLat = to.latitude - from.latitude;
  const dLon = to.longitude - from.longitude;
  for (let index = 1; index <= bends; index += 1) {
    const fraction = index / (bends + 1);
    const offset = random.between(-0.09, 0.09);
    points.push({
      latitude: from.latitude + dLat * fraction - dLon * offset,
      longitude: from.longitude + dLon * fraction + dLat * offset,
    });
  }
  points.push(to);
  return points;
}

function pointAlong(points: Point[], fraction: number): Point {
  const lengths = points
    .slice(1)
    .map((point, index) => distanceKm(points[index], point));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = Math.min(1, Math.max(0, fraction)) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const local = lengths[index] ? remaining / lengths[index] : 0;
      const a = points[index];
      const b = points[index + 1];
      return {
        latitude: a.latitude + (b.latitude - a.latitude) * local,
        longitude: a.longitude + (b.longitude - a.longitude) * local,
      };
    }
    remaining -= lengths[index];
  }
  return points.at(-1) ?? points[0];
}

function ranges(soc: number, odometer: number) {
  const health = 1 - Math.max(0, odometer - car.newOdometerKm) * car.wearPerKm;
  const rated = round((soc / 100) * car.fullRangeKm * health, 1);
  return {
    rated,
    ideal: round(rated * 1.06, 1),
    estimated: round(rated * 0.88, 1),
  };
}

function dcPower(soc: number) {
  if (soc < 25) return 168;
  return Math.max(38, 168 - (soc - 25) * 2.35);
}

export function generateDemo(options: {
  seed: number;
  end: Date;
  days: number;
}): DemoData {
  const random = createRandom(options.seed);
  const end = options.end.getTime();
  const firstMidnight =
    Math.floor((end + localOffset) / day) * day -
    localOffset -
    (options.days - 1) * day;
  const start = firstMidnight + 7 * hour;
  const created = new Date(start - day);
  const ids = {
    position: 0,
    drive: 0,
    process: 0,
    charge: 0,
    state: 0,
  };

  const geofenceRows: GeofenceRow[] = geofences.map((fence, index) => ({
    id: index + 1,
    name: fence.name,
    latitude: fence.latitude,
    longitude: fence.longitude,
    radius: fence.radius,
    cost_per_unit: fence.costPerUnit,
    billing_type: "per_kwh",
    inserted_at: created,
    updated_at: created,
  }));
  const addressRows: AddressRow[] = places.map((place, index) => ({
    id: index + 1,
    display_name: [place.name, place.road, place.city, "Türkiye"].join(", "),
    latitude: place.latitude,
    longitude: place.longitude,
    name: place.name,
    house_number: place.houseNumber,
    road: place.road,
    city: place.city,
    country: "Türkiye",
    inserted_at: created,
    updated_at: created,
  }));
  const addressId = (place: Place) =>
    addressRows[places.findIndex((candidate) => candidate.key === place.key)]
      .id;
  const geofenceId = (place: Place) =>
    place.geofence
      ? (geofenceRows.find((fence) => fence.name === place.geofence)?.id ??
        null)
      : null;

  const data: DemoData = {
    addresses: addressRows,
    geofences: geofenceRows,
    positions: [],
    drives: [],
    chargingProcesses: [],
    charges: [],
    states: [],
    updates: [],
  };
  const vehicle: Car = {
    soc: 78,
    odometer: 1200,
    place: placeByKey("home"),
    cabin: 24,
    leak: 0,
  };

  const addState = (
    state: StateRow["state"],
    fromMs: number,
    toMs: number | null,
  ) => {
    const from = Math.round(fromMs);
    const to = toMs === null ? null : Math.round(toMs);
    const last = data.states.at(-1);
    if (last && last.state === state && last.end_date?.getTime() === from) {
      last.end_date = to === null ? null : new Date(to);
      return;
    }
    ids.state += 1;
    data.states.push({
      id: ids.state,
      state,
      start_date: new Date(from),
      end_date: to === null ? null : new Date(to),
      car_id: demoCarId,
    });
  };

  const tires = (at: number, temperature: number) => {
    const dayIndex = Math.floor((at - start) / day);
    const base = 2.86 + (temperature - 20) * 0.008;
    const leak = dayIndex < 41 ? dayIndex * 0.0055 : (dayIndex - 41) * 0.001;
    return {
      tpms_pressure_fl: round(base + random.between(-0.01, 0.01), 2),
      tpms_pressure_fr: round(base + random.between(-0.01, 0.01), 2),
      tpms_pressure_rl: round(base - leak + random.between(-0.01, 0.01), 2),
      tpms_pressure_rr: round(base + random.between(-0.01, 0.01), 2),
    };
  };

  const addPosition = (
    at: number,
    point: Point,
    extra: Partial<PositionRow> = {},
  ): PositionRow => {
    const temperature = outsideTemp(at, start, options.days, random);
    const range = ranges(vehicle.soc, vehicle.odometer);
    ids.position += 1;
    const row: PositionRow = {
      id: ids.position,
      date: new Date(at),
      latitude: round(point.latitude, 6),
      longitude: round(point.longitude, 6),
      speed: null,
      power: null,
      odometer: round(vehicle.odometer, 3),
      ideal_battery_range_km: range.ideal,
      rated_battery_range_km: range.rated,
      est_battery_range_km: range.estimated,
      battery_level: Math.round(vehicle.soc),
      usable_battery_level: Math.max(
        0,
        Math.round(vehicle.soc) -
          (temperature < 5 ? 2 : temperature < 10 ? 1 : 0),
      ),
      outside_temp: temperature,
      inside_temp: round(vehicle.cabin, 1),
      elevation: elevationAt(point),
      is_climate_on: false,
      car_id: demoCarId,
      drive_id: null,
      tpms_pressure_fl: null,
      tpms_pressure_fr: null,
      tpms_pressure_rl: null,
      tpms_pressure_rr: null,
      ...extra,
    };
    data.positions.push(row);
    return row;
  };

  const drain = (from: number, to: number, perHour: number) => {
    vehicle.soc = Math.max(5, vehicle.soc - ((to - from) / hour) * perHour);
  };

  const park = (from: number, to: number) => {
    if (to <= from) return;
    const wakeEnd = Math.min(to, from + random.int(9, 16) * minute);
    addState("online", from, wakeEnd);
    drain(from, wakeEnd, 0.45);
    addPosition(wakeEnd, vehicle.place);
    if (wakeEnd >= to) return;
    let cursor = wakeEnd;
    const departWake = to - 2 * minute;
    while (cursor < departWake) {
      const nextWake = cursor + random.between(5, 9) * hour;
      const sleepEnd = Math.min(departWake, nextWake);
      addState("asleep", cursor, sleepEnd);
      drain(cursor, sleepEnd, 0.035);
      cursor = sleepEnd;
      if (cursor < departWake && random.chance(0.35)) {
        const awake = Math.min(departWake, cursor + random.int(4, 9) * minute);
        addState("online", cursor, awake);
        drain(cursor, awake, 0.45);
        addPosition(awake, vehicle.place);
        cursor = awake;
      }
    }
    addState("online", departWake, to);
    vehicle.cabin +=
      (outsideTemp(to, start, options.days, random) - vehicle.cabin) * 0.8;
    addPosition(departWake, vehicle.place);
  };

  const charge = (kind: "ac" | "dc", from: number, target: number) => {
    const fence = geofenceRows.find(
      (row) => row.name === vehicle.place.geofence,
    );
    const position = addPosition(from, vehicle.place);
    ids.process += 1;
    const processId = ids.process;
    const startSoc = vehicle.soc;
    const startRange = ranges(startSoc, vehicle.odometer);
    const step = kind === "ac" ? minute : 10_000;
    let at = from;
    let added = 0;
    let used = 0;
    let temperatureSum = 0;
    let samples = 0;
    while (vehicle.soc < target) {
      const temperature = outsideTemp(at, start, options.days, random);
      const power =
        kind === "ac"
          ? vehicle.soc > target - 3
            ? 6.2
            : 11
          : dcPower(vehicle.soc) + random.between(-2, 2);
      const voltage =
        kind === "ac"
          ? Math.round(
              229 +
                2 * Math.sin(at / (23 * minute)) +
                random.between(-0.4, 0.4),
            )
          : Math.round(360 + vehicle.soc * 0.7);
      const stepHours = step / hour;
      const intoBattery = power * stepHours * (kind === "ac" ? 0.9 : 0.95);
      added += intoBattery;
      used += power * stepHours;
      vehicle.soc = Math.min(
        100,
        vehicle.soc + (intoBattery / car.capacityKwh) * 100,
      );
      const range = ranges(vehicle.soc, vehicle.odometer);
      ids.charge += 1;
      data.charges.push({
        id: ids.charge,
        date: new Date(at),
        battery_level: Math.round(vehicle.soc),
        usable_battery_level: Math.round(vehicle.soc),
        charge_energy_added: round(added, 2),
        charger_actual_current:
          kind === "ac" ? 16 : Math.round((power * 1000) / voltage),
        charger_phases: kind === "ac" ? 3 : null,
        charger_pilot_current: kind === "ac" ? 16 : null,
        charger_power: Math.round(power),
        charger_voltage: voltage,
        fast_charger_present: kind === "dc",
        fast_charger_brand: kind === "dc" ? "Tesla" : null,
        fast_charger_type: kind === "dc" ? "Tesla" : "ACSingleWireCAN",
        conn_charge_cable: "IEC",
        ideal_battery_range_km: range.ideal,
        rated_battery_range_km: range.rated,
        outside_temp: temperature,
        battery_heater_on: false,
        charging_process_id: processId,
      });
      temperatureSum += temperature;
      samples += 1;
      at += step;
    }
    const endRange = ranges(vehicle.soc, vehicle.odometer);
    data.chargingProcesses.push({
      id: processId,
      start_date: new Date(from),
      end_date: new Date(at),
      charge_energy_added: round(added, 2),
      charge_energy_used: round(used, 2),
      start_ideal_range_km: startRange.ideal,
      end_ideal_range_km: endRange.ideal,
      start_rated_range_km: startRange.rated,
      end_rated_range_km: endRange.rated,
      start_battery_level: Math.round(startSoc),
      end_battery_level: Math.round(vehicle.soc),
      duration_min: Math.round((at - from) / minute),
      outside_temp_avg: round(temperatureSum / Math.max(1, samples), 1),
      car_id: demoCarId,
      position_id: position.id,
      address_id: addressId(vehicle.place),
      geofence_id: fence?.id ?? null,
      cost: fence?.cost_per_unit ? round(used * fence.cost_per_unit, 2) : null,
    });
    addPosition(at, vehicle.place);
    return at;
  };

  const drive = (departAt: number, destination: Place) => {
    const from = vehicle.place;
    const points = routeWaypoints(from, destination, random);
    const straight = distanceKm(from, destination);
    const routeKm = straight * (straight < 15 ? 1.4 : 1.22);
    const cruise = routeKm < 12 ? 34 : routeKm < 60 ? 64 : 98;
    const durationMs = (routeKm / cruise) * hour * random.between(0.92, 1.12);
    const steps = Math.max(8, Math.ceil(durationMs / 15_000));
    ids.drive += 1;
    const driveId = ids.drive;
    const startSoc = vehicle.soc;
    const startKm = vehicle.odometer;
    vehicle.cabin = 21;
    const rows: PositionRow[] = [];
    const ramp = Math.max(2, Math.round(steps * 0.07));
    const weights = Array.from({ length: steps + 1 }, (_, index) =>
      index === 0
        ? 0
        : Math.min(1, index / ramp, (steps - index + 1) / ramp) *
          random.between(0.88, 1.1),
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let covered = 0;
    let previous = { point: from as Point, km: 0, speed: 0 };
    for (let index = 0; index <= steps; index += 1) {
      covered += weights[index];
      const fraction = covered / totalWeight;
      const point = pointAlong(points, fraction);
      const km = fraction * routeKm;
      const deltaKm = Math.max(0, km - previous.km);
      const at = departAt + (durationMs * index) / steps;
      const speed = index
        ? Math.round((deltaKm / (durationMs / steps)) * hour)
        : 0;
      const temperature = outsideTemp(at, start, options.days, random);
      const whPerKm =
        car.whPerKm -
        18 +
        0.012 * (speed - 55) ** 2 +
        Math.max(0, 18 - temperature) * 2.6;
      vehicle.odometer += deltaKm;
      vehicle.soc = Math.max(
        3,
        vehicle.soc - ((deltaKm * whPerKm) / 1000 / car.capacityKwh) * 100,
      );
      const acceleration = (speed - previous.speed) / 15;
      const power = Math.round(
        Math.max(
          -62,
          Math.min(210, (speed * whPerKm) / 1000 + acceleration * 7.5),
        ),
      );
      rows.push(
        addPosition(at, point, {
          speed,
          power,
          drive_id: driveId,
          is_climate_on: true,
          inside_temp: 21,
          ...tires(at, temperature),
        }),
      );
      previous = { point, km, speed };
    }
    const first = rows[0];
    const last = rows.at(-1) ?? first;
    let ascent = 0;
    let descent = 0;
    rows.slice(1).forEach((row, index) => {
      const delta = row.elevation - rows[index].elevation;
      if (delta > 0) ascent += delta;
      else descent -= delta;
    });
    const temperatures = rows.map((row) => row.outside_temp);
    vehicle.place = destination;
    data.drives.push({
      id: driveId,
      start_date: first.date,
      end_date: last.date,
      outside_temp_avg: round(
        temperatures.reduce((sum, value) => sum + value, 0) /
          temperatures.length,
        1,
      ),
      inside_temp_avg: 21,
      speed_max: Math.max(...rows.map((row) => row.speed ?? 0)),
      power_max: Math.max(...rows.map((row) => row.power ?? 0)),
      power_min: Math.min(...rows.map((row) => row.power ?? 0)),
      start_ideal_range_km: ranges(startSoc, vehicle.odometer).ideal,
      end_ideal_range_km: ranges(vehicle.soc, vehicle.odometer).ideal,
      start_rated_range_km: ranges(startSoc, vehicle.odometer).rated,
      end_rated_range_km: ranges(vehicle.soc, vehicle.odometer).rated,
      start_km: round(startKm, 3),
      end_km: round(vehicle.odometer, 3),
      distance: round(vehicle.odometer - startKm, 3),
      duration_min: Math.max(
        1,
        Math.round((last.date.getTime() - first.date.getTime()) / minute),
      ),
      car_id: demoCarId,
      start_address_id: addressId(from),
      end_address_id: addressId(destination),
      start_position_id: first.id,
      end_position_id: last.id,
      start_geofence_id: geofenceId(from),
      end_geofence_id: geofenceId(destination),
      ascent: Math.round(ascent),
      descent: Math.round(descent),
    });
    addState("online", departAt, last.date.getTime());
    return last.date.getTime();
  };

  const localTime = (dayStart: number, hours: number, minutes: number) =>
    dayStart + hours * hour + minutes * minute;

  const plan = (dayIndex: number): Trip[] => {
    const dayStart = firstMidnight + dayIndex * day;
    const weekday = new Date(dayStart + localOffset + hour).getUTCDay();
    const roadTripDay = options.days - 24;
    if (dayIndex === roadTripDay) {
      return [
        {
          at: localTime(dayStart, 8, random.int(20, 40)),
          to: "trip-sc",
          chargeTo: 92,
        },
        { at: 0, to: "hotel" },
      ];
    }
    if (dayIndex === roadTripDay + 1) {
      return [
        {
          at: localTime(dayStart, 10, random.int(0, 30)),
          to: "trip-sc",
          chargeTo: 78,
        },
        { at: 0, to: "home" },
      ];
    }
    if (weekday === 0 || weekday === 6) {
      if (random.chance(0.3)) return [];
      const outing = random.pick([
        "lake",
        "viewpoint",
        "friends",
        "mall",
      ] as const);
      return [
        { at: localTime(dayStart, 11, random.int(0, 50)), to: outing },
        { at: localTime(dayStart, 15, random.int(10, 55)), to: "home" },
      ];
    }
    const leaveOffice = localTime(dayStart, 17, random.int(40, 59));
    const trips: Trip[] = [
      { at: localTime(dayStart, 8, random.int(0, 25)), to: "office" },
    ];
    if (dayIndex % 11 === 4) {
      trips.push({ at: leaveOffice, to: "local-sc" });
      trips.push({ at: 0, to: "home" });
      return trips;
    }
    trips.push({ at: leaveOffice, to: "home" });
    if (random.chance(0.3)) {
      const errand = random.pick(["market", "mall"] as const);
      const leave = localTime(dayStart, 19, random.int(10, 45));
      trips.push({ at: leave, to: errand });
      trips.push({ at: leave + random.int(35, 70) * minute, to: "home" });
    }
    return trips;
  };

  let clock = start;
  addState("online", clock - 10 * minute, clock);
  addPosition(clock - 10 * minute, vehicle.place);
  for (let dayIndex = 0; dayIndex < options.days; dayIndex += 1) {
    for (const trip of plan(dayIndex)) {
      const departAt = trip.at || clock + random.int(20, 35) * minute;
      if (departAt >= end || departAt <= clock) continue;
      if (trip.to === vehicle.place.key) continue;
      park(clock, departAt);
      clock = drive(departAt, placeByKey(trip.to));
      if (clock >= end) break;
      const chargeTo =
        trip.chargeTo ??
        (trip.to === "local-sc" ? random.int(72, 80) : undefined);
      if (chargeTo) {
        const arrived = clock;
        clock = charge("dc", arrived + 2 * minute, chargeTo);
        addState("online", arrived, clock);
      }
    }
    const evening = firstMidnight + dayIndex * day + 21 * hour + 30 * minute;
    if (
      ["home", "hotel"].includes(vehicle.place.key) &&
      vehicle.soc < 55 &&
      evening > clock &&
      evening + 6 * hour < end
    ) {
      park(clock, evening);
      clock = charge("ac", evening, 80);
      addState("online", evening, clock);
    }
    const updateDays = [
      Math.floor(options.days * 0.2),
      Math.floor(options.days * 0.8),
    ];
    const updateIndex = updateDays.indexOf(dayIndex);
    if (updateIndex >= 0) {
      const at = firstMidnight + (dayIndex + 1) * day + 2 * hour + 15 * minute;
      data.updates.push({
        id: updateIndex + 1,
        start_date: new Date(at),
        end_date: new Date(at + random.int(22, 34) * minute),
        version: ["2026.14.6 1b9c2a0e4f", "2026.20.300 7d3e91c0aa"][
          updateIndex
        ],
        car_id: demoCarId,
      });
    }
  }
  park(clock, end);
  const last = data.states.at(-1);
  if (last) last.end_date = null;
  return data;
}
