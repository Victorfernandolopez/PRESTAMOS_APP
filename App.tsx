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
  
  // FASE 2: Período seleccionado (mes actual por defecto en YYYY-MM)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  

  /* =============================
     PERÍODO Y LISTADO DE PERÍODOS
  ============================== */

  // Obtener todos los períodos únicos disponibles en préstamos
  const periodosDisponibles = (): string[] => {
    const periodos = new Set<string>();
    prestamos.forEach(p => {
      if (p.periodo_origen) {
        periodos.add(p.periodo_origen);
      }
    });
    const sorted = Array.from(periodos).sort().reverse(); // Descendente (más recientes primero)
    return ['ALL', ...sorted]; // 'ALL' al inicio para vista global
  };

  // Obtener mes actual automáticamente
  const getMesActual = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  };

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
    // Filtrar préstamos por período si no es 'ALL'
    const prestamosFiltrados = periodoSeleccionado === 'ALL'
      ? prestamos
      : prestamos.filter(p => p.periodo_origen === periodoSeleccionado);

    return prestamosFiltrados.reduce(
      (acc, p) => {
        // Total prestado: suma de monto_prestado de TODOS los préstamos
        // (nunca se descuenta, es el capital total otorgado)
        acc.total_prestado += p.monto_prestado;

        // Total por cobrar: suma de totalActualizado SOLO de préstamos PENDIENTE
        // totalActualizado incluye punitorios diarios si está en mora
        // (NO incluir SI ni RENOVADO)
        if (p.estado_pago === "PENDIENTE") {
          const { diasAtraso, totalActualizado } = obtenerCalculosPunitorios(p);
          acc.total_por_cobrar += totalActualizado;  // ← Incluye punitorios dinámicos
          // Contar morosos si está vencido
          if (diasAtraso > 0) acc.cantidad_morosos += 1;
        }

        // Total cobrado: suma de monto_cobrado_final de préstamos SI o RENOVADO
        if (p.estado_pago === "SI" || p.estado_pago === "RENOVADO") {
          const montoCobrado = Number(p.monto_cobrado_final) || 0;
          acc.total_recuperado += montoCobrado;
        }

        return acc;
      },
      {
        total_prestado: 0,
        total_por_cobrar: 0,
        total_recuperado: 0,
        cantidad_prestamos: prestamosFiltrados.filter(p => p.estado_pago !== "RENOVADO").length,
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
            onRefresh={cargarPrestamos}
            periodoSeleccionado={periodoSeleccionado}
            onPeriodoChange={setPeriodoSeleccionado}
            periodosDisponibles={periodosDisponibles()}
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
