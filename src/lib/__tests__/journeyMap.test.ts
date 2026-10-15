import { describe, it, expect } from 'vitest';
import { JOURNEY_STAGES, FEATURE_TITLES, HANDOFF_LABEL } from '@/lib/journeyMap';

const EXPECTED_IDS = ['C1', 'C2', 'C3', 'C4', 'C5', 'S1', 'S2', 'S3', 'S4', 'S5'];

describe('JOURNEY_STAGES structure', () => {
  it('has the expected ids in order', () => {
    expect(JOURNEY_STAGES.map((s: any) => s.id)).toEqual(EXPECTED_IDS);
  });

  it('first five stages are consumer lane, last five are shop lane', () => {
    const lanes = JOURNEY_STAGES.map((s: any) => s.lane);
    expect(lanes.slice(0, 5)).toEqual(['consumer', 'consumer', 'consumer', 'consumer', 'consumer']);
    expect(lanes.slice(5)).toEqual(['shop', 'shop', 'shop', 'shop', 'shop']);
  });

  it('C4 and C5 are v1, S4 and S5 are later', () => {
    const byId = Object.fromEntries(JOURNEY_STAGES.map((s: any) => [s.id, s]));
    expect(byId.C4.status).toBe('v1');
    expect(byId.C5.status).toBe('v1');
    expect(byId.S4.status).toBe('later');
    expect(byId.S5.status).toBe('later');
  });

  it('every later stage has a non-empty laterReason', () => {
    for (const stage of JOURNEY_STAGES as any[]) {
      if (stage.status === 'later') {
        expect(typeof stage.laterReason).toBe('string');
        expect(stage.laterReason.length).toBeGreaterThan(0);
      }
    }
  });

  it('featureRefs flatten to contain F1..F5 exactly once each', () => {
    const allRefs = (JOURNEY_STAGES as any[]).flatMap((s) => s.featureRefs ?? []);
    const counts: Record<string, number> = {};
    for (const ref of allRefs) {
      counts[ref] = (counts[ref] ?? 0) + 1;
    }
    for (const key of ['F1', 'F2', 'F3', 'F4', 'F5']) {
      expect(counts[key]).toBe(1);
    }
  });

  it('every featureRef key exists in FEATURE_TITLES', () => {
    const allRefs = (JOURNEY_STAGES as any[]).flatMap((s) => s.featureRefs ?? []);
    for (const ref of allRefs) {
      expect(FEATURE_TITLES).toHaveProperty(ref);
    }
  });

  it('FEATURE_TITLES has exactly the keys F1..F5', () => {
    expect(Object.keys(FEATURE_TITLES).sort()).toEqual(['F1', 'F2', 'F3', 'F4', 'F5']);
  });

  it('no stage title/summary/partnerNote mentions diagnosis or dollar figures', () => {
    for (const stage of JOURNEY_STAGES as any[]) {
      const fields = [stage.title, stage.summary, stage.partnerNote].filter(
        (v) => typeof v === 'string'
      );
      for (const field of fields) {
        expect(field).not.toMatch(/diagnos/i);
        expect(field).not.toMatch(/\$\d/);
      }
    }
  });
});

describe('HANDOFF_LABEL', () => {
  it('is a non-empty string', () => {
    expect(typeof HANDOFF_LABEL).toBe('string');
    expect(HANDOFF_LABEL.length).toBeGreaterThan(0);
  });
});
