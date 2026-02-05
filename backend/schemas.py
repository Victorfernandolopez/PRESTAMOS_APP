from pydantic import BaseModel, Field
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
    nombre_completo: str
    dni: str
    direccion: str
    telefono: str
    telefono_respaldo_1: Optional[str] = None
    telefono_respaldo_2: Optional[str] = None
    observaciones: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


# =========================
# ARCHIVOS DEL CLIENTE
# =========================

class ClienteArchivoBase(BaseModel):
    tipo: str
    url: str


class ClienteArchivoOut(ClienteArchivoBase):
    id: int
    cliente_id: int

    class Config:
        from_attributes = True


# =========================
# CLIENTE (OUTPUT)
# =========================

class ClienteOut(ClienteBase):
    id: int
    archivos: List[ClienteArchivoOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


# =========================
# PRESTAMOS
# =========================

class PrestamoBase(BaseModel):
    cliente_id: int
    monto_prestado: float
    total_a_pagar: float
    fecha_vencimiento: date
    estado_pago: str  # Puede ser PENDIENTE, SI, RENOVADO, BLOQUEADO


class PrestamoCreate(BaseModel):
    cliente_id: int
    monto_prestado: float
    plazo: int  # 7, 14 o 30
    fecha_inicio: Optional[date] = None
    estado_pago: Optional[str] = 'PENDIENTE'  # Puede ser BLOQUEADO solo por backend
    tasa_interes: Optional[float] = None  # Tasa decimal (ej: 0.20 para 20%)


class PrestamoOut(PrestamoBase):
    id: int
    fecha_creacion: date
    fecha_pago: Optional[date] = None
    monto_cobrado_final: Optional[float] = None
    cliente: ClienteOut
    estado_prestamo: str = 'PENDIENTE'  # Campo derivado calculado por el backend
    dias_atraso: int = 0
    es_moroso: bool = False
    punitorio_diario: float = 0.0
    punitorio_total: float = 0.0
    total_actualizado: float = 0.0
    periodo_origen: Optional[str] = None  # Formato YYYY-MM
    tasa_interes: Optional[float] = None  # Tasa decimal

    class Config:
        from_attributes = True


# =========================
# INPUTS AUXILIARES
# =========================

class AgregarMontoIn(BaseModel):
    monto_extra: float


class CobrarPrestamo(BaseModel):
    monto_cobrado_final: float


class RenovarPrestamoIn(BaseModel):
    monto_renovado: float
    plazo: int
    tasa_interes: Optional[float] = None  # Tasa decimal (ej: 0.20 para 20%)


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
    dias_trabajados: Optional[int] = None
    ganancia: Optional[float] = None
    total_a_devolver: Optional[float] = None

    class Config:
        from_attributes = True
