import { expect, test } from "bun:test";
import { assertDemoTarget } from "./target";

test("accepts the demo database through a local tunnel", () => {
  expect(
    assertDemoTarget(
      "postgresql://demo_owner:secret@127.0.0.1:55439/teslamate_demo",
    ).port,
  ).toBe("55439");
});

test.each([
  [undefined, "Set DEMO_DATABASE_URL"],
  [
    "postgresql://teslamate:secret@127.0.0.1:55432/teslamate",
    'not to "teslamate"',
  ],
  [
    "postgresql://demo_owner:secret@192.0.2.10:5439/teslamate_demo",
    "not local",
  ],
])("refuses %p", (url, message) => {
  expect(() => assertDemoTarget(url)).toThrow(message);
});
