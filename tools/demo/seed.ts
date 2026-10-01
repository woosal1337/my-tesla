import postgres from "postgres";
import { generateDemo } from "../../src/lib/demo/generate";
import { demoFixtures } from "../../src/lib/demo/fixtures";
import { assertDemoTarget } from "./target";

const url = assertDemoTarget(process.env.DEMO_DATABASE_URL).toString();
const sql = postgres(url, { max: 1, onnotice: () => {} });
const days = Number(process.env.DEMO_DAYS ?? 60);
const data = generateDemo({ seed: 20261001, end: new Date(), days });
const now = new Date();

function chunks<T>(rows: T[], size = 1000): T[][] {
  return Array.from({ length: Math.ceil(rows.length / size) }, (_, index) =>
    rows.slice(index * size, index * size + size),
  );
}

await sql.begin(async (tx) => {
  await tx`set local session_replication_role = replica`;
  await tx`
    truncate table charges, charging_processes, drives, positions, states,
      updates, addresses, geofences, cars, car_settings, settings
    restart identity cascade
  `;
  const fixtures = demoFixtures(now);
  await tx`insert into settings ${tx(fixtures.settings)}`;
  await tx`insert into car_settings ${tx(fixtures.carSettings)}`;
  for (const car of fixtures.cars) {
    await tx`insert into cars ${tx(car)}`;
  }
  await tx`insert into geofences ${tx(data.geofences)}`;
  await tx`insert into addresses ${tx(data.addresses)}`;
  for (const rows of chunks(data.positions)) {
    await tx`insert into positions ${tx(rows)}`;
  }
  for (const rows of chunks(data.drives)) {
    await tx`insert into drives ${tx(rows)}`;
  }
  for (const rows of chunks(data.chargingProcesses)) {
    await tx`insert into charging_processes ${tx(rows)}`;
  }
  for (const rows of chunks(data.charges)) {
    await tx`insert into charges ${tx(rows)}`;
  }
  for (const rows of chunks(data.states)) {
    await tx`insert into states ${tx(rows)}`;
  }
  if (data.updates.length) await tx`insert into updates ${tx(data.updates)}`;
  for (const table of [
    "positions",
    "drives",
    "charging_processes",
    "charges",
    "states",
    "updates",
    "addresses",
    "geofences",
    "cars",
    "car_settings",
    "settings",
  ]) {
    await tx.unsafe(
      `select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 1))`,
    );
  }
});

console.log(
  `Seeded ${days} days: ${data.drives.length} drives, ${data.chargingProcesses.length} charges, ${data.positions.length} positions, ${data.states.length} states.`,
);
await sql.end();
