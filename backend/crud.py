from sqlalchemy.orm import Session
from datetime import date, timedelta
from math import ceil
from . import models, schemas

"""
crud.py contiene TODA la lógica de acceso a datos.
Acá NO hay FastAPI ni HTTP, solo base de datos.
"""

# =========================
# FUNCIONES AUXILIARES (CÁLCULOS)
# =========================

def deducir_plazo_del_prestamo(prestamo: models.Prestamo) -> int:
    """
    Deduce el plazo (en días) de un préstamo existente basándose en 
    la tasa de interés implícita (diferencia entre total_a_pagar y monto_prestado).
    
    Tasas conocidas:
    - 7 días: 20% (monto * 1.2)
    - 14 días: 40% (monto * 1.4)
    - 30 días: 100% (monto * 2.0)
    
    @param prestamo: Objeto Prestamo de la BD
    @return: Plazo en días (7, 14, o 30). Si no coincide, retorna 7 por defecto.
    """
    if prestamo.monto_prestado <= 0:
        return 7  # default
    
    # Calcular tasa de interés (como ratio)
    tasa = (prestamo.total_a_pagar - prestamo.monto_prestado) / prestamo.monto_prestado
    
    # Comparar con tolerancia pequeña
    if abs(tasa - 0.20) < 0.01:
        return 7
    elif abs(tasa - 0.40) < 0.01:
        return 14
    elif abs(tasa - 1.00) < 0.01:
        return 30
    
    # Si no coincide exactamente, devolver 7 por defecto
    return 7


def calcular_mora(prestamo: models.Prestamo) -> tuple[int, bool]:
    """
    Calcula los días de atraso y si el préstamo es moroso.

    Reglas:
    - Si el préstamo ya está cobrado (`estado_pago == 'SI'`) => atraso 0, no moroso
    - Si hoy <= fecha_vencimiento => atraso 0, no moroso
    - Si hoy > fecha_vencimiento => atraso = (hoy - fecha_vencimiento).days, moroso = True
    """
    hoy = date.today()

    # Protecciones
    if prestamo is None:
        return 0, False

    # Si ya fue cobrado, no considerarlo moroso
    if getattr(prestamo, 'estado_pago', None) == 'SI':
        return 0, False

    venc = getattr(prestamo, 'fecha_vencimiento', None)
    if venc is None:
        return 0, False

    if hoy <= venc:
        return 0, False

    dias = (hoy - venc).days
    return max(0, dias), True


def aplicar_mora(prestamo: models.Prestamo) -> None:
    """Adjunta atributos `dias_atraso` y `es_moroso` al objeto `prestamo`.

    Esto permite que Pydantic (con `from_attributes = True`) los serialice
    en la respuesta del API.
    """
    dias, moroso = calcular_mora(prestamo)
    setattr(prestamo, 'dias_atraso', dias)
    setattr(prestamo, 'es_moroso', moroso)


# =========================
# REGLAS FINANCIERAS (PURE BUSINESS FUNCTIONS)
# =========================

# Tasa punitoria diaria (5% diario)
TASA_PUNITORIA_DIARIA = 0.05


def calcular_total_a_pagar(monto: float, plazo: int) -> float:
    """Calcula total a pagar según tasas por plazo (7/14/30)."""
    tasas = {7: 0.20, 14: 0.40, 30: 1.00}
    tasa = tasas.get(plazo, 0.20)
    return monto * (1 + tasa)


def calcular_punitorios(prestamo: models.Prestamo) -> tuple[float, float]:
    """Devuelve (punitorio_diario, punitorio_total) basados en total_a_pagar y dias_atraso."""
    total_base = getattr(prestamo, 'total_a_pagar', 0.0) or 0.0
    dias = getattr(prestamo, 'dias_atraso', 0) or 0
    punitorio_diario = total_base * TASA_PUNITORIA_DIARIA
    punitorio_total = punitorio_diario * max(0, int(dias))
    return punitorio_diario, punitorio_total


def calcular_total_actualizado(prestamo: models.Prestamo) -> float:
    """Calcula el total actualizado que debe pagarse considerando punitorios.

    Si el préstamo ya fue cobrado (`estado_pago == 'SI'`) devuelve el
    `monto_cobrado_final` cuando exista, sino el `total_a_pagar`.
    """
    if getattr(prestamo, 'estado_pago', None) == 'SI':
        return float(getattr(prestamo, 'monto_cobrado_final', prestamo.total_a_pagar) or prestamo.total_a_pagar)

    pun_diario, pun_total = calcular_punitorios(prestamo)
    return float((getattr(prestamo, 'total_a_pagar', 0.0) or 0.0) + pun_total)


