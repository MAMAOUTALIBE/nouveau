import { AgentDocument } from './personnel.service';

export const DOCUMENT_EXPIRY_WARNING_DAYS = 30;

export interface RequiredDocumentDefinition {
  type: string;
  helpText: string;
}

export type DocumentComplianceStatus = 'conforme' | 'a_renouveler' | 'expire' | 'manquant';

export interface DocumentComplianceItem {
  type: string;
  label: string;
  required: boolean;
  status: DocumentComplianceStatus;
  message: string;
  badgeClass: string;
  document: AgentDocument | null;
}

export interface AgentDocumentComplianceSummary {
  items: DocumentComplianceItem[];
  requiredCount: number;
  compliantCount: number;
  missingCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  hasAlerts: boolean;
  alertMessages: string[];
}

const BASE_REQUIRED_DOCUMENTS: RequiredDocumentDefinition[] = [
  {
    type: "Pièce d'identité (CNI/Passeport)",
    helpText: "Vérifie l'identification officielle de l'agent.",
  },
  {
    type: 'CV',
    helpText: 'Justifie le profil et le parcours de recrutement.',
  },
  {
    type: 'Diplôme principal',
    helpText: 'Document de qualification académique principale.',
  },
];

const APPOINTMENT_DOCUMENT: RequiredDocumentDefinition = {
  type: 'Acte/Arrêté de nomination',
  helpText: "Pièce statutaire attendue pour les profils fonctionnaires.",
};

const CONTRACT_DOCUMENT: RequiredDocumentDefinition = {
  type: 'Contrat',
  helpText: 'Contrat signé ou avenant contractuel en vigueur.',
};

export function normalizePersonnelText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getRequiredDocumentDefinitions(contractType: string): RequiredDocumentDefinition[] {
  const normalizedContractType = normalizePersonnelText(contractType);

  if (normalizedContractType.includes('fonctionnaire')) {
    return [...BASE_REQUIRED_DOCUMENTS, APPOINTMENT_DOCUMENT];
  }

  if (normalizedContractType.includes('contractuel') || normalizedContractType.includes('stagiaire')) {
    return [...BASE_REQUIRED_DOCUMENTS, CONTRACT_DOCUMENT];
  }

  return [...BASE_REQUIRED_DOCUMENTS, APPOINTMENT_DOCUMENT, CONTRACT_DOCUMENT];
}

export function findDocumentByType(type: string, documents: AgentDocument[]): AgentDocument | null {
  const normalizedType = normalizePersonnelText(type);
  return documents.find((item) => normalizePersonnelText(item.type) === normalizedType) || null;
}

export function parseDocumentExpiry(rawDate: string | undefined): { isoDate: string; daysUntilExpiry: number | null } {
  const value = String(rawDate || '').trim();
  if (!value) {
    return { isoDate: '', daysUntilExpiry: null };
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return { isoDate: value, daysUntilExpiry: null };
  }

  const expiryDate = new Date(parsed);
  expiryDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    isoDate: expiryDate.toISOString().slice(0, 10),
    daysUntilExpiry: Math.floor((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
  };
}

export function evaluateDocumentComplianceItem(
  type: string,
  required: boolean,
  documents: AgentDocument[]
): DocumentComplianceItem {
  const document = findDocumentByType(type, documents);
  const label = String(type || '').trim() || 'Document';
  const hasReference = !!String(document?.reference || '').trim();
  const hasUploadedFile = !!String(document?.fileDataUrl || '').trim();
  const normalizedStatus = normalizePersonnelText(document?.status || '');
  const expiry = parseDocumentExpiry(document?.expiresAt);

  if (!document || (!hasReference && !hasUploadedFile)) {
    return {
      type,
      label,
      required,
      status: 'manquant',
      message: required ? `${label}: pièce obligatoire manquante` : `${label}: document non renseigné`,
      badgeClass: required ? 'bg-danger-transparent text-danger' : 'bg-light text-muted',
      document: document || null,
    };
  }

  if (
    normalizedStatus.includes('expire') ||
    normalizedStatus.includes('expir') ||
    (expiry.daysUntilExpiry !== null && expiry.daysUntilExpiry < 0)
  ) {
    return {
      type,
      label,
      required,
      status: 'expire',
      message: expiry.isoDate ? `${label}: expiré depuis ${expiry.isoDate}` : `${label}: document expiré`,
      badgeClass: 'bg-danger-transparent text-danger',
      document,
    };
  }

  if (
    normalizedStatus.includes('renouvel') ||
    normalizedStatus.includes('invalide') ||
    normalizedStatus.includes('rejete') ||
    normalizedStatus.includes('incomplet') ||
    (expiry.daysUntilExpiry !== null && expiry.daysUntilExpiry <= DOCUMENT_EXPIRY_WARNING_DAYS)
  ) {
    return {
      type,
      label,
      required,
      status: 'a_renouveler',
      message: expiry.isoDate ? `${label}: à renouveler avant ${expiry.isoDate}` : `${label}: renouvellement requis`,
      badgeClass: 'bg-warning-transparent text-warning',
      document,
    };
  }

  return {
    type,
    label,
    required,
    status: 'conforme',
    message: expiry.isoDate ? `${label}: conforme jusqu'au ${expiry.isoDate}` : `${label}: conforme`,
    badgeClass: 'bg-success-transparent text-success',
    document,
  };
}

export function buildDocumentComplianceItems(
  documents: AgentDocument[],
  contractType: string
): DocumentComplianceItem[] {
  return getRequiredDocumentDefinitions(contractType).map((definition) =>
    evaluateDocumentComplianceItem(definition.type, true, documents)
  );
}

export function summarizeDocumentCompliance(
  documents: AgentDocument[],
  contractType: string
): AgentDocumentComplianceSummary {
  const items = buildDocumentComplianceItems(documents, contractType);
  const requiredItems = items.filter((item) => item.required);
  const missingItems = requiredItems.filter((item) => item.status === 'manquant');
  const expiredItems = requiredItems.filter((item) => item.status === 'expire');
  const expiringSoonItems = requiredItems.filter((item) => item.status === 'a_renouveler');

  return {
    items,
    requiredCount: requiredItems.length,
    compliantCount: requiredItems.filter((item) => item.status === 'conforme').length,
    missingCount: missingItems.length,
    expiredCount: expiredItems.length,
    expiringSoonCount: expiringSoonItems.length,
    hasAlerts: [...missingItems, ...expiredItems, ...expiringSoonItems].length > 0,
    alertMessages: [...missingItems, ...expiredItems, ...expiringSoonItems].map((item) => item.message),
  };
}

export function documentComplianceStatusLabel(status: DocumentComplianceStatus): string {
  switch (status) {
    case 'conforme':
      return 'Conforme';
    case 'a_renouveler':
      return 'À renouveler';
    case 'expire':
      return 'Expiré';
    case 'manquant':
    default:
      return 'Manquant';
  }
}
