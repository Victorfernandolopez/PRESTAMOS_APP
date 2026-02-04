PrestamosManager Pro

PrestamosManager Pro es una aplicación desktop (Windows) para la gestión integral de préstamos privados, desarrollada con:

Backend: FastAPI + SQLite

Frontend: React + Vite

Desktop: Electron

Empaquetado: Electron Builder (NSIS)

Pensada para uso local, sin dependencias externas ni servicios en la nube.

Funcionalidades
Clientes

Alta, listado y detalle de clientes

Datos personales y observaciones

Carga y visualización de archivos:

DNI frente / dorso

Selfie con DNI

Comprobantes

Préstamos

Creación de préstamos asociados a clientes

Control de vencimientos

Estados de pago

Agregar monto a préstamos existentes

Cobro de préstamos

Inversores

Alta de inversores

Registro de capital invertido

Liquidación de inversiones

Persistencia y datos

Base de datos SQLite local

La base se crea automáticamente en la primera ejecución

Los datos persisten entre ejecuciones

El backend se ejecuta en segundo plano junto a la app

Arquitectura del proyecto
prestamos_app/
│
├── backend/                # Código fuente backend (FastAPI)
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── crud.py
│
├── backend_dist/            # Backend compilado (PyInstaller)
│   └── backend.exe
│
├── electron/                # Proceso principal Electron
│   └── main.js
│
├── components/              # Componentes React
├── services/                # Servicios frontend (API)
│
├── dist/                    # Build frontend (Vite)
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── .gitignore

Requisitos de desarrollo

Node.js 18+

Python 3.10+

Git

Windows (objetivo de empaquetado)

Backend – Desarrollo
# Crear entorno virtual
python -m venv venv

# Activar entorno
source venv/Scripts/activate   # Windows (Git Bash)

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar backend
python backend/main.py


API disponible en:

http://127.0.0.1:8000
http://127.0.0.1:8000/docs

Frontend – Desarrollo
npm install
npm run dev


Frontend disponible en:

http://localhost:3000

Desktop (Electron) – Desarrollo

Con backend ya compilado en backend_dist/backend.exe:

npm run electron


Esto:

abre la ventana Electron

levanta automáticamente el backend

cierra el backend al cerrar la app

Empaquetado para Windows (Producción)
Compilar backend (una sola vez)

Desde la raíz del proyecto:

pyinstaller --onefile backend/main.py --name backend


Mover el ejecutable a:

backend_dist/backend.exe

2️Build + instalador Windows
npm run dist


Se genera:

dist/PrestamosManager Pro Setup 1.0.0.exe

Control de versiones (Git)

Este repositorio NO incluye:

node_modules/

dist/

backend_dist/

bases de datos .db

archivos de usuarios

ejecutables .exe

Todo eso se genera localmente.

Estado del proyecto

Versión estable v1.0.0

App desktop funcional

Backend embebido

Persistencia local

Flujo completo probado

Lista para uso real en Windows

Próximas mejoras (opcional)

Autenticación y roles

Reportes exportables

Alertas de vencimientos

Notificaciones

Instalador firmado

Autor

Proyecto desarrollado como aplicación fullstack desktop, integrando backend Python y frontend moderno, con enfoque en arquitectura clara, persistencia local y empaquetado profesional.

Feature: Renovación de préstamos + corrección de KPIs
Problema real

En la operatoria diaria de préstamos:

El cliente no siempre cancela el total

Paga solo intereses

Se cierra el préstamo actual y se abre uno nuevo

Los KPIs deben reflejar la realidad financiera

El sistema no contemplaba renovaciones, ni el impacto correcto en:

Total prestado

Total cobrado

Por cobrar

Objetivo

Implementar un flujo de renovación realista, sin romper lógica existente:

Cerrar préstamo original

Registrar el cobro de intereses

Crear nuevo préstamo con nuevo plazo

Recalcular KPIs correctamente

Mantener historial y trazabilidad

Decisiones clave de diseño

Backend

Se creó un endpoint específico:
POST /prestamos/{prestamo_id}/renovar

La renovación:

Cobra solo intereses

Cambia estado a RENOVADO

Ajusta total_a_pagar del préstamo original

