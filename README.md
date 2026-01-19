# 📌 Sistema de Préstamos Privados

Aplicación **fullstack** para la gestión de préstamos privados, clientes, archivos asociados, inversores y control de cobros.  
Pensada para uso local (desktop / Electron) con backend en FastAPI y frontend en React.

---

## 🧩 Funcionalidades

### 👤 Clientes
- Alta y listado de clientes
- Datos de contacto y observaciones
- Carga de archivos por cliente (DNI, selfies, comprobantes)
- Visualización de archivos asociados

### 💸 Préstamos
- Creación de préstamos por cliente
- Cálculo automático de intereses
- Control de vencimientos
- Detección de morosos
- Cobro total o parcial
- Agregar monto a préstamos existentes

### 📈 Inversores
- Alta de inversores
- Cálculo de ganancias por tasa diaria
- Liquidación de inversiones

### 🛡️ Seguridad de datos
- Base de datos SQLite
- Backups automáticos de la base de datos ante cambios críticos

---

## 🏗️ Arquitectura

prestamos_app/
│
├── backend/
│ ├── main.py # API FastAPI
│ ├── database.py # DB + backups
│ ├── models.py # Modelos SQLAlchemy
│ ├── schemas.py # Schemas Pydantic
│ ├── crud.py # Lógica de negocio
│ └── prestamos.db # Base de datos SQLite
│
├── components/ # Componentes React
├── services/ # Servicios API frontend
├── uploads/ # Archivos de clientes
├── backups/ # Backups automáticos
│
├── App.tsx
├── types.ts
├── package.json
├── requirements.txt
└── README.md


---

## ⚙️ Requisitos

- Python **3.10+**
- Node.js **18+**
- Git

---

## 🐍 Backend – Instalación

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno
source venv/Scripts/activate   # Windows Git Bash
# source venv/bin/activate     # Linux / Mac

# Instalar dependencias
pip install -r requirements.txt

Ejecutar backend
python -m uvicorn backend.main:app --reload

API disponible en:
http://127.0.0.1:8000

Frontend – Instalación
npm install
npm run dev

Backups

Los backups se generan automáticamente cuando hay cambios en la base de datos.

Estado del proyecto

✅ Versión v1 estable
Funcional
Sin errores críticos
Lista para uso real
Base sólida para nuevas features


Próximas mejoras (planificadas)
Notificaciones por WhatsApp
Alertas de vencimiento
Reportes exportables
Autenticación
Roles de usuario