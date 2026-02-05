from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    Text,
    ForeignKey
)
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import date


"""
Este archivo define los MODELOS de la base de datos.
Cada clase representa una tabla real en SQLite.

Regla mental:
- models.py = estructura de datos (qué se guarda)
- NO lógica de negocio
- NO validaciones de frontend
"""

# =========================
# CLIENTES
# =========================
class Cliente(Base):
    """
    Tabla: clientes

    Representa a una persona que recibe préstamos.
    Es el eje central del sistema.
    """

    __tablename__ = "clientes"

    # Clave primaria
    id = Column(Integer, primary_key=True, index=True)

    # Datos personales
    nombre_completo = Column(String, nullable=False)
    dni = Column(String, nullable=False, unique=True)

    direccion = Column(String, nullable=False)
    telefono = Column(String, nullable=False)

    # Teléfonos alternativos (opcional)
    telefono_respaldo_1 = Column(String, nullable=True)
    telefono_respaldo_2 = Column(String, nullable=True)

    # Notas internas
    observaciones = Column(Text, nullable=True)

    # =========================
    # Relaciones
    # =========================

    # Un cliente puede tener MUCHOS préstamos
    prestamos = relationship(
        "Prestamo",
        back_populates="cliente",
        cascade="all, delete-orphan"
        # Si se borra el cliente → se borran sus préstamos
    )

    # Un cliente puede tener MUCHOS archivos
    archivos = relationship(
        "ClienteArchivo",
        back_populates="cliente",
        cascade="all, delete-orphan"
        # Si se borra el cliente → se borran sus archivos
    )


# =========================
# ARCHIVOS DEL CLIENTE
# =========================
class ClienteArchivo(Base):
    """
    Tabla: cliente_archivos

    Guarda archivos asociados a un cliente:
    - DNI frente
    - DNI dorso
    - selfie con DNI
    - comprobantes
    """

    __tablename__ = "cliente_archivos"

    id = Column(Integer, primary_key=True, index=True)

    # Relación con cliente
    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id", ondelete="CASCADE"),
        nullable=False
    )

    # Tipo lógico del archivo (controlado desde frontend)
    tipo = Column(String, nullable=False)
    # ej: dni_frente, dni_dorso, selfie_dni, comprobante

    # Ruta física o URL del archivo
    url = Column(String, nullable=False)

    # Relación inversa
    cliente = relationship("Cliente", back_populates="archivos")


# =========================
# PRESTAMOS
# =========================
class Prestamo(Base):
    """
    Tabla: prestamos

    Representa un préstamo otorgado a un cliente.
    """

    __tablename__ = "prestamos"

    id = Column(Integer, primary_key=True, index=True)

    # Cliente asociado
    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id", ondelete="CASCADE"),
        nullable=False
    )

    # Datos económicos
    monto_prestado = Column(Float, nullable=False)
    total_a_pagar = Column(Float, nullable=False)

    # Métricas de cobro
    total_cobrado = Column(Float, nullable=False, default=0.0)
    por_cobrar = Column(Float, nullable=False, default=0.0)

    # Estado del préstamo
    fecha_creacion = Column(Date, nullable=True, default=date.today)
    fecha_vencimiento = Column(Date, nullable=False)
    estado_pago = Column(String, nullable=False)
    # ej: PENDIENTE, MOROSO, PAGADO, BLOQUEADO

    # Datos al momento del cobro
    fecha_pago = Column(Date, nullable=True)
    monto_cobrado_final = Column(Float, nullable=True)

    # Nuevos campos: período y tasa variable
    periodo_origen = Column(String, nullable=True)  # Formato YYYY-MM
    tasa_interes = Column(Float, nullable=True)  # Tasa decimal (ej: 0.20 para 20%)

    # Relación inversa
    cliente = relationship("Cliente", back_populates="prestamos")


# =========================
# INVERSORES
# =========================
class Inversor(Base):
    """
    Tabla: inversores

    Personas que aportan capital al sistema.
    """

    __tablename__ = "inversores"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String, nullable=False)
    monto_invertido = Column(Float, nullable=False)

    tasa_diaria = Column(Float, nullable=False)

    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)

    estado = Column(String, nullable=False)
    # ej: ACTIVO / LIQUIDADO

    monto_devuelto = Column(Float, nullable=True)
