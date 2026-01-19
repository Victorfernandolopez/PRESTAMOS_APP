import React, { useState, useEffect } from 'react';
import {
  Prestamo,
  EstadoPago,
  ResumenGeneral,
  Inversor,
  Cliente
} from './types';

import Dashboard from './components/Dashboard';
import InvestorModule from './components/InvestorModule';
import ClientModule from './components/ClientModule';

import {
  obtenerCalculosPunitorios,
  fetchPrestamos,
  crearPrestamoAPI
} from './services/loanService';

import {
  fetchInversores,
  crearInversorAPI,
  liquidarInversorAPI
} from './services/loanService';


type ActiveTab = 'prestamos' | 'clientes' | 'inversores';

const App: React.FC = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inversores, setInversores] = useState<Inversor[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('prestamos');
  

  /* =============================
     CARGA DESDE BACKEND
  ============================== */
  const cargarPrestamos = async () => {
    try {
      const data = await fetchPrestamos();
      setPrestamos(data);
    } catch (err) {
      console.error(err);
    }
  };

  const cargarClientes = async () => {
    const res = await fetch('http://127.0.0.1:8000/clientes');
    const data = await res.json();
    setClientes(data);
  };



  useEffect(() => {
    cargarPrestamos();
    cargarClientes();
  }, []);

  useEffect(() => {
    fetchInversores()
      .then(setInversores)
      .catch(console.error);
  }, []);

  /* =============================
     PRESTAMOS
  ============================== */
  const addPrestamo = async (data: {
    cliente_id: number;
    monto_prestado: number;
    total_a_pagar: number;
    fecha_vencimiento: string;
    estado_pago: string;
  }) => {
    await crearPrestamoAPI(data as any);
    await cargarPrestamos();
  };

  const updatePrestamo = (id: number, prestamo: Prestamo) => {
  setPrestamos(prev =>
    prev.map(p => (p.id === id ? prestamo : p))
  );
};

  /* =============================
     INVERSORES
  ============================== */
  const addInversor = async (newInv: Inversor) => {
    await crearInversorAPI(newInv);
    const data = await fetchInversores();
    setInversores(data);
  };

  const updateInversor = async (id: number) => {
    await liquidarInversorAPI(id);
    const data = await fetchInversores();
    setInversores(data);
  };

  /* =============================
     RESUMEN
  ============================== */
  const getResumen = (): ResumenGeneral => {
    return prestamos.reduce(
      (acc, p) => {
        const { totalActualizado, diasAtraso } =
          obtenerCalculosPunitorios(p);

        if (p.estado_pago !== EstadoPago.SI) {
          acc.total_prestado += p.monto_prestado;
          acc.total_por_cobrar += totalActualizado;
          if (diasAtraso > 0) acc.cantidad_morosos += 1;
        } else {
          acc.total_recuperado += totalActualizado;
        }

        return acc;
      },
      {
        total_prestado: 0,
        total_por_cobrar: 0,
        total_recuperado: 0,
        cantidad_prestamos: prestamos.length,
        cantidad_morosos: 0
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-6">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setActiveTab('prestamos')}
        >
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-slate-900">
            P
          </div>
          <h1 className="font-bold text-lg">
            PréstamosManager <span className="text-emerald-400">Pro</span>
          </h1>
        </div>

        <nav className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {(['prestamos', 'clientes', 'inversores'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium ${
                activeTab === tab
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {activeTab === 'prestamos' && (
          <Dashboard
            prestamos={prestamos}
            resumen={getResumen()}
            clientes={clientes}
            onAdd={addPrestamo}
            onUpdate={updatePrestamo}
          />
        )}


        {activeTab === 'clientes' && (
          <ClientModule
            clientes={clientes}
            onClienteCreado={cargarClientes}
            onClienteChange={cargarPrestamos}
          />
        )}


        {activeTab === 'inversores' && (
          <InvestorModule
            inversores={inversores}
            onAdd={addInversor}
            onUpdate={updateInversor}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t py-4 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Sistema Privado de Préstamos
      </footer>
    </div>
  );
};

export default App;
