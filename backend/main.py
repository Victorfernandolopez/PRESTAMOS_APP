import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from .database import SessionLocal, engine, backup_database
from . import models, crud, schemas

"""
main.py
- Define la API (endpoints)
- Maneja HTTP, archivos y respuestas
- NO contiene lógica de negocio (eso está en crud.py)
"""

# =========================
# CREACIÓN DE TABLAS
# =========================

# Se ejecuta una sola vez al iniciar el backend
models.Base.metadata.create_all(bind=engine)

# =========================
# APP FASTAPI
# =========================

app = FastAPI(title="Sistema de Préstamos Privados")

# =========================
# CORS (Electron / Frontend)
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # app local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# DEPENDENCIA DB
# =========================

def get_db():
    """
    Provee una sesión de base de datos por request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================
# PRESTAMOS
# =========================

@app.get("/prestamos", response_model=list[schemas.PrestamoOut])
def listar_prestamos(db: Session = Depends(get_db)):
    return crud.listar_prestamos(db)


@app.post("/prestamos", response_model=schemas.PrestamoOut)
def crear_prestamo(data: schemas.PrestamoCreate, db: Session = Depends(get_db)):
    prestamo = crud.crear_prestamo(db, data)
    return prestamo


@app.put("/prestamos/{prestamo_id}/agregar-monto", response_model=schemas.PrestamoOut)
def agregar_monto(
    prestamo_id: int,
    data: schemas.AgregarMontoIn,
    db: Session = Depends(get_db)
):
    prestamo = crud.agregar_monto(db, prestamo_id, data.monto_extra)
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo


@app.put("/prestamos/{prestamo_id}/cobrar", response_model=schemas.PrestamoOut)
def cobrar_prestamo(
    prestamo_id: int,
    data: schemas.CobrarPrestamo,
    db: Session = Depends(get_db)
):
    prestamo = crud.cobrar_prestamo(db, prestamo_id, data.monto_cobrado_final)
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo

# =========================
# CLIENTES
# =========================

@app.get("/clientes", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(get_db)):
    return crud.listar_clientes(db)


@app.get("/clientes/{cliente_id}", response_model=schemas.ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = crud.obtener_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@app.post("/clientes", response_model=schemas.ClienteOut)
def crear_cliente(data: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente = crud.crear_cliente(db, data)
    return cliente

# =========================
# ARCHIVOS CLIENTE
# =========================

UPLOAD_DIR = os.path.join("uploads", "clientes")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/clientes/{cliente_id}/archivos", response_model=schemas.ClienteArchivoOut)
def subir_archivo_cliente(
    cliente_id: int,
    tipo: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verificar cliente
    cliente = crud.obtener_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Carpeta por cliente
    cliente_dir = os.path.join(UPLOAD_DIR, str(cliente_id))
    os.makedirs(cliente_dir, exist_ok=True)

    # Guardar archivo
    filename = f"{tipo}_{file.filename}"
    filepath = os.path.join(cliente_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Guardar referencia en DB
    archivo = models.ClienteArchivo(
        cliente_id=cliente_id,
        tipo=tipo,
        url=filepath
    )

    db.add(archivo)
    db.commit()
    db.refresh(archivo)
    return archivo

# =========================
# INVERSORES
# =========================

@app.get("/inversores", response_model=list[schemas.InversorOut])
def listar_inversores(db: Session = Depends(get_db)):
    return crud.listar_inversores(db)


@app.post("/inversores", response_model=schemas.InversorOut)
def crear_inversor(data: schemas.InversorCreate, db: Session = Depends(get_db)):
    inversor = crud.crear_inversor(db, data)
    return inversor


@app.put("/inversores/{inversor_id}/liquidar", response_model=schemas.InversorOut)
def liquidar_inversor(inversor_id: int, db: Session = Depends(get_db)):
    inversor = crud.liquidar_inversor(db, inversor_id)
    if not inversor:
        raise HTTPException(status_code=404, detail="Inversor no encontrado")

    return inversor

@app.on_event("startup")
def on_startup():
    print("🟢 Iniciando aplicación – creando backup")
    backup_database()