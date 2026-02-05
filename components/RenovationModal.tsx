import React, { useState, useMemo } from 'react';
import { Prestamo } from '../types';
import { renovarPrestamoAPI } from '../services/loanService';
 

/* =============================
   PROPS
============================= */

interface RenovationModalProps {
  prestamo: Prestamo;
  onCancel: () => void;
  onSuccess: (nuevoPrestamo: Prestamo) => void;
}

/* =============================
   COMPONENTE
============================= */

const RenovationModal: React.FC<RenovationModalProps> = ({
  prestamo,
  onCancel,
  onSuccess
}) => {
  /* =============================
     ESTADOS
  ============================== */

  // Monto a renovar (por defecto, el capital)
  const [montoRenovado, setMontoRenovado] = useState<number>(
    prestamo.monto_prestado
  );

  // Plazo libre (días)
  const [plazo, setPlazo] = useState<number>(prestamo.plazo ?? 0);

  // Tasa de interés libre (%)
  const [tasa, setTasa] = useState<number>(prestamo.tasa_interes ? prestamo.tasa_interes * 100 : 0);

  // Loading state para el botón
  const [isLoading, setIsLoading] = useState(false);

  // Cálculo local de total a pagar (preview informativo)
  const totalAPagar = useMemo(() => {
    if (montoRenovado > 0 && tasa > 0) {
      return montoRenovado * (1 + tasa / 100);
    }
    return 0;
  }, [montoRenovado, tasa]);

  /* =============================
     HELPERS
  ============================== */

  /**
   * Formatea moneda
   */
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(val);

  

  /* =============================
     HANDLERS
  ============================== */

  const handleConfirm = async () => {
    // Validaciones
    if (montoRenovado <= 0) {
      alert('El monto a renovar debe ser mayor a 0');
      return;
    }
    if (montoRenovado > prestamo.por_cobrar) {
      alert('El monto a renovar no puede exceder lo pendiente de cobrar');
      return;
    }
    if (plazo <= 0) {
      alert('El plazo debe ser mayor a 0');
      return;
    }
    if (tasa <= 0) {
      alert('La tasa de interés debe ser mayor a 0');
      return;
    }
    setIsLoading(true);
    try {
      // Hacer el POST al backend enviando monto, plazo y tasa_interes
      const nuevoPrestamo = await renovarPrestamoAPI(
        prestamo.id,
        montoRenovado,
        plazo,
        tasa / 100 // Enviar como decimal
      );
      onSuccess(nuevoPrestamo);
    } catch (error) {
      console.error('Error renovando préstamo:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* =============================
     RENDER
  ============================== */

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        {/* HEADER */}
        <h3 className="font-bold text-lg mb-4">Renovar préstamo</h3>

        {/* CONTENIDO */}
        <div className="space-y-4 mb-6">
          {/* Cliente - Solo lectura */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Cliente
            </label>
            <div className="bg-slate-100 p-2 rounded text-slate-700">
              {prestamo.cliente.nombre_completo}
            </div>
          </div>

          {/* Monto a renovar */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Monto a renovar
              <span className="text-slate-500 font-normal text-xs ml-2">
                (máx: {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS'
                }).format(prestamo.por_cobrar)})
              </span>
            </label>
            <input
              type="number"
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
              value={montoRenovado}
              onChange={e => setMontoRenovado(Number(e.target.value))}
              step="0.01"
              min="0"
              disabled={isLoading}
            />
          </div>

          {/* Plazo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Plazo (días)
            </label>
            <input
              type="number"
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
              value={plazo || ''}
              onChange={e => setPlazo(Number(e.target.value))}
              min={1}
              disabled={isLoading}
            />
          </div>

          {/* Tasa de interés */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Tasa de interés (%)
            </label>
            <input
              type="number"
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-slate-100"
              value={tasa || ''}
              onChange={e => setTasa(Number(e.target.value))}
              min={0.01}
              step={0.01}
              disabled={isLoading}
            />
          </div>

          {/* Total a pagar - Solo lectura */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Total a pagar
            </label>
            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-700 font-bold">
              {formatCurrency(totalAPagar)}
            </div>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Procesando...' : 'Confirmar renovación'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RenovationModal;
