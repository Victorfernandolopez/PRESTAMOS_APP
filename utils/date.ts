/**
 * Formatea una fecha ISO (YYYY-MM-DD) al formato DD/MM/YYYY
 * Sin usar librerías externas
 * @param isoDate - Fecha en formato ISO (YYYY-MM-DD) o null/undefined
 * @returns Fecha formateada como DD/MM/YYYY o '-' si es null/undefined
 * @example
 * formatDateISO('2026-01-27') // '27/01/2026'
 * formatDateISO(null) // '-'
 */
export const formatDateISO = (isoDate: string | null | undefined): string => {
  // Manejar null o undefined
  if (!isoDate) {
    return '-';
  }

  // Validar formato ISO básico
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return '-';
  }

  // Extraer componentes sin modificar el original
  const [year, month, day] = isoDate.split('-');

  // Retornar en formato DD/MM/YYYY
  return `${day}/${month}/${year}`;
};
