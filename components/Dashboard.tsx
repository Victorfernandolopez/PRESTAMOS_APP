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
}

const Dashboard: React.FC<DashboardProps> = ({
  prestamos,
  resumen,
  clientes,
  onAdd,
  onUpdate,
  onRefresh
}) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2>
          <p className="text-slate-500">
            Bienvenido al administrador privado de préstamos.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
        >
          Nuevo Préstamo
        </button>
      </div>

      <SummaryCards resumen={resumen} />

      <LoanTable prestamos={prestamos} onUpdate={onUpdate} onRefresh={onRefresh} />

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
