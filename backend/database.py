import os
import shutil
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# =========================
# RUTA ESCRIBIBLE SEGURA
# =========================

APP_NAME = "PrestamosManager"

BASE_DIR = os.path.join(
    os.getenv("LOCALAPPDATA") or os.getcwd(),
    APP_NAME
)

os.makedirs(BASE_DIR, exist_ok=True)

DB_PATH = os.path.join(BASE_DIR, "prestamos.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# =========================
# SQLALCHEMY
# =========================

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# =========================
# BACKUPS
# =========================

BACKUP_DIR = os.path.join(BASE_DIR, "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

def backup_database():
    if not os.path.exists(DB_PATH):
        return

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"prestamos_{timestamp}.db")
    shutil.copy2(DB_PATH, backup_path)
