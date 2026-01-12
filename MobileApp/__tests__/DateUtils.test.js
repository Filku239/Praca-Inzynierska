import {
  formatDate,
  parseISODate,
  getDatesBetween,
  rangeCollidesWithReserved,
  buildSelectedDatesMap,
} from '../components/utils/DateUtils';

const MOCK_COLORS = {
  primary: 'blue',
  white: 'white',
};

describe('DateUtils', () => {

  describe('formatDate', () => {
    test('correct format of date: YYYY-MM-DD', () => {
      const date = new Date(Date.UTC(2024, 0, 5));
      expect(formatDate(date)).toBe('2024-01-05');
    });
  });

  describe('parseISODate', () => {
    test('correct parsing of ISO date', () => {
      const date = parseISODate('2024-06-15');
      expect(date.getUTCFullYear()).toBe(2024);
      expect(date.getUTCMonth()).toBe(5);
      expect(date.getUTCDate()).toBe(15);
    });
  });  

  describe('getDatesBetween', () => {
    test('generate dates between two dates', () => {
      const result = getDatesBetween(
        '2024-06-01',
        '2024-06-03',
        'red',
        'white'
      );

      expect(result).toEqual({
        '2024-06-01': { color: 'red', textColor: 'white' },
        '2024-06-02': { color: 'red', textColor: 'white' },
        '2024-06-03': { color: 'red', textColor: 'white' },
      });
    });
  });

  describe('rangeCollidesWithReserved', () => {
    test('returns true when there is a collision', () => {
      const reservedDates = {
        '2024-06-02': true,
      };

      const result = rangeCollidesWithReserved(
        '2024-06-01',
        '2024-06-03',
        reservedDates
      );

      expect(result).toBe(true);
    });
  });

  describe('buildSelectedDatesMap', () => {
    test('builds map with startingDay and endingDay', () => {
      const result = buildSelectedDatesMap(
        '2024-06-01',
        '2024-06-03',
        MOCK_COLORS
      );

      expect(result['2024-06-01'].startingDay).toBe(true);
      expect(result['2024-06-03'].endingDay).toBe(true);
    });
  });

});
