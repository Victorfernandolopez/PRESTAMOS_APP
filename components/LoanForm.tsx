import React, { useState } from 'react';
import { PlazoDias } from '../types';
import { calcularPrestamo } from '../services/loanService';

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
  onAdd,
  onClose
}) => {

  // Cliente seleccionado
  const [clienteId, setClienteId] = useState<number | ''>('');

  // Monto del préstamo
  const [monto, setMonto] = useState(0);

  // Plazo (7 / 14 / 30 días)
  const [plazo, setPlazo] = useState<PlazoDias>(PlazoDias.SIETE);

  // Fecha de inicio del préstamo
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  );

  /* =============================
     SUBMIT
  ============================== */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!clienteId || monto <= 0) return;

    // Cálculo centralizado (intereses, vencimiento, etc.)
    const calculado = calcularPrestamo(monto, plazo, fecha);

    // Se envía SOLO lo que el backend espera
    onAdd({
      cliente_id: clienteId,
      monto_prestado: monto,
      total_a_pagar: calculado.total_a_pagar!,
      fecha_vencimiento: calculado.fecha_vencimiento!,
      estado_pago: 'PENDIENTE'
    });

    // Cerrar modal
    onClose();
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
          Plazo
        </label>
        <select
          className="w-full border rounded-lg p-2"
          value={plazo}
          onChange={e =>
            setPlazo(Number(e.target.value) as PlazoDias)
          }
        >
          <option value={PlazoDias.SIETE}>
            7 días (20%)
          </option>
          <option value={PlazoDias.CATORCE}>
            14 días (40%)
          </option>
          <option value={PlazoDias.TREINTA}>
            30 días (100%)
          </option>
        </select>
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

      {/* BOTONES */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          Crear préstamo
        </button>
      </div>
    </form>
  );
};

export default LoanForm;
