import { Prestamo, PlazoDias, EstadoPago, EstadoPrestamo, Inversor } from '../types';

/* ==============================
   CONFIGURACIÓN GENERAL API
================================ */

/**
 * URL base del backend FastAPI
 * (en producción esto debería ir a una variable de entorno)
 */
const API_URL = 'http://127.0.0.1:8000';

/* ==============================
   REGLAS DE NEGOCIO – INTERESES
================================ */

/**
 * Intereses por plazo (valores relativos)
 * Ej: 0.20 = 20%
 * 
 * ⚠️ DEPRECATED: Usar calcularTotalAPagarNuevo() de utils/loanCalculations.ts
 */
export const INTERESES = {
  [PlazoDias.SIETE]: 0.20,
  [PlazoDias.CATORCE]: 0.40,
  [PlazoDias.TREINTA]: 1.00
};

/**
 * Tasa punitoria diaria (5% diario)
 */
export const TASA_PUNITORIA_DIARIA = 0.05;

/* ==============================
   PRESTAMOS – LÓGICA LOCAL
================================ */

/**
 * Calcula los datos de un préstamo antes de enviarlo al backend.
 * ⚠️ No persiste nada, solo devuelve un objeto parcial.
 */
// Nota: cálculos financieros (total_a_pagar, vencimiento, punitorios, ganancias)
// son realizados en el backend. El frontend solo renderiza los valores devueltos.

/**
 * Calcula punitorios y total actualizado de un préstamo
 */
export const obtenerCalculosPunitorios = (prestamo: Prestamo) => {
  // Si ya está cobrado, no se recalcula mora
  if (prestamo.estado_pago === EstadoPago.SI) {
    const totalEfectivo =
      prestamo.monto_cobrado_final ?? prestamo.total_a_pagar;

    return {
      diasAtraso: 0,
      punitorio: totalEfectivo - prestamo.total_a_pagar,
      totalActualizado: totalEfectivo
    };
  }
  // Usar los campos calculados por el backend
  const diasAtraso = Math.max(0, Number(prestamo.dias_atraso ?? 0));
  const punitorio = Number(prestamo.punitorio_total ?? 0);
  const totalActualizado = Number(prestamo.total_actualizado ?? prestamo.total_a_pagar);

  return {
    diasAtraso,
    punitorio,
    totalActualizado
  };
};

/* ==============================
   INVERSORES – LÓGICA LOCAL
================================ */

/**
 * Calcula ganancia total de un inversor
 */
export const calcularInversion = (inversor: Inversor) => {
  // Usar campos provistos por el backend
  const dias = Math.max(0, Number(inversor.dias_trabajados ?? 0));
  const ganancia = Number(inversor.ganancia ?? 0);
  const totalADevolver = Number(inversor.total_a_devolver ?? (inversor.monto_invertido + ganancia));

  return {
    dias,
    ganancia,
    totalADevolver
  };
};

/* ==============================
   API BACKEND – PRESTAMOS
================================ */

/**
 * Obtener todos los préstamos
 */
export async function fetchPrestamos(): Promise<Prestamo[]> {
  const res = await fetch(`${API_URL}/prestamos`);
  if (!res.ok) throw new Error('Error al obtener préstamos');
  return res.json();
}

/**
 * Crear un préstamo en backend
 */
export async function crearPrestamoAPI(
  data: any
): Promise<Prestamo> {
  const res = await fetch(`${API_URL}/prestamos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error('Error al crear préstamo');
  return res.json();
}

/**
 * Cobrar un préstamo
 */
export async function cobrarPrestamoAPI(
  id: number,
  monto_cobrado_final: number
): Promise<Prestamo> {
  const res = await fetch(`${API_URL}/prestamos/${id}/cobrar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto_cobrado_final })
  });

  if (!res.ok) throw new Error('Error cobrando préstamo');
  return res.json();
}

/**
 * Agregar monto a un préstamo existente
 */
export async function agregarMontoAPI(
  id: number,
  monto_extra: number
): Promise<Prestamo> {
  const res = await fetch(`${API_URL}/prestamos/${id}/agregar-monto`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monto_extra })
  });

  if (!res.ok) throw new Error('Error agregando monto');
  return res.json();
}

/**
 * Renovar un préstamo existente
 */
export async function renovarPrestamoAPI(
  id: number,
  monto_renovado: number,
  plazo: number
): Promise<Prestamo> {
  const res = await fetch(`${API_URL}/prestamos/${id}/renovar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monto_renovado,
      plazo
    })
  });

  if (!res.ok) throw new Error('Error renovando préstamo');
  return res.json();
}

/* ==============================
   API BACKEND – INVERSORES
================================ */

/**
 * Obtener inversores
 */
export async function fetchInversores(): Promise<Inversor[]> {
  const res = await fetch(`${API_URL}/inversores`);
  if (!res.ok) throw new Error('Error al obtener inversores');
  return res.json();
}

/**
 * Crear inversor
 */
export async function crearInversorAPI(
  data: Omit<Inversor, 'id'>
): Promise<Inversor> {
  const res = await fetch(`${API_URL}/inversores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) throw new Error('Error al crear inversor');
  return res.json();
}

/**
 * Liquidar inversor
 */
export async function liquidarInversorAPI(id: number): Promise<Inversor> {
  const res = await fetch(`${API_URL}/inversores/${id}/liquidar`, {
    method: 'PUT'
  });

  if (!res.ok) throw new Error('Error liquidando inversor');
  return res.json();
}
