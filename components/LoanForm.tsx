import React, { useState } from 'react';
// import { PlazoDias } from '../types';

/* =============================
   TIPOS
============================= */

/**
 * Cliente mínimo necesario para crear un préstamo.
 * 👉 No traemos todo el cliente, solo lo que se usa acá.
 */
interface Cliente {
  id: number;
  nombre_completo: string;
  dni: string;
}

/**
 * Props del formulario de préstamo.
 *
 * onAdd:
 *  - Se ejecuta cuando el préstamo ya está listo
 *  - App.tsx se encarga de llamar al backend
 *
 * onClose:
 *  - Cierra el modal
 */
interface LoanFormProps {
  clientes: Cliente[];
  prestamos: any[]; // Prestamos completos para validación de bloqueo
  onAdd: (data: {
    cliente_id: number;
    monto_prestado: number;
    total_a_pagar: number;
    fecha_vencimiento: string;
    estado_pago: string;
  }) => void;
  onClose: () => void;
}

/* =============================
   COMPONENTE
============================= */

const LoanForm: React.FC<LoanFormProps> = ({
  clientes,
  prestamos,
  onAdd,
  onClose
}) => {

  // Cliente seleccionado
  const [clienteId, setClienteId] = useState<number | ''>('');

  // Monto del préstamo
  const [monto, setMonto] = useState(0);

  // Plazo libre (días)
  const [plazo, setPlazo] = useState<number>(0);

  // Tasa de interés libre (%)
  const [tasa, setTasa] = useState<number>(0);

  // Fecha de inicio del préstamo
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Verificar si el cliente está bloqueado
  const [clienteBloqueado, setClienteBloqueado] = useState(false);

  // Estado para mensaje de error backend
  const [backendError, setBackendError] = useState<string | null>(null);

  /* =============================
     SUBMIT
  ============================== */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError(null);
    // Validaciones UX
    if (!clienteId || monto <= 0) return;
    if (plazo <= 0) {
      setBackendError('El plazo debe ser mayor a 0');
      return;
    }
    if (tasa <= 0) {
      setBackendError('La tasa de interés debe ser mayor a 0');
      return;
    }
    try {
      await onAdd({
        cliente_id: clienteId,
        monto_prestado: monto,
        plazo: plazo,
        tasa_interes: tasa / 100, // Enviar como decimal
        fecha_inicio: fecha,
        estado_pago: 'PENDIENTE'
      } as any);
      // Si no hay error, cerrar modal
      onClose();
    } catch (err: any) {
      // Si el backend devuelve error, mostrar mensaje
      if (err && err.detail) setBackendError(err.detail);
      else setBackendError('Cliente BLOCKEADO por falta de pago.');
    }
  };

  /* =============================
     RENDER
  ============================== */

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* CLIENTE */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Cliente
        </label>
        <select
          required
          className="w-full border rounded-lg p-2"
          value={clienteId}
          onChange={e => setClienteId(Number(e.target.value))}
        >
          <option value="">Seleccionar cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre_completo} — DNI {c.dni}
            </option>
          ))}
        </select>
      </div>

      {/* MONTO */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Monto
        </label>
        <input
          required
          type="number"
          min={5000}
          className="w-full border rounded-lg p-2"
          value={monto || ''}
          onChange={e => setMonto(Number(e.target.value))}
        />
      </div>

      {/* PLAZO */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Plazo (días)
        </label>
        <input
          required
          type="number"
          min={1}
          className="w-full border rounded-lg p-2"
          value={plazo || ''}
          onChange={e => setPlazo(Number(e.target.value))}
        />
      </div>

      {/* TASA DE INTERÉS */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Tasa de interés (%)
        </label>
        <input
          required
          type="number"
          min={0.01}
          step={0.01}
          className="w-full border rounded-lg p-2"
          value={tasa || ''}
          onChange={e => setTasa(Number(e.target.value))}
        />
      </div>

      {/* FECHA */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Fecha del préstamo
        </label>
        <input
          type="date"
          className="w-full border rounded-lg p-2"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
        />
      </div>

      {/* BLOQUEO UX */}
      {clienteBloqueado && (
        <div className="bg-rose-100 border border-rose-400 text-rose-700 rounded-lg p-3 text-sm mb-2">
          Este cliente tiene un préstamo <b>BLOQUEADO</b> y no puede recibir nuevos préstamos.
        </div>
      )}

      {/* ERROR BACKEND */}
      {backendError && (
        <div className="bg-rose-100 border border-rose-400 text-rose-700 rounded-lg p-3 text-sm mb-2">
          {backendError}
        </div>
      )}

      {/* BOTONES */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold"
          disabled={clienteBloqueado}
        >
          Crear préstamo
        </button>
      </div>
    </form>
  );
};

export default LoanForm;
