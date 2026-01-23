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