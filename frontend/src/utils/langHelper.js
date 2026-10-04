/**
 * Helper to retrieve bilingual text with automatic Tamil -> English fallback.
 * If language is 'ta' and item[field + 'Ta'] exists and is non-empty, returns Tamil text.
 * Otherwise falls back to English item[field].
 */
export const getLangText = (item, field, currentLang) => {
  if (!item) return '';

  if (currentLang === 'ta') {
    const taField = field + 'Ta';
    if (item[taField] && item[taField].trim() !== '') {
      return item[taField];
    }
  }

  return item[field] || '';
};