Crea un nuevo préstamo

Todo en una sola transacción

KPIs recalculados en base a estado (PENDIENTE, RENOVADO, MOROSO)

Frontend

Modal de renovación independiente

Cliente bloqueado (no editable)

Plazos dinámicos (7 / 14 / 30 días)

Reutilización de lógica de cálculo (no duplicar reglas)

UI refleja inmediatamente los cambios

Problemas reales encontrados (importante)

Diferencias entre backend en desarrollo vs backend compilado

NaN en KPIs por préstamos renovados

Doble conteo de préstamos cerrados

Inconsistencias en cálculo de intereses

Se resolvió:

Centralizando cálculos

Excluyendo préstamos RENOVADO de KPIs activos

Separando capital vs interés

Resultado final

Renovaciones reales

KPIs confiables

Historial claro

Feature lista para producción

---

## Feature: FASE 1 - Períodos mensuales y tasas variables por préstamo

### Problema
El sistema calculaba tasas de interés basadas únicamente en el plazo (7/14/30 días), sin permitir tasas personalizadas. Tampoco registraba el período (mes/año) en que se originaba cada préstamo.

### Objetivo
Implementar soporte para:
1. Tasas de interés variables por préstamo
2. Período de origen (YYYY-MM) para cada préstamo
3. Renovaciones con nuevas tasas
4. Compatibilidad total con préstamos existentes

### Cambios implementados

#### Modelo Prestamo (models.py)
```python
periodo_origen = Column(String, nullable=True)  # Formato YYYY-MM
tasa_interes = Column(Float, nullable=True)      # Tasa decimal (ej: 0.20)
```

#### Schemas (schemas.py)
- `PrestamoCreate`: Acepta `tasa_interes` opcional
- `PrestamoOut`: Expone `periodo_origen` y `tasa_interes`
- `RenovarPrestamoIn`: Acepta `tasa_interes` opcional en renovaciones

#### Funciones actualizadas (crud.py)
1. **crear_prestamo()**: 
   - Valida `tasa_interes > 0`
   - Asigna `periodo_origen` automáticamente (YYYY-MM del día de creación)
   - Calcula `total_a_pagar` usando `tasa_interes` si se proporciona

2. **renovar_prestamo()**: 
   - Acepta `tasa_interes` como parámetro
   - Marca original como RENOVADO
   - Crea nuevo préstamo con nueva tasa

3. **agregar_monto()**: 
   - Usa `tasa_interes` guardado del préstamo
   - No deduce tasa del plazo (mantiene coherencia)

#### Migracion de BD
Script `backend/migrate.py`:
- Agrega columnas a tabla existente (sin recreación)
- Rellena `periodo_origen` desde `fecha_creacion` (YYYY-MM)
- Deja `tasa_interes` en NULL para compatibilidad backward
- Se ejecuta una vez al actualizar sistema existente

### Características clave

✓ **Backward compatible**: Préstamos existentes sin tasa_interes (NULL)
✓ **Período automático**: Se deduce de fecha_creacion
✓ **Tasas flexibles**: Permite customizar tasas por préstamo
✓ **Datos intactos**: No recalcula montos históricos
✓ **Renovaciones mejoradas**: Con soporte de nuevas tasas

### Ejemplo de uso

```python
# Crear préstamo con tasa personalizada
POST /prestamos
{
  "cliente_id": 1,
  "monto_prestado": 1000,
  "plazo": 14,
  "tasa_interes": 0.30  # 30%
}
# Resultado:
# - total_a_pagar = 1300
# - periodo_origen = "2026-02" (mes actual)
# - tasa_interes = 0.30

# Renovar con nueva tasa
PUT /prestamos/1/renovar
{
  "monto_renovado": 500,
  "plazo": 14,
  "tasa_interes": 0.25  # 25%
}
# Resultado:
# - Préstamo original marcado como RENOVADO
# - Nuevo préstamo con tasa 25% y periodo "2026-02"
```

### Compatibilidad
- ✓ Funciona con datos históricos (tasa_interes NULL)
- ✓ No requiere recalcular préstamos existentes
- ✓ Migracion una sola vez por instalación
- ✓ Frontend sin cambios necesarios