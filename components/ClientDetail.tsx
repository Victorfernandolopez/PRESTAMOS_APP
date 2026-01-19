import React from 'react';

interface Archivo {
  id: number;
  tipo: string;
  ruta: string;
}

interface Prestamo {
  id: number;
  monto_prestado: number;
  total_a_pagar: number;
  estado_pago: string;
  fecha_vencimiento: string;
}

interface Cliente {
  id: number;
  nombre_completo: string;
  dni: string;
  direccion: string;
  telefono: string;
  telefono_respaldo_1?: string;
  telefono_respaldo_2?: string;
  observaciones?: string;
  archivos: Archivo[];
  prestamos: Prestamo[];
}

const ClientDetail = ({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl space-y-4">
        <h3 className="text-xl font-bold">{cliente.nombre_completo}</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><b>DNI:</b> {cliente.dni}</div>
          <div><b>Tel:</b> {cliente.telefono}</div>
          <div><b>Dirección:</b> {cliente.direccion}</div>
          <div><b>Obs:</b> {cliente.observaciones || '-'}</div>
        </div>

        <div>
          <h4 className="font-bold mt-4">Archivos</h4>
          <ul className="list-disc ml-6">
            {cliente.archivos.map(a => (
              <li key={a.id}>{a.tipo}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold mt-4">Préstamos</h4>
          <ul className="list-disc ml-6">
            {cliente.prestamos.map(p => (
              <li key={p.id}>
                ${p.monto_prestado} → {p.estado_pago} (vence {p.fecha_vencimiento})
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
