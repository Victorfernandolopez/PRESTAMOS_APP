import React, { useState } from 'react';

/* =============================
   TIPOS
============================= */

interface ClienteArchivo {
  id: number;
  tipo: string;
  url: string;
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
  archivos?: ClienteArchivo[];
}

interface ClientModuleProps {
  clientes: Cliente[];
  onClienteCreado: () => void;
  onClienteChange: () => void;
}

/* =============================
   COMPONENTE
============================= */

const ClientModule: React.FC<ClientModuleProps> = ({
  clientes,
  onClienteCreado,
  onClienteChange
}) => {
  const [clienteActivo, setClienteActivo] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    nombre_completo: '',
    dni: '',
    direccion: '',
    telefono: '',
    telefono_respaldo_1: '',
    telefono_respaldo_2: '',
    observaciones: ''
  });

  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoArchivo, setTipoArchivo] = useState('');

  /* =============================
     CREAR CLIENTE
  ============================== */

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('http://127.0.0.1:8000/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    setShowForm(false);
    setForm({
      nombre_completo: '',
      dni: '',
      direccion: '',
      telefono: '',
      telefono_respaldo_1: '',
      telefono_respaldo_2: '',
      observaciones: ''
    });

    onClienteCreado();
  };

  /* =============================
     SUBIR ARCHIVO
  ============================== */

  const subirArchivo = async () => {
    if (!clienteActivo || !archivo || !tipoArchivo) return;

    const formData = new FormData();
    formData.append('file', archivo);

    await fetch(
      `http://127.0.0.1:8000/clientes/${clienteActivo.id}/archivos?tipo=${tipoArchivo}`,
      { method: 'POST', body: formData }
    );

    const res = await fetch(
      `http://127.0.0.1:8000/clientes/${clienteActivo.id}`
    );
    const data = await res.json();

    setClienteActivo(data);
    setArchivo(null);
    setTipoArchivo('');
    onClienteChange();
  };

  /* =============================
     RENDER
  ============================== */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold"
        >
          Nuevo cliente
        </button>
      </div>

      {/* LISTADO */}
      <div className="bg-white rounded-xl border">
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">DNI</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr
                key={c.id}
                className="border-t hover:bg-slate-50 cursor-pointer"
                onClick={async () => {
                  const res = await fetch(
                    `http://127.0.0.1:8000/clientes/${c.id}`
                  );
                  const data = await res.json();
                  setClienteActivo(data);
                }}
              >
                <td className="px-4 py-3 font-semibold">{c.nombre_completo}</td>
                <td className="px-4 py-3">{c.dni}</td>
                <td className="px-4 py-3">{c.telefono}</td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {c.direccion}
                </td>
                <td className="px-4 py-3 text-center text-emerald-600 font-bold">
                  Ver
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* =============================
          MODAL NUEVO CLIENTE
      ============================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form
            onSubmit={submit}
            className="bg-white p-6 rounded-xl w-full max-w-md space-y-3"
          >
            <h3 className="text-lg font-bold">Nuevo cliente</h3>

            {Object.entries(form).map(([k, v]) =>
              k !== 'observaciones' ? (
                <input
                  key={k}
                  required={!k.includes('respaldo')}
                  placeholder={k.replaceAll('_', ' ')}
                  className="w-full border rounded p-2"
                  value={v}
                  onChange={e =>
                    setForm({ ...form, [k]: e.target.value })
                  }
                />
              ) : (
                <textarea
                  key={k}
                  placeholder="Observaciones"
                  className="w-full border rounded p-2"
                  value={v}
                  onChange={e =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                />
              )
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button className="bg-slate-900 text-white px-4 py-2 rounded font-bold">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =============================
          MODAL DETALLE CLIENTE
      ============================== */}
      {clienteActivo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl space-y-4">

            <h3 className="text-xl font-bold">Detalle del cliente</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><b>Nombre:</b> {clienteActivo.nombre_completo}</div>
              <div><b>DNI:</b> {clienteActivo.dni}</div>
              <div><b>Teléfono:</b> {clienteActivo.telefono}</div>
              <div><b>Dirección:</b> {clienteActivo.direccion}</div>
              <div><b>Resp. 1:</b> {clienteActivo.telefono_respaldo_1 || '-'}</div>
              <div><b>Resp. 2:</b> {clienteActivo.telefono_respaldo_2 || '-'}</div>
            </div>

            <div>
              <b>Observaciones:</b>
              <p className="text-slate-600 text-sm">
                {clienteActivo.observaciones || 'Sin observaciones'}
              </p>
            </div>
            {/* ARCHIVOS DEL CLIENTE */}
            {clienteActivo.archivos && clienteActivo.archivos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold">Archivos</h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {clienteActivo.archivos.map(a => (
                    <a
                      key={a.id}
                      href={`http://127.0.0.1:8000${a.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border rounded-lg p-2 hover:bg-slate-50"
                    >
                      <img
                        src={`http://127.0.0.1:8000${a.url}`}
                        alt={a.tipo}
                        className="w-full h-32 object-cover rounded"
                      />
                      <div className="text-xs font-semibold text-center mt-1">
                        {a.tipo.replaceAll('_', ' ')}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <select
                className="w-full border p-2 rounded"
                value={tipoArchivo}
                onChange={e => setTipoArchivo(e.target.value)}
              >
                <option value="">Tipo</option>
                <option value="dni_frente">DNI Frente</option>
                <option value="dni_dorso">DNI Dorso</option>
                <option value="selfie_dni">Selfie con DNI</option>
                <option value="comprobante">Comprobante</option>
              </select>

              <input
                type="file"
                onChange={e => setArchivo(e.target.files?.[0] || null)}
              />

              <div className="flex justify-end gap-2">
                <button onClick={() => setClienteActivo(null)}>Cerrar</button>
                <button
                  onClick={subirArchivo}
                  className="bg-emerald-600 text-white px-4 py-2 rounded font-bold"
                >
                  Subir
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ClientModule;
