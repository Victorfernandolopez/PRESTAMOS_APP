
import React, { useState } from 'react';
import { Inversor, EstadoInversor } from '../types';
import { calcularInversion } from '../services/loanService';

interface InvestorModuleProps {
  inversores: Inversor[];
  onAdd: (inv: Inversor) => void;
  onUpdate: (id: number) => void;
}


const InvestorModule: React.FC<InvestorModuleProps> = ({ inversores, onAdd, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    monto: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    tasa: 1 // Por defecto 1% diario
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv: Inversor = {
      id: Date.now(),
      nombre: formData.nombre,
      monto_invertido: formData.monto,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      tasa_diaria: formData.tasa / 100,
      estado: EstadoInversor.ACTIVO
    };
    onAdd(newInv);
    setShowForm(false);
    setFormData({
      nombre: '',
      monto: 0,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      tasa: 1
    });
  };

  const totalGestionado = inversores
  .filter(inv => inv.estado === EstadoInversor.ACTIVO)
  .reduce((acc, curr) => acc + curr.monto_invertido, 0);


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Módulo de Inversores</h2>
          <p className="text-slate-500">Gestión de capital externo y rentabilidades diarias.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Inversor
        </button>
      </div>

      {/* Summary Investors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Capital en Gestión</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalGestionado)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Inversores Activos</p>
          <p className="text-2xl font-bold text-slate-900">{inversores.filter(i => i.estado === EstadoInversor.ACTIVO).length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Liquidado</p>
          <p className="text-2xl font-bold text-emerald-600">{inversores.filter(i => i.estado === EstadoInversor.LIQUIDADO).length}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Inversor</th>
                <th className="px-6 py-4 font-bold">Monto Invertido</th>
                <th className="px-6 py-4 font-bold">Días Trabajados</th>
                <th className="px-6 py-4 font-bold">Ganancia Gen.</th>
                <th className="px-6 py-4 font-bold">Total a Devolver</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inversores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                    No hay inversores registrados aún.
                  </td>
                </tr>
              ) : (
                inversores.map(inv => {
                  const { dias, ganancia, totalADevolver } = calcularInversion(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{inv.nombre}</div>
                        <div className="text-[10px] text-slate-400">{inv.fecha_inicio} al {inv.fecha_fin}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(inv.monto_invertido)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                          {dias} días
                        </span>
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-bold">{formatCurrency(ganancia)}</td>
                      <td className="px-6 py-4 font-black text-slate-900">{formatCurrency(totalADevolver)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${inv.estado === EstadoInversor.ACTIVO ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                          {inv.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {inv.estado === EstadoInversor.ACTIVO && (
                          <button 
                            onClick={() => onUpdate(inv.id)}
                            className="text-[10px] bg-slate-900 text-white px-2 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors font-bold"
                          >
                            Liquidar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Nuevo Inversor</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input required className="w-full rounded-lg border-slate-200 border p-2.5 outline-none focus:ring-2 focus:ring-slate-900" 
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Inversión ($)</label>
                <input required type="number" className="w-full rounded-lg border-slate-200 border p-2.5 outline-none focus:ring-2 focus:ring-slate-900" 
                  value={formData.monto || ''} onChange={e => setFormData({...formData, monto: Number(e.target.value)})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
                  <input required type="date" className="w-full rounded-lg border-slate-200 border p-2.5 outline-none focus:ring-2 focus:ring-slate-900" 
                    value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin</label>
                  <input required type="date" className="w-full rounded-lg border-slate-200 border p-2.5 outline-none focus:ring-2 focus:ring-slate-900" 
                    value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tasa Diaria (%)</label>
                <input required type="number" step="0.1" className="w-full rounded-lg border-slate-200 border p-2.5 outline-none focus:ring-2 focus:ring-slate-900" 
                  value={formData.tasa} onChange={e => setFormData({...formData, tasa: Number(e.target.value)})} />
              </div>
              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorModule;
