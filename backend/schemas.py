from pydantic import BaseModel
from datetime import date
from typing import Optional, List

"""
schemas.py define cómo se ENTRAN y SALEN los datos por la API.
No es la BD, es la capa de validación / serialización.
"""

# =========================
# CLIENTES
# =========================

class ClienteBase(BaseModel):
    """
    Campos comunes del cliente.
    """
    nombre_completo: str
    dni: str
    direccion: str
    telefono: str
    telefono_respaldo_1: Optional[str] = None
    telefono_respaldo_2: Optional[str] = None
    observaciones: Optional[str] = None


class ClienteCreate(ClienteBase):
    """
    Usado para crear clientes.
    """
    pass


# =========================
# ARCHIVOS DEL CLIENTE
# =========================

class ClienteArchivoBase(BaseModel):
    """
    Datos base de un archivo.
    """
    tipo: str   # dni_frente, dni_dorso, selfie_dni, comprobante
    url: str


class ClienteArchivoOut(ClienteArchivoBase):
    """
    Archivo devuelto por la API.
    """
    id: int
    cliente_id: int

    class Config:
        from_attributes = True


# =========================
# CLIENTE (OUTPUT COMPLETO)
# =========================

class ClienteOut(ClienteBase):
    """
    Cliente devuelto por la API.
    Incluye SOLO archivos.
    NO incluye préstamos (evita ciclos).
    """
    id: int
    archivos: List[ClienteArchivoOut] = []

    class Config:
        from_attributes = True


# =========================
# PRESTAMOS
# =========================

class PrestamoBase(BaseModel):
    """
    Datos base del préstamo.
    """
    cliente_id: int
    monto_prestado: float
    total_a_pagar: float
    fecha_vencimiento: date
    estado_pago: str


class PrestamoCreate(PrestamoBase):
    """
    Usado para crear préstamos.
    """
    pass


class PrestamoOut(PrestamoBase):
    """
    Préstamo devuelto por la API.
    Incluye cliente completo.
    """
    id: int
    fecha_pago: Optional[date] = None
    monto_cobrado_final: Optional[float] = None

    cliente: ClienteOut

    class Config:
        from_attributes = True


# =========================
# INPUTS AUXILIARES
# =========================

class AgregarMontoIn(BaseModel):
    monto_extra: float


class CobrarPrestamo(BaseModel):
    monto_cobrado_final: float


# =========================
# INVERSORES
# =========================

class InversorBase(BaseModel):
    nombre: str
    monto_invertido: float
    tasa_diaria: float
    fecha_inicio: date
    fecha_fin: date
    estado: str


class InversorCreate(InversorBase):
    pass


class InversorOut(InversorBase):
    id: int
    monto_devuelto: Optional[float] = None

    class Config:
        from_attributes = True