def aplicar_finanzas(prestamo: models.Prestamo) -> None:
    """Adjunta campos financieros calculados al objeto `prestamo`.

    Campos añadidos:
    - `punitorio_diario`
    - `punitorio_total`
    - `total_actualizado`
    (además de los campos de mora ya añadidos: `dias_atraso`, `es_moroso`)
    """
    # Asegurar que dias_atraso y es_moroso estén presentes
    aplicar_mora(prestamo)

    pun_diario, pun_total = calcular_punitorios(prestamo)
    total_actualizado = calcular_total_actualizado(prestamo)

    setattr(prestamo, 'punitorio_diario', float(pun_diario))
    setattr(prestamo, 'punitorio_total', float(pun_total))
    setattr(prestamo, 'total_actualizado', float(total_actualizado))


def calcular_total_nuevo_monto(monto: float, plazo: int) -> float:
    """
    Recalcula el total a pagar basándose en el monto y plazo.
    Usa la misma lógica de tasas que la creación de préstamos.
    
    @param monto: Monto base del préstamo
    @param plazo: Plazo en días (7, 14, 30)
    @return: Total a pagar (monto * (1 + tasa))
    """
    tasas = {
        7: 0.20,   # 20%
        14: 0.40,  # 40%
        30: 1.00   # 100%
    }
    
    tasa = tasas.get(plazo, 0.20)
    return monto * (1 + tasa)

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

    # Calcular total_a_pagar y fecha_vencimiento en el backend
    monto = data.monto_prestado
    plazo = getattr(data, 'plazo', 7)
    fecha_inicio = getattr(data, 'fecha_inicio', None) or date.today()

    total_a_pagar = calcular_total_a_pagar(monto, plazo)
    fecha_vencimiento = fecha_inicio + timedelta(days=plazo)

    prestamo = models.Prestamo(
        cliente_id=data.cliente_id,
        monto_prestado=monto,
        total_a_pagar=total_a_pagar,
        fecha_vencimiento=fecha_vencimiento,
        estado_pago=data.estado_pago or 'PENDIENTE'
    )

    # Inicializar métricas: al crear, no hay nada cobrado
    prestamo.total_cobrado = 0.0
    prestamo.por_cobrar = prestamo.total_a_pagar
    
    db.add(prestamo)
    db.commit()
    db.refresh(prestamo)
    # Adjuntar campos calculados de mora y financieros
    aplicar_finanzas(prestamo)
    return prestamo


def listar_prestamos(db: Session):
    """
    Devuelve todos los préstamos.
    """
    prestamos = (
        db.query(models.Prestamo)
        .order_by(models.Prestamo.id.desc())
        .all()
    )

    # Adjuntar campos calculados de mora y financieros a cada préstamo
    for p in prestamos:
        aplicar_finanzas(p)

    return prestamos


def agregar_monto(db: Session, prestamo_id: int, monto_extra: float):
    """
    Agrega dinero a un préstamo existente.
    
    REGLAS:
    1. Se suma monto_extra a monto_prestado (capital)
    2. Se recalcula total_a_pagar con la MISMA tasa de interés del préstamo original
    3. El plazo NO cambia
    4. La fecha de vencimiento NO cambia
    5. Se actualiza por_cobrar como: total_a_pagar - total_cobrado
    6. NO se modifica estado_pago
    
    @param db: Sesión de la BD
    @param prestamo_id: ID del préstamo a actualizar
    @param monto_extra: Monto adicional a agregar al capital
    @return: Préstamo actualizado o None si no existe
    """
    prestamo = (
        db.query(models.Prestamo)
        .filter(models.Prestamo.id == prestamo_id)
        .first()
    )

    if not prestamo:
        return None

    # 1. Deducir el plazo original del préstamo
    plazo = deducir_plazo_del_prestamo(prestamo)
    
    # 2. Sumar monto_extra al capital
    nuevo_monto_prestado = prestamo.monto_prestado + monto_extra
    
    # 3. Recalcular total_a_pagar usando la misma lógica de intereses
    nuevo_total_a_pagar = calcular_total_nuevo_monto(nuevo_monto_prestado, plazo)
    
    # 4. Actualizar el préstamo
    prestamo.monto_prestado = nuevo_monto_prestado
    prestamo.total_a_pagar = nuevo_total_a_pagar
    
    # 5. Recalcular por_cobrar
    prestamo.por_cobrar = prestamo.total_a_pagar - prestamo.total_cobrado
    
    # Guardar cambios
    db.commit()
    db.refresh(prestamo)
    aplicar_finanzas(prestamo)
    return prestamo


