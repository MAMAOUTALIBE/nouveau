import { Campaign } from '../../recruitment.service';

export const RECRUITMENT_CAMPAIGN_GRID_COLUMNS = [
  'Code',
  'Intitule',
  'Direction',
  'Ouvertures',
  'Debut',
  'Fin',
  'Besoin',
  'Quota',
  'Delai',
  'Owner',
  'Statut',
] as const;

export type RecruitmentCampaignGridCell = string | number;

export function normalizeRecruitmentCampaignGridCell(value: unknown): RecruitmentCampaignGridCell {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value || '').trim();
  return normalized || '-';
}

export function normalizeRecruitmentCampaignGridRow(
  row: ReadonlyArray<unknown>,
  columnCount = RECRUITMENT_CAMPAIGN_GRID_COLUMNS.length
): RecruitmentCampaignGridCell[] {
  const normalized = row
    .slice(0, columnCount)
    .map((cell) => normalizeRecruitmentCampaignGridCell(cell));

  while (normalized.length < columnCount) {
    normalized.push('-');
  }

  return normalized;
}

export function buildRecruitmentCampaignGridRows(items: Campaign[]): RecruitmentCampaignGridCell[][] {
  return items.map((campaign) =>
    normalizeRecruitmentCampaignGridRow([
      campaign.code,
      campaign.title,
      campaign.department,
      campaign.openings,
      campaign.startDate,
      campaign.endDate,
      campaign.needPosition,
      campaign.needQuota,
      campaign.needDeadline,
      campaign.needOwner,
      campaign.status,
    ])
  );
}
