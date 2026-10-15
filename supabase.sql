-- SQL para Supabase - Migración segura para tabla personas
-- Ejecutar en el SQL Editor de Supabase (funciona aunque la tabla ya exista)

-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS personas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    genero CHAR(1) NOT NULL CHECK (genero IN ('M', 'F', 'O')),
    edad INTEGER NOT NULL DEFAULT 0 CHECK (edad >= 0 AND edad <= 120),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agregar columna edad si no existe (para tablas creadas antes)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS edad INTEGER NOT NULL DEFAULT 0 CHECK (edad >= 0 AND edad <= 120);

-- 3. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_personas_cedula ON personas(cedula);
CREATE INDEX IF NOT EXISTS idx_personas_nombre_apellido ON personas(nombre, apellido);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas (ignorar error si ya existen)
DO $$ BEGIN
    CREATE POLICY "Permitir lectura a usuarios autenticados" ON personas
        FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir inserción a usuarios autenticados" ON personas
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir actualización a usuarios autenticados" ON personas
        FOR UPDATE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Permitir eliminación a usuarios autenticados" ON personas
        FOR DELETE USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_personas_updated_at ON personas;
CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Datos de prueba (opcional) - solo inserta si no existen las cédulas
INSERT INTO personas (nombre, apellido, cedula, genero, edad) VALUES
    ('Juan', 'Pérez', '12345678', 'M', 30),
    ('María', 'González', '87654321', 'F', 25),
    ('Carlos', 'Rodríguez', '11223344', 'M', 35),
    ('Ana', 'Martínez', '44332211', 'F', 28)
ON CONFLICT (cedula) DO NOTHING;

-- Consultas útiles:

-- Obtener todas las personas
-- SELECT * FROM personas ORDER BY created_at DESC;

-- Buscar por cédula
-- SELECT * FROM personas WHERE cedula = '12345678';

-- Buscar por nombre o apellido
-- SELECT * FROM personas WHERE nombre ILIKE '%juan%' OR apellido ILIKE '%perez%';

-- Contar total de personas
-- SELECT COUNT(*) FROM personas;

-- Contar por género
-- SELECT genero, COUNT(*) FROM personas GROUP BY genero;