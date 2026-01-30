import { Prestamo, PlazoDias, EstadoPago, Inversor } from '../types';
import { calcularTotalAPagarNuevo } from '../utils/loanCalculations';

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
export const calcularPrestamo = (
  monto: number,
  plazo: PlazoDias,
  fechaInicio: string
): Partial<Prestamo> => {
  const total = calcularTotalAPagarNuevo(monto, plazo);

  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + plazo);

  return {
    monto_prestado: monto,
    total_a_pagar: total,
    fecha_vencimiento: fecha.toISOString().split('T')[0],
    estado_pago: EstadoPago.NULL
  };
};

/**
 * Determina si un préstamo está en mora
 */
export const esMoroso = (prestamo: Prestamo): boolean => {
  // Usar el campo provisto por el backend
  return Boolean(prestamo.es_moroso);
};

/**
 * Determina si un préstamo está pendiente (sin vencer y sin pagar)
 * 
 * Criterios:
 * - estado_pago === "PENDIENTE"
 * - fecha_vencimiento >= fecha actual (no vencido)
 */
export const isPendiente = (prestamo: Prestamo): boolean => {
  // Pendiente si el estado es PENDIENTE y el backend no lo marca como moroso
  if ((prestamo.estado_pago as string) !== "PENDIENTE") return false;
  return !Boolean(prestamo.es_moroso);
};

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
  // Usar `dias_atraso` provisto por el backend (evita cálculos de fechas en frontend)
  const diasAtraso = Math.max(0, Number(prestamo.dias_atraso ?? 0));

  const punitorio = prestamo.total_a_pagar * TASA_PUNITORIA_DIARIA * diasAtraso;

  return {
    diasAtraso,
    punitorio,
    totalActualizado: prestamo.total_a_pagar + punitorio
  };
};

/* ==============================
   INVERSORES – LÓGICA LOCAL
================================ */

/**
 * Calcula ganancia total de un inversor
 */
export const calcularInversion = (inversor: Inversor) => {
  const inicio = new Date(inversor.fecha_inicio);
  const fin = new Date(inversor.fecha_fin);

  const dias = Math.max(
    0,
    Math.ceil((fin.getTime() - inicio.getTime()) / 86400000)
  );

  const ganancia = inversor.monto_invertido * inversor.tasa_diaria * dias;

  return {
    dias,
    ganancia,
    totalADevolver: inversor.monto_invertido + ganancia
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
  data: Omit<Prestamo, 'id'>
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
  nuevo_total_a_pagar: number,
  nueva_fecha_vencimiento: string
): Promise<Prestamo> {
  const res = await fetch(`${API_URL}/prestamos/${id}/renovar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      monto_renovado,
      nuevo_total_a_pagar,
      nueva_fecha_vencimiento
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
