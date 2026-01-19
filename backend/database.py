import os
import shutil
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# =========================
# RUTAS BASE
# =========================

# Carpeta actual (backend/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ruta absoluta a la base de datos SQLite
DB_PATH = os.path.join(BASE_DIR, "prestamos.db")

# URL que usa SQLAlchemy
DATABASE_URL = f"sqlite:///{DB_PATH}"

# =========================
# SQLALCHEMY
# =========================

# Engine de conexión (SQLite requiere check_same_thread=False)
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Sesiones de BD
SessionLocal = sessionmaker(bind=engine)

# Base para los modelos ORM
Base = declarative_base()

# =========================
# BACKUPS
# =========================

# Carpeta /backend/../backups  → queda al lado de backend
BACKUP_DIR = os.path.join(BASE_DIR, "..", "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)


def backup_database():
    """
    Crea una copia física del archivo prestamos.db.
    Se puede llamar después de operaciones críticas (POST / PUT).
    """
    print("🟡 Ejecutando backup...")

    # Si la base aún no existe, no se puede copiar
    if not os.path.exists(DB_PATH):
        print("🔴 No existe prestamos.db, backup cancelado")
        return

    # Timestamp para no pisar backups
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Nombre del archivo de backup
    backup_path = os.path.join(
        BACKUP_DIR,
        f"prestamos_{timestamp}.db"
    )

    # Copia binaria segura
    shutil.copy2(DB_PATH, backup_path)

    print(f"🟢 Backup creado: {backup_path}")
