import { describe, expect, it } from 'vitest';
import { Campaign } from '../../recruitment.service';
import {
  RECRUITMENT_CAMPAIGN_GRID_COLUMNS,
  buildRecruitmentCampaignGridRows,
  normalizeRecruitmentCampaignGridCell,
  normalizeRecruitmentCampaignGridRow,
} from './campaigns-grid.utils';

describe('Recruitment campaigns grid utils', () => {
  it('normalizes cells to grid-safe values', () => {
    expect(normalizeRecruitmentCampaignGridCell('  CMP-PAIE-Q2  ')).toBe('CMP-PAIE-Q2');
    expect(normalizeRecruitmentCampaignGridCell('')).toBe('-');
    expect(normalizeRecruitmentCampaignGridCell(null)).toBe('-');
    expect(normalizeRecruitmentCampaignGridCell(undefined)).toBe('-');
    expect(normalizeRecruitmentCampaignGridCell(6)).toBe(6);
    expect(normalizeRecruitmentCampaignGridCell(Number.NaN)).toBe(0);
  });

  it('pads or trims rows to expected campaign grid length', () => {
    const expectedLength = RECRUITMENT_CAMPAIGN_GRID_COLUMNS.length;

    expect(normalizeRecruitmentCampaignGridRow(['A', 'B'], expectedLength)).toHaveLength(expectedLength);
    expect(normalizeRecruitmentCampaignGridRow(new Array(20).fill('X'), expectedLength)).toHaveLength(expectedLength);
  });

  it('builds stable campaign rows with fallback placeholders', () => {
    const malformedCampaign = {
      code: 'CMP-TEST',
      title: '',
      department: 'DRH',
      openings: Number.NaN,
      startDate: '',
      endDate: '',
      status: '',
      needPosition: '',
      needQuota: Number.NaN,
      needDeadline: '',
      needOwner: '',
    } as Campaign;

    const rows = buildRecruitmentCampaignGridRows([malformedCampaign]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(RECRUITMENT_CAMPAIGN_GRID_COLUMNS.length);
    expect(rows[0]).toEqual([
      'CMP-TEST',
      '-',
      'DRH',
      0,
      '-',
      '-',
      '-',
      0,
      '-',
      '-',
      '-',
    ]);
  });
});
