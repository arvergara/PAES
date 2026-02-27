// ============================================================================
// QuestionContent.tsx — Renderiza contenido de preguntas con tablas e imágenes
// Reemplaza el texto plano del content con tablas formateadas + imágenes
// ============================================================================

import { useState } from 'react';

interface QuestionContentProps {
  content: string;
  imagenUrl?: string | null;
}

/**
 * Parsea una tabla markdown y la convierte a JSX
 */
function MarkdownTable({ tableStr }: { tableStr: string }) {
  const rows = tableStr.trim().split('\n').filter(r => r.trim());
  
  // Filtrar la fila separadora (|---|---|)
  const dataRows = rows.filter(r => !r.match(/^\|[\s\-:|]+\|$/));
  
  if (dataRows.length === 0) return null;
  
  const parseRow = (row: string) =>
    row.split('|').map(c => c.trim()).filter(c => c !== '');
  
  const header = parseRow(dataRows[0]);
  const body = dataRows.slice(1).map(parseRow);

  return (
    <div style={{ overflowX: 'auto', margin: '12px 0' }}>
      <table style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontSize: '0.9rem',
      }}>
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i} style={{
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                fontWeight: 600,
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '6px 12px',
                  backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)',
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Imagen de pregunta con zoom
 */
function QuestionImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  if (error) return null;

  return (
    <>
      <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
        {!loaded && !error && (
          <div style={{
            width: '100%', maxWidth: 500, height: 200,
            backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af', fontSize: 14,
          }}>
            Cargando figura...
          </div>
        )}
        <img
          src={src} alt="Figura de la pregunta"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          onClick={() => setZoomed(true)}
          style={{
            maxWidth: '100%', width: 'auto', maxHeight: 400,
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'zoom-in', display: loaded ? 'block' : 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
      {zoomed && (
        <div onClick={() => setZoomed(false)} style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'zoom-out', padding: 24,
        }}>
          <img src={src} alt="Figura" style={{
            maxWidth: '95vw', maxHeight: '90vh', borderRadius: 8,
          }} />
          <div style={{ position: 'absolute', top: 16, right: 16, color: 'white', fontSize: 14, opacity: 0.7 }}>
            Clic para cerrar
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Parsea el contenido de una pregunta:
 * - Detecta tablas markdown y las renderiza como <table>
 * - Convierte \n en saltos de línea
 * - Muestra imagen si existe
 */
export function QuestionContent({ content, imagenUrl }: QuestionContentProps) {
  // Reemplazar \n literal (string) por saltos de línea reales
  const normalized = content.replace(/\\n/g, '\n');

  // Separar bloques de texto y tablas
  const parts: { type: 'text' | 'table'; value: string }[] = [];
  
  // Regex para detectar tablas markdown (líneas consecutivas con |)
  const lines = normalized.split('\n');
  let currentTable: string[] = [];
  let currentText: string[] = [];

  const flushText = () => {
    if (currentText.length > 0) {
      parts.push({ type: 'text', value: currentText.join('\n') });
      currentText = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      parts.push({ type: 'table', value: currentTable.join('\n') });
      currentTable = [];
    }
  };

  for (const line of lines) {
    const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
    
    if (isTableLine) {
      flushText();
      currentTable.push(line);
    } else {
      flushTable();
      currentText.push(line);
    }
  }
  flushText();
  flushTable();

  return (
    <div>
      {parts.map((part, index) => {
        if (part.type === 'table') {
          return <MarkdownTable key={index} tableStr={part.value} />;
        }
        
        // Renderizar texto con saltos de línea
        const textLines = part.value.split('\n').filter(l => l.trim() !== '' || index > 0);
        return (
          <div key={index}>
            {textLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < textLines.length - 1 && <br />}
              </span>
            ))}
          </div>
        );
      })}
      
      {/* Imagen si existe */}
      {imagenUrl && <QuestionImage src={imagenUrl} />}
    </div>
  );
}