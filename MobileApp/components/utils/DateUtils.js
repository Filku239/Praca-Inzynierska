import { COLORS } from '../constants/Config';

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

export const formatDate = (date) => {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  return `${y}-${m}-${d}`;
};

export const parseISODate = (isoString) => {
  const [y, m, d] = isoString.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const getDatesBetween = (startISO, endISO, color = COLORS.primary, textColor = COLORS.white) => {
  const dates = {};
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return dates;
  }

  let current = new Date(start.getTime());

  while (current.getTime() <= end.getTime()) {
    const ds = formatDate(current);
    dates[ds] = { color, textColor };
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

export const rangeCollidesWithReserved = (startISO, endISO, reservedDatesMap) => {
  let current = parseISODate(startISO);
  const end = parseISODate(endISO);

  while (current.getTime() <= end.getTime()) {
    const ds = formatDate(current);
    if (reservedDatesMap[ds]) return true;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return false;
};

export const buildSelectedDatesMap = (startISO, endISO, COLORS) => {
  const map = getDatesBetween(startISO, endISO, COLORS.primary, COLORS.white);
  map[startISO] = { ...map[startISO], startingDay: true };
  map[endISO] = { ...map[endISO], endingDay: true };
  if (startISO === endISO) {
    map[startISO] = { ...map[startISO], startingDay: true, endingDay: true };
  }
  return map;
};