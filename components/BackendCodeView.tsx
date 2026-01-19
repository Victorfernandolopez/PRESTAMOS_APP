
import React, { useState } from 'react';

const BackendCodeView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState('main.py');

  const files: Record<string, string> = {
    'database.py': `
# database.py - Conexión a la base de datos
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Usamos SQLite por simplicidad, fácil de migrar a PostgreSQL luego
SQLALCHEMY_DATABASE_URL = "sqlite:///./prestamos.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`,
    'models.py': `
# models.py - Definición de tablas SQL
from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from .database import Base

class Prestamo(Base):
    __tablename__ = "prestamos"
    id = Column(Integer, primary_key=True, index=True)
    nombre_cliente = Column(String)
    telefono = Column(String)
    direccion = Column(String)
    monto_prestado = Column(Float)
    plazo_dias = Column(Integer)
    interes_aplicado = Column(Float)
    fecha_prestamo = Column(Date)
    fecha_vencimiento = Column(Date)
    total_a_pagar = Column(Float) # Total BASE según contrato
    monto_cobrado_final = Column(Float, nullable=True) # Total REAL cobrado (Base + Punitorios)
    estado_pago = Column(String, nullable=True)
    fecha_pago = Column(Date, nullable=True)

class Inversor(Base):
    __tablename__ = "inversores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    monto_invertido = Column(Float)
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    tasa_diaria = Column(Float)
    estado = Column(String, default="ACTIVO")
`,
    'schemas.py': `
# schemas.py - Validación de datos (Pydantic)
from pydantic import BaseModel
from datetime import date
from typing import Optional

class PrestamoUpdate(BaseModel):
    estado_pago: str
    fecha_pago: date
    monto_cobrado_final: float # Obligatorio al momento de actualizar a pagado

class InversorResponse(BaseModel):
    id: int
    nombre: str
    monto_invertido: float
    estado: str
    class Config:
        orm_mode = True
`,
    'crud.py': `
# crud.py - Lógica del negocio
from sqlalchemy.orm import Session
from datetime import timedelta, date
from . import models, schemas

# REGLA PUNITORIOS: 5% diario
TASA_PUNITORIA = 0.05

def marcar_prestamo_pagado(db: Session, pid: int, monto_real: float):
    p = db.query(models.Prestamo).filter(models.Prestamo.id == pid).first()
    if p:
        p.estado_pago = "SI"
        p.fecha_pago = date.today()
        # Se guarda el monto final con punitorios para que el historial sea exacto
        p.monto_cobrado_final = monto_real 
        db.commit()
        db.refresh(p)
    return p

def calcular_punitorio_actual(prestamo: models.Prestamo):
    if prestamo.estado_pago == "SI":
        return 0, prestamo.monto_cobrado_final or prestamo.total_a_pagar
    
    hoy = date.today()
    if hoy > prestamo.fecha_vencimiento:
        dias = (hoy - prestamo.fecha_vencimiento).days
        punitorio = prestamo.total_a_pagar * TASA_PUNITORIA * dias
        return dias, prestamo.total_a_pagar + punitorio
    return 0, prestamo.total_a_pagar
`,
    'main.py': `
# main.py - Inicia la aplicación FastAPI
from fastapi import FastAPI, Depends
from . import models, schemas, crud, database

models.Base.metadata.create_all(bind=database.engine)
app = FastAPI()

@app.patch("/prestamos/{pid}/cobrar")
def cobrar_prestamo(pid: int, monto_final: float, db: Session = Depends(database.get_db)):
    # La API recibe el monto exacto que se mostró en la UI
    return crud.marcar_prestamo_pagado(db, pid, monto_final)
`,
    'README.md': `
# Actualización: Lógica de Cobro Exacto

## Persistencia de Punitorios
Anteriormente, los punitorios solo se mostraban visualmente pero no se guardaban.
Ahora, el sistema captura el **monto_cobrado_final** al momento de presionar "Cobrar".

## Impacto en Reportes
- El campo \`monto_cobrado_final\` asegura que el Dashboard muestre el dinero real que ingresó a la caja.
- Una vez pagado, los días de atraso y punitorios dejan de recalcularse dinámicamente, quedando congelados con los valores del momento de la transacción.
`
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px]">
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Archivos Backend</h3>
        <ul className="space-y-1">
          {Object.keys(files).map(name => (
            <li key={name}>
              <button 
                onClick={() => setSelectedFile(name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFile === name ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col bg-slate-900 text-slate-300 overflow-hidden font-mono text-sm leading-relaxed">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">{selectedFile}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(files[selectedFile]);
              alert('Copiado');
            }}
            className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300"
          >
            Copiar
          </button>
        </div>
        <pre className="p-6 overflow-auto h-full scrollbar-thin scrollbar-thumb-slate-700">
          <code>{files[selectedFile].trim()}</code>
        </pre>
      </div>
    </div>
  );
};

export default BackendCodeView;
