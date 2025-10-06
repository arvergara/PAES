/*
  # Create temario table

  1. New Tables
    - `temario`
      - Stores the curriculum structure
      - Links subjects with areas, temas, and subtemas
      - Ensures data consistency

  2. Structure
    - Hierarchical organization:
      - Subject
      - Area Tematica
      - Tema
      - Subtema
*/

CREATE TABLE IF NOT EXISTS temario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  area_tematica text NOT NULL,
  tema text NOT NULL,
  subtema text,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true,

  -- Ensure unique combinations
  UNIQUE (subject, area_tematica, tema, subtema),

  -- Subject validation
  CONSTRAINT valid_subject CHECK (subject IN ('M1', 'M2', 'L', 'C', 'H')),

  -- Area validation based on subject
  CONSTRAINT valid_area_tematica CHECK (
    (subject = 'M1' AND area_tematica IN (
      'Números',
      'Álgebra y Funciones',
      'Geometría',
      'Probabilidad y Estadística'
    )) OR
    (subject = 'M2' AND area_tematica IN (
      'Números',
      'Álgebra y Funciones',
      'Geometría',
      'Probabilidad y Estadística'
    )) OR
    (subject = 'L' AND area_tematica IN (
      'Localizar',
      'Interpretar',
      'Evaluar'
    )) OR
    (subject = 'C' AND area_tematica IN (
      'Biología',
      'Química',
      'Física'
    )) OR
    (subject = 'H' AND area_tematica IN (
      'Historia Universal',
      'Historia de Chile',
      'Geografía'
    ))
  )
);

-- Enable RLS
ALTER TABLE temario ENABLE ROW LEVEL SECURITY;

-- Create policy for reading temario
CREATE POLICY "Anyone can read active temario"
  ON temario
  FOR SELECT
  USING (active = true);

-- Create policy for admin updates
CREATE POLICY "Only admins can update temario"
  ON temario
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Create indexes
CREATE INDEX idx_temario_subject ON temario(subject);
CREATE INDEX idx_temario_area_tematica ON temario(area_tematica);
CREATE INDEX idx_temario_tema ON temario(tema);
CREATE INDEX idx_temario_active ON temario(active);