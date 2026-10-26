import { mapTimes } from '../mapTimings';

describe('mapTimes', () => {
  it('returns times unchanged when words match', () => {
    expect(mapTimes(['A', 'b,', 'c.'], [0, 1, 2], ['A', 'b,', 'c.'])).toEqual([0, 1, 2]);
  });

  it('ignores punctuation and case differences', () => {
    expect(mapTimes(['Hallo,', 'Welt.'], [0, 1], ['hallo', 'welt'])).toEqual([0, 1]);
  });

  it('interpolates words that are missing from the file', () => {
    const out = mapTimes(['eins', 'zwei', 'vier'], [0, 1, 3], ['eins', 'zwei', 'drei', 'vier']);
    expect(out).toEqual([0, 1, 2, 3]);
  });

  it('gives up when the texts are too different', () => {
    expect(mapTimes(['a', 'b', 'c', 'd'], [0, 1, 2, 3], ['x', 'y', 'z', 'w'])).toBeNull();
  });
});
