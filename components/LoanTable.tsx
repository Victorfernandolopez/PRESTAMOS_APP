import React, { useState } from 'react';
import { Prestamo, EstadoPago } from '../types';
import RenovationModal from './RenovationModal';
import { formatDateISO } from '../utils/date';
import {
  esMoroso,
  obtenerCalculosPunitorios,
  cobrarPrestamoAPI,
  agregarMontoAPI,
  renovarPrestamoAPI
} from '../services/loanService';

const API_URL = "http://127.0.0.1:8000";

/* =============================
   PROPS
============================= */

/**
 * LoanTableProps
 *
 * prestamos:
 *  - Lista completa de préstamos ya cargados desde el backend
 *
 * onUpdate:
 *  - Callback hacia App.tsx
 *  - Se usa cuando el backend devuelve un préstamo actualizado
 * 
 * onRefresh:
 *  - Callback para refrescar la lista completa desde el backend
 *  - Se usa después de una renovación exitosa
 */
interface LoanTableProps {
  prestamos: Prestamo[];
  onUpdate: (id: number, prestamo: Prestamo) => void;
  onRefresh: () => void;
}

/* =============================
   COMPONENTE
============================= */

const LoanTable: React.FC<LoanTableProps> = ({
  prestamos,
  onUpdate,
  onRefresh
}) => {

  /* =============================
     ESTADOS
  ============================== */

  // Filtro actual de la tabla
  const [filter, setFilter] =
    useState<'all' | 'morosos' | 'pagados'>('all');

  // Préstamo seleccionado para agregar monto
  const [prestamoEditar, setPrestamoEditar] =
    useState<Prestamo | null>(null);

  // Préstamo seleccionado para renovar
  const [prestamoRenovar, setPrestamoRenovar] =
    useState<Prestamo | null>(null);

  // Préstamo seleccionado para ver archivos
  const [prestamoArchivos, setPrestamoArchivos] =
    useState<Prestamo | null>(null);

  // Monto extra a agregar
  const [montoExtra, setMontoExtra] = useState(0);

  /* =============================
     FILTRO
  ============================== */

  const filtered = prestamos.filter(p => {
    if (filter === 'morosos') return esMoroso(p);
    if (filter === 'pagados') return p.estado_pago === EstadoPago.SI;
    return true;
  });

  /* =============================
     HELPERS
  ============================== */

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(val);

  /* =============================
     ACCIONES
  ============================== */

  /**
   * Marca el préstamo como cobrado
   */
  const handleMarcarPagado = async (
    prestamo: Prestamo,
    montoFinal: number
  ) => {
    try {
      const actualizado = await cobrarPrestamoAPI(
        prestamo.id,
        montoFinal
      );

      // Avisamos a App.tsx que actualice el estado global
      onUpdate(prestamo.id, actualizado);
    } catch {
      alert('Error al cobrar el préstamo');
    }
  };

  /**
   * Confirma el agregado de monto extra
   */
  const confirmarAgregarMonto = async () => {
    if (!prestamoEditar || montoExtra <= 0) return;

    try {
      const actualizado = await agregarMontoAPI(
        prestamoEditar.id,
        montoExtra
      );

      onUpdate(prestamoEditar.id, actualizado);
      setPrestamoEditar(null);
      setMontoExtra(0);
    } catch {
      alert('Error al agregar monto');
    }
  };

  /**
   * Callback cuando se completa la renovación
   */
  const handleRenovacionExitosa = (nuevoPrestamo: Prestamo) => {
    // Limpiar modal
    setPrestamoRenovar(null);

    // Refrescar la lista completa desde el backend
    // (no asumir valores locales)
    onRefresh();
  };

  /* =============================
     RENDER
  ============================== */

  return (
    <div className="space-y-4">

      {/* =============================
         FILTROS
      ============================== */}
      <div className="flex gap-2">
        {(['all', 'morosos', 'pagados'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* =============================
         TABLA
      ============================== */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Creación</th>
              <th className="px-6 py-4">Monto</th>
              <th className="px-6 py-4">Vencimiento</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Acción</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filtered.map(p => {
              const moroso = esMoroso(p);
              const { diasAtraso, totalActualizado } =
                obtenerCalculosPunitorios(p);

              return (
                <tr key={p.id}>
                  {/* CLIENTE */}
                  <td className="px-6 py-4">
                    <div className="font-semibold">
                      {p.cliente.nombre_completo}
                    </div>
                    <div className="text-xs text-slate-500">
                      DNI: {p.cliente.dni}
                    </div>
                    <div className="text-xs text-slate-500">
                      Tel: {p.cliente.telefono}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.cliente.direccion}
                    </div>
                  </td>

                  {/* CREACIÓN */}
                  <td className="px-6 py-4 text-sm">
                    {new Date(p.fecha_creacion).toLocaleDateString('es-AR')}
                  </td>

                  {/* MONTO */}
                  <td className="px-6 py-4">
                    {formatCurrency(p.monto_prestado)}
                  </td>

                  {/* VENCIMIENTO */}
                  <td className="px-6 py-4 text-sm">
                    {formatDateISO(p.fecha_vencimiento)}
                    {diasAtraso > 0 && (
                      <div className="text-rose-600 text-xs font-bold">
                        Atraso {diasAtraso} días
                      </div>
                    )}
                  </td>

                  {/* TOTAL */}
                  <td className="px-6 py-4 font-bold">
                    {formatCurrency(totalActualizado)}
                  </td>

                  {/* ESTADO */}
                  <td className="px-6 py-4">
                    {p.estado_pago === EstadoPago.SI ? (
                      <span className="text-emerald-600 font-bold">
                        PAGADO
                      </span>
                    ) : p.estado_pago === "RENOVADO" ? (
                      <span className="text-amber-600 font-bold">
                        RENOVADO
                      </span>
                    ) : moroso ? (
                      <span className="text-rose-600 font-bold">
                        MOROSO
                      </span>
                    ) : (
                      <span className="text-blue-600 font-bold">
                        PENDIENTE
                      </span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td className="px-6 py-4 text-center space-y-2">
                    {p.estado_pago !== EstadoPago.SI && p.estado_pago !== "RENOVADO" && (
                      <>
                        <button
                          onClick={() =>
                            handleMarcarPagado(p, totalActualizado)
                          }
                          className="w-full bg-slate-900 text-white text-xs py-2 rounded-lg font-bold"
                        >
                          Cobrar
                        </button>

                        <button
                          onClick={() => setPrestamoEditar(p)}
                          className="w-full bg-blue-600 text-white text-xs py-2 rounded-lg font-bold"
                        >
                          Agregar monto
                        </button>

                        <button
                          onClick={() => {
                            setPrestamoRenovar(p);
                          }}
                          className="w-full bg-emerald-600 text-white text-xs py-2 rounded-lg font-bold"
                        >
                          Renovar
                        </button>
                      </>
                    )}

                    {p.estado_pago === "RENOVADO" && (
                      <span className="text-xs text-slate-500 italic">
                        Sin acciones
                      </span>
                    )}

                    {p.cliente.archivos?.length > 0 && (
                      <button
                        onClick={() => setPrestamoArchivos(p)}
                        className="w-full bg-slate-200 text-xs py-2 rounded-lg font-bold"
                      >
                        Ver archivos
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =============================
         MODAL AGREGAR MONTO
      ============================== */}
      {prestamoEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">Agregar monto</h3>

            <input
              type="number"
              className="w-full border p-2 mb-4"
              value={montoExtra}
              onChange={e =>
                setMontoExtra(Number(e.target.value))
              }
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setPrestamoEditar(null)}>
                Cancelar
              </button>
              <button
                onClick={confirmarAgregarMonto}
                className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================
         MODAL RENOVACIÓN
      ============================== */}
      {prestamoRenovar && (
        <RenovationModal
          prestamo={prestamoRenovar}
          onCancel={() => setPrestamoRenovar(null)}
          onSuccess={handleRenovacionExitosa}
        />
      )}

      {/* =============================
          MODAL ARCHIVOS
      ============================== */}
      {prestamoArchivos && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="font-bold mb-4">
              Archivos de {prestamoArchivos.cliente.nombre_completo}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {prestamoArchivos.cliente.archivos?.map(a => (
                <a
                  key={a.id}
                  href={`${API_URL}${a.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border rounded-lg p-3 text-center hover:bg-slate-50"
                >
                  <div className="text-xs font-bold">
                    {a.tipo.replaceAll('_', ' ')}
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    Abrir
                  </div>
                </a>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => setPrestamoArchivos(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoanTable;
