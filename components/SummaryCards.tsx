
import React from 'react';
import { ResumenGeneral } from '../types';

interface SummaryCardsProps {
  resumen: ResumenGeneral;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ resumen }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
  };

  const cards = [
    { title: 'Total Prestado', value: formatCurrency(resumen.total_prestado), color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Por Cobrar', value: formatCurrency(resumen.total_por_cobrar), color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Total Cobrado', value: formatCurrency(resumen.total_recuperado), color: 'text-slate-600', bg: 'bg-slate-100' },
    { title: 'Morosos Detectados', value: resumen.cantidad_morosos, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div key={i} className={`${card.bg} rounded-xl p-6 border border-slate-100 shadow-sm transition-transform hover:-translate-y-1`}>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">{card.title}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
