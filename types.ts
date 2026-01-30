/* =========================
   ENUMS GENERALES
   ========================= */

/**
 * Plazos estándar en días para préstamos
 * (no obligatorio usarlo todavía, pero queda listo)
 */
export enum PlazoDias {
  SIETE = 7,
  CATORCE = 14,
  TREINTA = 30
}

/**
 * Estado de pago de un préstamo
 */
export enum EstadoPago {
  SI = 'SI',
  NO = 'NO',
  NULL = 'NULL'
}

/**
 * Estado de un inversor
 */
export enum EstadoInversor {
  ACTIVO = 'ACTIVO',
  LIQUIDADO = 'LIQUIDADO'
}

/* =========================
   CLIENTES
   ========================= */

/**
 * Archivo asociado a un cliente
 * (DNI frente, dorso, selfie, comprobante, etc.)
 */
export interface ClienteArchivo {
  id: number;
  tipo: string;
  url: string; // ruta o URL al archivo
}

/**
 * Cliente del sistema
 */
export interface Cliente {
  id: number;
  nombre_completo: string;
  dni: string;
  direccion: string;
  telefono: string;

  // Teléfonos opcionales
  telefono_respaldo_1?: string;
  telefono_respaldo_2?: string;

  observaciones?: string;

  // Archivos asociados (opcional según endpoint)
  archivos?: ClienteArchivo[];
}

/* =========================
   PRÉSTAMOS
   ========================= */

/**
 * Préstamo otorgado a un cliente
 */
export interface Prestamo {
  id: number;

  // Relación con cliente
  cliente_id: number;
  cliente: Cliente;

  monto_prestado: number;
  total_a_pagar: number;

  // Métricas de cobro desde el backend
  total_cobrado: number;
  por_cobrar: number;

  fecha_creacion: string;
  fecha_vencimiento: string;

  estado_pago: EstadoPago;

  // Datos solo cuando está cobrado
  fecha_pago?: string;
  monto_cobrado_final?: number;
  
  // Campos calculados en backend
  dias_atraso?: number;
  es_moroso?: boolean;
  punitorio_diario?: number;
  punitorio_total?: number;
  total_actualizado?: number;
}

/* =========================
   RESUMEN / DASHBOARD
   ========================= */

/**
 * Resumen general mostrado en el dashboard
 */
export interface ResumenGeneral {
  total_prestado: number;
  total_por_cobrar: number;
  total_recuperado: number;

  cantidad_prestamos: number;
  cantidad_morosos: number;
}

/* =========================
   INVERSORES
   ========================= */

/**
 * Inversor del sistema
 */
export interface Inversor {
  id: number;
  nombre: string;

  monto_invertido: number;

  fecha_inicio: string;
  fecha_fin: string;

  // Ej: 0.01 = 1% diario
  tasa_diaria: number;

  estado: EstadoInversor;
  dias_trabajados?: number;
  ganancia?: number;
  total_a_devolver?: number;
}
