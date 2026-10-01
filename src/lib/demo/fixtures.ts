import { demoCarId } from "./generate";

export function demoFixtures(now: Date) {
  return {
    settings: [
      { id: 1, inserted_at: now, updated_at: now, theme_mode: "dark" },
    ],
    carSettings: [{ id: 1 }, { id: 2 }],
    cars: [
      {
        id: 1,
        eid: 1000000001,
        vid: 2000000001,
        vin: "DEMO00000000000001",
        name: "Highland",
        settings_id: 1,
        display_priority: 1,
        inserted_at: now,
        updated_at: now,
      },
      {
        id: demoCarId,
        eid: 1000000002,
        vid: 2000000002,
        vin: "DEMO00000000000002",
        name: "Juniper",
        model: "Y",
        trim_badging: "50",
        marketing_name: "SR",
        exterior_color: "StealthGrey",
        wheel_type: "Aperture18",
        spoiler_type: "None",
        efficiency: 0.1345,
        settings_id: 2,
        display_priority: 1,
        inserted_at: now,
        updated_at: now,
      },
    ],
  };
}
