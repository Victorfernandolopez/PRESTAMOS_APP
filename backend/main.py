
import os
import shutil
import sys
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.database import SessionLocal, engine, backup_database
from backend import models, crud, schemas

"""
main.py
- API FastAPI
- Manejo de archivos y rutas correctas para EXE
"""

# =========================
# CREACIÓN DE TABLAS
# =========================

models.Base.metadata.create_all(bind=engine)

# =========================
# APP FASTAPI
# =========================

app = FastAPI(title="Sistema de Préstamos Privados")

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# RUTAS DE DATOS (PRODUCCIÓN)
# =========================

def get_app_data_dir():
    if sys.platform == "win32":
        return os.path.join(
            os.environ.get("LOCALAPPDATA"),
            "PrestamosManager"
        )
    return os.path.abspath(".")

APP_DATA = os.getenv("LOCALAPPDATA")
UPLOAD_ROOT = os.path.join(APP_DATA, "PrestamosManager", "uploads")
CLIENT_UPLOAD_DIR = os.path.join(UPLOAD_ROOT, "clientes")

os.makedirs(CLIENT_UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# =========================
# DEPENDENCIA DB
# =========================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    return crud.crear_cliente(db, data)

# =========================
# ARCHIVOS CLIENTE
# =========================

@app.post("/clientes/{cliente_id}/archivos", response_model=schemas.ClienteArchivoOut)
def subir_archivo_cliente(
    cliente_id: int,
    tipo: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    cliente = crud.obtener_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente_dir = os.path.join(CLIENT_UPLOAD_DIR, str(cliente_id))
    os.makedirs(cliente_dir, exist_ok=True)

    filename = f"{tipo}_{file.filename}"
    physical_path = os.path.join(cliente_dir, filename)

    with open(physical_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # URL pública que consume el frontend
    public_url = f"/uploads/clientes/{cliente_id}/{filename}"

    archivo = models.ClienteArchivo(
        cliente_id=cliente_id,
        tipo=tipo,
        url=public_url
    )

    db.add(archivo)
    db.commit()
    db.refresh(archivo)
    return archivo

# =========================
# PRÉSTAMOS
# =========================

@app.get("/prestamos", response_model=list[schemas.PrestamoOut])
def listar_prestamos(db: Session = Depends(get_db)):
    return crud.listar_prestamos(db)

@app.post("/prestamos", response_model=schemas.PrestamoOut)
def crear_prestamo(data: schemas.PrestamoCreate, db: Session = Depends(get_db)):
    return crud.crear_prestamo(db, data)

@app.put("/prestamos/{prestamo_id}/agregar-monto", response_model=schemas.PrestamoOut)
def agregar_monto(prestamo_id: int, data: schemas.AgregarMontoIn, db: Session = Depends(get_db)):
    prestamo = crud.agregar_monto(db, prestamo_id, data.monto_extra)
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo

@app.put("/prestamos/{prestamo_id}/cobrar", response_model=schemas.PrestamoOut)
def cobrar_prestamo(prestamo_id: int, data: schemas.CobrarPrestamo, db: Session = Depends(get_db)):
    prestamo = crud.cobrar_prestamo(db, prestamo_id, data.monto_cobrado_final)
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo

@app.post("/prestamos/{prestamo_id}/renovar", response_model=schemas.PrestamoOut)
def renovar_prestamo(prestamo_id: int, data: schemas.RenovarPrestamoIn, db: Session = Depends(get_db)):
    try:
        # ahora el backend calcula el total y la nueva fecha a partir del plazo
        # y opcionalmente usa tasa_interes personalizada
        nuevo_prestamo = crud.renovar_prestamo(
            db,
            prestamo_id,
            data.monto_renovado,
            data.plazo,
            getattr(data, 'tasa_interes', None)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not nuevo_prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")

    return nuevo_prestamo

# =========================
# INVERSORES
# =========================

@app.get("/inversores", response_model=list[schemas.InversorOut])
def listar_inversores(db: Session = Depends(get_db)):
    return crud.listar_inversores(db)

@app.post("/inversores", response_model=schemas.InversorOut)
def crear_inversor(data: schemas.InversorCreate, db: Session = Depends(get_db)):
    return crud.crear_inversor(db, data)

@app.put("/inversores/{inversor_id}/liquidar", response_model=schemas.InversorOut)
def liquidar_inversor(inversor_id: int, db: Session = Depends(get_db)):
    inversor = crud.liquidar_inversor(db, inversor_id)
    if not inversor:
        raise HTTPException(status_code=404, detail="Inversor no encontrado")
    return inversor

# =========================
# BLOQUEAR PRÉSTAMO
# =========================

@app.post("/prestamos/{prestamo_id}/bloquear", response_model=schemas.PrestamoOut)
def bloquear_prestamo(prestamo_id: int, db: Session = Depends(get_db)):
    prestamo = crud.bloquear_prestamo(db, prestamo_id)
    if not prestamo:
        raise HTTPException(status_code=404, detail="Préstamo no encontrado")
    return prestamo
# =========================
# STARTUP
# =========================

@app.on_event("startup")
def on_startup():
    print("Iniciando aplicación – creando backup")
    backup_database()

# =========================
# ENTRYPOINT (OBLIGATORIO PARA EXE)
# =========================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