def cobrar_prestamo(db: Session, prestamo_id: int, monto_final: float):
    """
    Marca un préstamo como cobrado.
    Actualiza las métricas: total_cobrado y por_cobrar.
    NO modifica total_prestado bajo ningún concepto.
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
    
    # Actualizar métricas de cobro
    prestamo.total_cobrado += monto_final
    prestamo.por_cobrar = max(0, prestamo.total_a_pagar - prestamo.total_cobrado)

    db.commit()
    db.refresh(prestamo)
    aplicar_finanzas(prestamo)
    return prestamo


def renovar_prestamo(
    db: Session,
    prestamo_id: int,
    monto_renovado: float,
    plazo: int
):
    """
    Renueva un préstamo existente.
    
    Lógica:
    1. Calcula intereses = total_a_pagar - monto_prestado
    2. Cobra SOLO los intereses (no el capital)
    3. Cierra el préstamo original:
       - total_a_pagar = intereses
       - total_cobrado = intereses
       - por_cobrar = 0
       - estado_pago = "RENOVADO"
       - fecha_pago = hoy
       - monto_cobrado_final = intereses
    4. Crea nuevo préstamo con capital original:
       - monto_prestado = capital original
       - total_a_pagar = nuevo_total_a_pagar
       - estado_pago = "PENDIENTE"
    
    Retorna el nuevo préstamo creado.
    """
    # Buscar préstamo original
    prestamo = (
        db.query(models.Prestamo)
        .filter(models.Prestamo.id == prestamo_id)
        .first()
    )
    
    if not prestamo:
        return None
    
    # Calcular intereses (solo lo que no es capital)
    intereses = prestamo.total_a_pagar - prestamo.monto_prestado
    
    # Cerrar préstamo original: cobrar intereses, no capital
    prestamo.total_a_pagar = intereses
    prestamo.total_cobrado = intereses
    prestamo.por_cobrar = 0.0
    prestamo.estado_pago = "RENOVADO"
    prestamo.fecha_pago = date.today()
    prestamo.monto_cobrado_final = intereses
    
    # Calcular nuevo total y nueva fecha de vencimiento en backend
    nuevo_total = calcular_total_a_pagar(monto_renovado, plazo)
    nueva_fecha = date.today() + timedelta(days=plazo)

    # Crear nuevo préstamo con capital original
    nuevo_prestamo = models.Prestamo(
        cliente_id=prestamo.cliente_id,
        monto_prestado=monto_renovado,
        total_a_pagar=nuevo_total,
        total_cobrado=0.0,
        por_cobrar=nuevo_total,
        estado_pago="PENDIENTE",
        fecha_vencimiento=nueva_fecha
    )
    
    # Guardar ambos en una sola transacción
    db.add(nuevo_prestamo)
    db.commit()
    db.refresh(prestamo)
    db.refresh(nuevo_prestamo)

    # Adjuntar campos calculados de mora y financieros al préstamo nuevo
    aplicar_finanzas(nuevo_prestamo)

    return nuevo_prestamo


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
    inversores = (
        db.query(models.Inversor)
        .order_by(models.Inversor.id.desc())
        .all()
    )

    # Adjuntar cálculos financieros para inversores
    for inv in inversores:
        # días trabajados
        inicio = getattr(inv, 'fecha_inicio', None)
        fin = getattr(inv, 'fecha_fin', None)
        dias = 0
        if inicio and fin:
            dias = max(0, (fin - inicio).days)

        ganancia = (inv.monto_invertido or 0.0) * (inv.tasa_diaria or 0.0) * dias
        total_a_devolver = (inv.monto_invertido or 0.0) + ganancia

        setattr(inv, 'dias_trabajados', int(dias))
        setattr(inv, 'ganancia', float(ganancia))
        setattr(inv, 'total_a_devolver', float(total_a_devolver))

    return inversores


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
    # Adjuntar cálculos financieros mínimos
    inicio = getattr(inversor, 'fecha_inicio', None)
    fin = getattr(inversor, 'fecha_fin', None)
    dias = 0
    if inicio and fin:
        dias = max(0, (fin - inicio).days)

    ganancia = (inversor.monto_invertido or 0.0) * (inversor.tasa_diaria or 0.0) * dias
    total_a_devolver = (inversor.monto_invertido or 0.0) + ganancia

    setattr(inversor, 'dias_trabajados', int(dias))
    setattr(inversor, 'ganancia', float(ganancia))
    setattr(inversor, 'total_a_devolver', float(total_a_devolver))

    return inversor
