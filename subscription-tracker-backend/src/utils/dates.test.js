const assert = require("node:assert/strict");
const test = require("node:test");
const { addCycle } = require("./dates");

test("monthly cycle clamps January 31 to February's last day", () => {
  const nextDueDate = addCycle(new Date("2026-01-31T00:00:00.000Z"), "monthly");

  assert.equal(nextDueDate.toISOString(), "2026-02-28T00:00:00.000Z");
});

test("quarterly and yearly cycles clamp to the target month's last day", () => {
  assert.equal(
    addCycle(new Date("2026-01-31T00:00:00.000Z"), "quarterly").toISOString(),
    "2026-04-30T00:00:00.000Z"
  );
  assert.equal(
    addCycle(new Date("2024-02-29T00:00:00.000Z"), "yearly").toISOString(),
    "2025-02-28T00:00:00.000Z"
  );
});

test("weekly cycle advances seven UTC calendar days", () => {
  assert.equal(
    addCycle(new Date("2026-01-31T00:00:00.000Z"), "weekly").toISOString(),
    "2026-02-07T00:00:00.000Z"
  );
});

test("unsupported cycles and invalid dates are rejected", () => {
  assert.throws(() => addCycle(new Date("invalid"), "monthly"), TypeError);
  assert.throws(() => addCycle(new Date("2026-01-31"), "daily"), RangeError);
});