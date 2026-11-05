/** Date-only calendar arithmetic avoids UTC formatting shifts and DST-length days. */
export function planCalendar(
  examDate: string,
  now = new Date(),
  timeZone?: string,
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate))
    throw new Error("Choose a valid exam date.");
  const [year, month, day] = examDate.split("-").map(Number);
  const exam = Date.UTC(year, month - 1, day);
  if (
    !Number.isFinite(exam) ||
    new Date(exam).toISOString().slice(0, 10) !== examDate
  )
    throw new Error("Choose a valid exam date.");
  let today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (timeZone !== undefined) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(now);
      const value = (name: string) =>
        Number(parts.find((part) => part.type === name)?.value);
      today = Date.UTC(value("year"), value("month") - 1, value("day"));
    } catch {
      throw new Error("Choose a valid time zone.");
    }
  }
  const daysRemaining = (exam - today) / 86400000;
  if (daysRemaining <= 0)
    throw new Error("Target exam date must be at least 1 day in the future.");
  return {
    daysRemaining,
    dates: Array.from({ length: Math.min(daysRemaining, 30) }, (_, index) =>
      new Date(today + index * 86400000).toISOString().slice(0, 10),
    ),
  };
}
/** Allocate the whole-minute budget exactly; largest remainders receive spare minutes. */
export function allocateStudyMinutes(total: number, weights: number[]) {
  if (
    !Number.isInteger(total) ||
    total < 0 ||
    weights.some((w) => !Number.isFinite(w) || w <= 0) ||
    !weights.length
  )
    throw new Error("Invalid study time allocation.");
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const allocated = exact.map(Math.floor);
  const order = exact
    .map((value, index) => ({ index, fraction: value - allocated[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  const remaining = total - allocated.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) allocated[order[i].index]++;
  return allocated;
}
