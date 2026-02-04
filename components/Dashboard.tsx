import React, { useState } from 'react';
import { Prestamo, ResumenGeneral, Cliente } from '../types';
import SummaryCards from './SummaryCards';
import LoanTable from './LoanTable';
import LoanForm from './LoanForm';

interface DashboardProps {
  prestamos: Prestamo[];
  resumen: ResumenGeneral;
  clientes: Cliente[];
  onAdd: (data: {
    cliente_id: number;
    monto_prestado: number;
    total_a_pagar: number;
    fecha_vencimiento: string;
    estado_pago: string;
  }) => void;

  onUpdate: (id: number, updates: Partial<Prestamo>) => void;
  onRefresh: () => void;
  // FASE 2: Props del período
  periodoSeleccionado: string;
  onPeriodoChange: (periodo: string) => void;
  periodosDisponibles: string[];
}

const Dashboard: React.FC<DashboardProps> = ({
  prestamos,
  resumen,
  clientes,
  onAdd,
  onUpdate,
  onRefresh,
  periodoSeleccionado,
  onPeriodoChange,
  periodosDisponibles
}) => {
  const [showForm, setShowForm] = useState(false);

  // Filtrar préstamos por período seleccionado
  const prestamosFiltrados = periodoSeleccionado === 'ALL'
    ? prestamos
    : prestamos.filter(p => p.periodo_origen === periodoSeleccionado);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
          <p className="text-slate-500">
            {periodoSeleccionado === 'ALL'
              ? 'Vista global de todos los períodos'
              : `Período: ${periodoSeleccionado}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
        >
          Nuevo Préstamo
        </button>
      </div>

      {/* FASE 2: Selector de período */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
        <p className="text-sm font-semibold text-slate-700 mb-3">Filtrar por período:</p>
        <div className="flex flex-wrap gap-2">
          {periodosDisponibles.map(periodo => (
            <button
              key={periodo}
              onClick={() => onPeriodoChange(periodo)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                periodoSeleccionado === periodo
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              {periodo === 'ALL' ? '📊 Todos los períodos' : periodo}
            </button>
          ))}
        </div>
      </div>

      <SummaryCards resumen={resumen} />

      <LoanTable prestamos={prestamosFiltrados} onUpdate={onUpdate} onRefresh={onRefresh} />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between">
              <h3 className="font-bold text-lg">Registrar Préstamo</h3>
              <button onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="p-6">
              <LoanForm
                clientes={clientes}
                onAdd={onAdd}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
