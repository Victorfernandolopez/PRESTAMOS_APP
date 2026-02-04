"""
Script de migración segura FASE 1.

Objetivo:
- Agregar columnas periodo_origen y tasa_interes a la tabla prestamos
- NO recrear tablas
- NO eliminar datos
- Rellenar periodo_origen desde fecha_creacion de registros existentes
- Dejar tasa_interes en NULL para compatibilidad backward

RESTRICCIONES:
- NO modificar datos financieros
- NO recalcular montos
- NO cambiar estados
"""

import sqlite3
from datetime import date
from pathlib import Path
import sys

# Determinar ruta de BD
def get_database_path():
    """Obtener la ruta de la base de datos SQLite"""
    # Ruta correcta: C:\Users\User\AppData\Local\PrestamosManager\prestamos.db
    app_data = Path.home() / "AppData" / "Local" / "PrestamosManager"
    db_path = app_data / "prestamos.db"
    
    if not db_path.exists():
        print(f"✗ ERROR: No se encontró BD en {db_path}")
        print(f"  Verifica que exista en: C:\\Users\\User\\AppData\\Local\\PrestamosManager\\")
        return None
    
    return db_path

def check_column_exists(conn, table, column):
    """Verificar si una columna existe en una tabla"""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def migrate():
    """Ejecutar la migración"""
    db_path = get_database_path()
    if not db_path:
        return False
    
    print(f"Conectando a BD: {db_path}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Verificar si la tabla prestamos existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='prestamos'")
        if not cursor.fetchone():
            print("✗ ERROR: Tabla 'prestamos' no encontrada")
            conn.close()
            return False
        
        print("✓ Tabla 'prestamos' encontrada")
        
        # Verificar y agregar columna periodo_origen
        if not check_column_exists(conn, 'prestamos', 'periodo_origen'):
            print("Agregando columna periodo_origen...")
            cursor.execute("""
                ALTER TABLE prestamos
                ADD COLUMN periodo_origen TEXT
            """)
            conn.commit()
            print("✓ Columna periodo_origen agregada")
            
            # Rellenar con datos históricos desde fecha_creacion
            print("Rellenando periodo_origen desde fecha_creacion...")
            cursor.execute("""
                UPDATE prestamos
                SET periodo_origen = CASE
                    WHEN fecha_creacion IS NOT NULL
                    THEN strftime('%Y-%m', fecha_creacion)
                    ELSE NULL
                END
                WHERE periodo_origen IS NULL
            """)
            updated = cursor.rowcount
            conn.commit()
            print(f"✓ {updated} registros actualizados con periodo_origen")
        else:
            print("⊘ Columna periodo_origen ya existe")
        
        # Verificar y agregar columna tasa_interes
        if not check_column_exists(conn, 'prestamos', 'tasa_interes'):
            print("Agregando columna tasa_interes...")
            cursor.execute("""
                ALTER TABLE prestamos
                ADD COLUMN tasa_interes REAL
            """)
            conn.commit()
            print("✓ Columna tasa_interes agregada (todos los valores en NULL)")
        else:
            print("⊘ Columna tasa_interes ya existe")
        
        # Verificar estado final
        cursor.execute("PRAGMA table_info(prestamos)")
        columns = {row[1]: row[2] for row in cursor.fetchall()}
        
        print("\nEstado final de tabla prestamos:")
        print(f"  Total columnas: {len(columns)}")
        print(f"  periodo_origen: {'✓' if 'periodo_origen' in columns else '✗'}")
        print(f"  tasa_interes: {'✓' if 'tasa_interes' in columns else '✗'}")
        
        # Verificar integridad de datos
        cursor.execute("SELECT COUNT(*) FROM prestamos")
        total_prestamos = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM prestamos WHERE periodo_origen IS NOT NULL")
        con_periodo = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM prestamos WHERE tasa_interes IS NOT NULL")
        con_tasa = cursor.fetchone()[0]
        
        print(f"\nIntegridad de datos:")
        print(f"  Total préstamos: {total_prestamos}")
        print(f"  Con periodo_origen: {con_periodo}")
        print(f"  Con tasa_interes: {con_tasa}")
        
        if total_prestamos > 0 and con_periodo != total_prestamos:
            print(f"⚠ ADVERTENCIA: {total_prestamos - con_periodo} préstamos sin periodo_origen")
        
        conn.close()
        print("\n✓ Migración completada exitosamente")
        return True
        
    except sqlite3.Error as e:
        print(f"✗ ERROR de BD: {str(e)}")
        return False
    except Exception as e:
        print(f"✗ ERROR inesperado: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("MIGRACIÓN FASE 1")
    print("=" * 50)
    print()
    
    success = migrate()
    
    if success:
        print("\n✓ La BD está lista para la FASE 1")
        sys.exit(0)
    else:
        print("\n✗ La migración falló")
        sys.exit(1)
