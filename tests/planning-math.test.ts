import test from "node:test";
import assert from "node:assert/strict";
import {
  allocateStudyMinutes,
  planCalendar,
} from "../server/workflows/planningMath.js";
test("calendar starts on the local date instead of shifting to the previous UTC date", () => {
  const now = new Date(2026, 10, 5, 23, 0);
  const result = planCalendar("2026-11-15", now);
  assert.equal(result.daysRemaining, 10);
  assert.equal(result.dates[0], "2026-11-05");
  assert.equal(result.dates.at(-1), "2026-11-14");
});
test("calendar rejects invalid and non-future dates", () => {
  for (const date of ["2026-02-30", "bad", "2026-11-05", "2026-11-04"])
    assert.throws(() => planCalendar(date, new Date(2026, 10, 5)));
});
test("calendar preserves its 30-day preview boundary", () => {
  const result = planCalendar("2027-01-05", new Date(2026, 10, 5));
  assert.equal(result.daysRemaining, 61);
  assert.equal(result.dates.length, 30);
});
test("weighted allocations exactly respect short and fractional-hour budgets", () => {
  for (const total of [30, 60, 90, 210, 840])
    for (const weights of [
      [50, 50, 50],
      [20, 80],
      [95, 20, 55],
    ]) {
      const allocation = allocateStudyMinutes(total, weights);
      assert.equal(
        allocation.reduce((a, b) => a + b, 0),
        total,
      );
      assert.ok(allocation.every(Number.isInteger));
      assert.ok(allocation.every((n) => n >= 0));
    }
  assert.deepEqual(allocateStudyMinutes(30, [50, 50, 50]), [10, 10, 10]);
});

test("calendar uses the browser time zone when server and student dates differ", () => {
  const now = new Date("2026-11-04T20:00:00Z");
  const india = planCalendar("2026-11-15", now, "Asia/Kolkata");
  const utc = planCalendar("2026-11-15", now, "UTC");
  assert.equal(india.dates[0], "2026-11-05");
  assert.equal(india.daysRemaining, 10);
  assert.equal(utc.dates[0], "2026-11-04");
  assert.equal(utc.daysRemaining, 11);
  assert.throws(() => planCalendar("2026-11-15", now, "invalid/time-zone"));
});
