import { $t } from '@/locales';

export function visibilityLabel(value?: string) {
  switch (value) {
    case 'public': return $t('rag.enums.public');
    case 'department': return $t('rag.enums.department');
    case 'post': return $t('rag.enums.post');
    case 'user': return $t('rag.enums.user');
    default: return value || '-';
  }
}

export function operationTypeLabel(value?: string) {
  switch (value) {
    case 'query': return $t('rag.tool.query');
    case 'action': return $t('rag.tool.actionType');
    default: return value || '-';
  }
}

export function authTypeLabel(value?: string) {
  switch (value) {
    case 'none': return $t('rag.enums.authNone');
    case 'api_key': return $t('rag.enums.authApiKey');
    case 'bearer': return $t('rag.enums.authBearer');
    case 'basic': return $t('rag.enums.authBasic');
    case 'hmac_ak_sk': return $t('rag.enums.authHmac');
    default: return value || '-';
  }
}

export function auditActionLabel(value?: string) {
  switch (value) {
    case 'api_call': return $t('rag.enums.apiCall');
    case 'sql_exec': return $t('rag.enums.sqlExec');
    default: return value || '-';
  }
}

export function auditStatusLabel(value?: string) {
  switch (value) {
    case 'pending': return $t('rag.enums.pending');
    case 'confirmed': return $t('rag.audit.confirmed');
    case 'cancelled': return $t('rag.audit.cancelled');
    case 'timeout': return $t('rag.audit.timeout');
    default: return value || '-';
  }
}

export function riskLabel(value?: string) {
  switch (value) {
    case 'low': return $t('rag.enums.riskLow');
    case 'medium': return $t('rag.enums.riskMedium');
    case 'high': return $t('rag.enums.riskHigh');
    default: return value || '-';
  }
}

export function sqlStatusLabel(value?: string) {
  switch (value) {
    case 'success': return $t('rag.quota.success');
    case 'blocked': return $t('rag.quota.blocked');
    case 'failed': return $t('rag.enums.failed');
    default: return value || '-';
  }
}

export function badCaseStatusLabel(value?: string) {
  switch (value) {
    case 'pending': return $t('rag.badCase.pending');
    case 'labeled': return $t('rag.badCase.labeled');
    case 'exported': return $t('rag.badCase.exported');
    default: return value || '-';
  }
}

export function formatKeywords(value?: string) {
  if (!value) return '-';
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(', ') : value;
  } catch {
    return value;
  }
}
