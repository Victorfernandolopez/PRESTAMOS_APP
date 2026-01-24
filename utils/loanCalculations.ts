/**
 * Utilidades para cálculos de préstamos
 * Centraliza lógica de tasas e intereses
 */

/**
 * Tasas de interés por plazo
 * Se aplican tanto en creación como en renovación de préstamos
 * Ej: 7 días → 20% → monto * 1.2
 */
export const INTERESES_TASA = {
  7: 0.20,    // 20%
  14: 0.40,   // 40%
  30: 1.00    // 100%
};

/**
 * Calcula el total a pagar de un préstamo
 * basado en monto y plazo usando tasas de interés.
 * 
 * Se usa para:
 * - Creación de préstamos nuevos
 * - Renovación de préstamos
 * 
 * @param monto - Monto del préstamo o monto a renovar
 * @param plazo - Plazo en días (7, 14, 30)
 * @returns Total a pagar
 * 
 * @example
 * calcularTotalAPagarNuevo(1000, 7)  // 1000 * (1 + 0.20) = 1200
 * calcularTotalAPagarNuevo(1000, 14) // 1000 * (1 + 0.40) = 1400
 * calcularTotalAPagarNuevo(1000, 30) // 1000 * (1 + 1.00) = 2000
 */
export const calcularTotalAPagarNuevo = (
  monto: number,
  plazo: 7 | 14 | 30
): number => {
  const tasa = INTERESES_TASA[plazo] ?? 0;
  return monto * (1 + tasa);
};
