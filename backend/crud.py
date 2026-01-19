from sqlalchemy.orm import Session
from datetime import date
from . import models, schemas

"""
crud.py contiene TODA la lógica de acceso a datos.
Acá NO hay FastAPI ni HTTP, solo base de datos.
"""

# =========================
# CLIENTES
# =========================

def crear_cliente(db: Session, data: schemas.ClienteCreate):
    """
    Crea un cliente nuevo.
    """
    cliente = models.Cliente(**data.dict())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


def listar_clientes(db: Session):
    """
    Devuelve todos los clientes.
    """
    return db.query(models.Cliente).order_by(models.Cliente.id.desc()).all()


def obtener_cliente(db: Session, cliente_id: int):
    """
    Devuelve un cliente por ID.
    """
    return (
        db.query(models.Cliente)
        .filter(models.Cliente.id == cliente_id)
        .first()
    )


# =========================
# ARCHIVOS CLIENTE
# =========================

def agregar_archivo_cliente(db: Session, data: schemas.ClienteArchivoCreate):
    """
    Guarda un archivo asociado a un cliente.
    (la subida física del archivo se hace en main.py)
    """
    archivo = models.ClienteArchivo(**data.dict())
    db.add(archivo)
    db.commit()
    db.refresh(archivo)
    return archivo


def listar_archivos_cliente(db: Session, cliente_id: int):
    """
    Lista archivos de un cliente.
    """
    return (
        db.query(models.ClienteArchivo)
        .filter(models.ClienteArchivo.cliente_id == cliente_id)
        .all()
    )


# =========================
# PRESTAMOS
# =========================

def crear_prestamo(db: Session, data: schemas.PrestamoCreate):
    """
    Crea un préstamo para un cliente existente.
    """
    # Verificación mínima de integridad
    cliente = (
        db.query(models.Cliente)
        .filter(models.Cliente.id == data.cliente_id)
        .first()
    )
    if not cliente:
        raise ValueError("Cliente no existe")

    prestamo = models.Prestamo(**data.dict())
    db.add(prestamo)
    db.commit()
    db.refresh(prestamo)
    return prestamo


def listar_prestamos(db: Session):
    """
    Devuelve todos los préstamos.
    """
    return (
        db.query(models.Prestamo)
        .order_by(models.Prestamo.id.desc())
        .all()
    )


def agregar_monto(db: Session, prestamo_id: int, monto_extra: float):
    """
    Agrega dinero a un préstamo existente.
    """
    prestamo = (
        db.query(models.Prestamo)
        .filter(models.Prestamo.id == prestamo_id)
        .first()
    )

    if not prestamo:
        return None

    # Se incrementa capital y total
    prestamo.monto_prestado += monto_extra
    prestamo.total_a_pagar += monto_extra

    db.commit()
    db.refresh(prestamo)
    return prestamo


def cobrar_prestamo(db: Session, prestamo_id: int, monto_final: float):
    """
    Marca un préstamo como cobrado.
    """
    prestamo = (
        db.query(models.Prestamo)
        .filter(models.Prestamo.id == prestamo_id)
        .first()
    )

    if not prestamo:
        return None

    prestamo.estado_pago = "SI"
    prestamo.monto_cobrado_final = monto_final
    prestamo.fecha_pago = date.today()

    db.commit()
    db.refresh(prestamo)
    return prestamo


# =========================
# INVERSORES
# =========================

def crear_inversor(db: Session, data: schemas.InversorCreate):
    """
    Crea un inversor.
    """
    inversor = models.Inversor(**data.dict())
    db.add(inversor)
    db.commit()
    db.refresh(inversor)
    return inversor


def listar_inversores(db: Session):
    """
    Lista inversores.
    """
    return (
        db.query(models.Inversor)
        .order_by(models.Inversor.id.desc())
        .all()
    )


def liquidar_inversor(db: Session, inversor_id: int):
    """
    Liquida un inversor.
    """
    inversor = (
        db.query(models.Inversor)
        .filter(models.Inversor.id == inversor_id)
        .first()
    )

    if not inversor:
        return None

    inversor.estado = "LIQUIDADO"
    inversor.monto_devuelto = inversor.monto_invertido

    db.commit()
    db.refresh(inversor)
    return inversor
