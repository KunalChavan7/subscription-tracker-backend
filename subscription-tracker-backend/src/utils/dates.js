const MONTHS_PER_CYCLE = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

function addCycle(date, cycle) {
  const result = new Date(date);
  if (Number.isNaN(result.getTime())) {
    throw new TypeError("A valid date is required");
  }

  if (cycle === "weekly") {
    result.setUTCDate(result.getUTCDate() + 7);
    return result;
  }

  const months = MONTHS_PER_CYCLE[cycle];
  if (!months) {
    throw new RangeError(`Unsupported billing cycle: ${cycle}`);
  }

  const monthIndex = result.getUTCMonth() + months;
  const year = result.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = monthIndex % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  result.setUTCFullYear(year, month, Math.min(result.getUTCDate(), lastDay));
  return result;
}

module.exports = { addCycle };