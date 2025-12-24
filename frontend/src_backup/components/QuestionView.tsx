import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Image as ImageIcon,
  BarChart3,
  Table,
  FileImage,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import type { Question, QuestionImage, QuestionTable } from '../types';
import { getTablesForQuestion } from '../lib/questions';

interface QuestionViewProps {
  question: Question;
  currentAnswer: string | null;
  onAnswer: (answer: string) => void;
  showExplanation?: boolean;
}

const confidenceColor = (confidence?: number) => {
  if (confidence === undefined) return 'bg-yellow-100 text-yellow-700';
  if (confidence >= 0.75) return 'bg-emerald-100 text-emerald-700';
  if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export function QuestionView({
  question,
  currentAnswer,
  onAnswer,
  showExplanation = false,
}: QuestionViewProps) {
  const [tables, setTables] = useState<QuestionTable[]>(question.tables || []);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);

  const options = useMemo(() => {
    const entries = Object.entries(question.options || {})
      .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries;
  }, [question.options]);
  const hasOptions = options.length > 0;

  const images = question.image_details || question.images || [];
  const hasImages = images.length > 0;

  const getImageIcon = (type: QuestionImage['type']) => {
    switch (type) {
      case 'diagram':
        return <FileImage className="w-4 h-4" />;
      case 'graph':
        return <BarChart3 className="w-4 h-4" />;
      case 'table':
        return <Table className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getImageTypeLabel = (type: QuestionImage['type']) => {
    switch (type) {
      case 'diagram':
        return 'Diagrama';
      case 'graph':
        return 'Gráfico';
      case 'table':
        return 'Tabla';
      case 'icon':
        return 'Icono';
      default:
        return 'Imagen';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTables = async () => {
      if (!question.tableCount || question.tableCount === 0 || (question.tables && question.tables.length)) {
        setTables(question.tables || []);
        setTablesError(null);
        setLoadingTables(false);
        return;
      }

      try {
        setLoadingTables(true);
        setTablesError(null);
        const tableData = await getTablesForQuestion(question.id);
        if (isMounted) {
          setTables(tableData);
        }
      } catch (error) {
        console.error('Error loading tables:', error);
        if (isMounted) {
          setTablesError('No fue posible cargar las tablas asociadas');
        }
      } finally {
        if (isMounted) {
          setLoadingTables(false);
        }
      }
    };

    fetchTables();

    return () => {
      isMounted = false;
    };
  }, [question.id, question.tableCount, question.tables]);

  const classificationConfidence = question.classification_confidence ?? question.ai_classification?.overall_confidence;
  const metadata = (question.metadata ?? {}) as Record<string, unknown>;
  const pdfSource = typeof metadata.pdf_source === 'string' ? metadata.pdf_source : undefined;
  const pageNumber = typeof metadata.page_number === 'number' ? metadata.page_number : undefined;
  const questionNumber = typeof metadata.question_number === 'number' ? metadata.question_number : undefined;

  const confidenceLabel = classificationConfidence !== undefined ? `${(classificationConfidence * 100).toFixed(1)}%` : null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-16rem)]">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 mb-4">
        {(pdfSource || questionNumber !== undefined || pageNumber !== undefined) && (
          <div className="flex flex-wrap gap-2 mb-4 text-sm text-gray-600">
            {pdfSource && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                <FileText className="w-4 h-4" />
                {pdfSource}
              </span>
            )}
            {questionNumber !== undefined && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                🔢 Pregunta {questionNumber}
              </span>
            )}
            {pageNumber !== undefined && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                📄 Página {pageNumber}
              </span>
            )}
          </div>
        )}

        {(question.area_tematica || question.tema) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {question.area_tematica && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                📚 {question.area_tematica}
              </span>
            )}
            {question.tema && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                📖 {question.tema}
              </span>
            )}
            {question.habilidad && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                🎯 {question.habilidad}
              </span>
            )}
            {confidenceLabel && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${confidenceColor(classificationConfidence)}`}>
                🔍 Confianza {confidenceLabel}
              </span>
            )}
          </div>
        )}

        <div className="prose max-w-none mb-6">
          <p className="text-lg text-gray-800 whitespace-pre-line">{question.content}</p>
        </div>

        {hasImages && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div key={image.id || index} className="relative group">
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <img
                      src={image.url}
                      alt={image.alt || `${getImageTypeLabel(image.type)} ${index + 1}`}
                      className="w-full h-auto rounded shadow-sm"
                      loading="lazy"
                    />
                    <div className="mt-2 flex items-center justify-center text-sm text-gray-600">
                      {getImageIcon(image.type)}
                      <span className="ml-1">{getImageTypeLabel(image.type)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.tableCount && question.tableCount > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-gray-700">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-semibold">Tablas asociadas ({question.tableCount})</span>
            </div>

            {loadingTables && <div className="text-sm text-gray-500">Cargando tablas...</div>}
            {tablesError && <div className="text-sm text-red-600">{tablesError}</div>}

            {!loadingTables && !tablesError && tables.length === 0 && (
              <div className="text-sm text-gray-500">
                No se encontraron tablas disponibles para esta pregunta.
              </div>
            )}

            <div className="space-y-4">
              {tables.map((table) => (
                <div key={table.id} className="overflow-x-auto border border-gray-200 rounded-lg">
                  {typeof table.page_number === 'number' && (
                    <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                      Página {table.page_number}
                    </div>
                  )}
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <tbody>
                      {table.table_content.map((row, rowIndex) => (
                        <tr key={`${table.id}-${rowIndex}`} className="divide-x divide-gray-200">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${table.id}-${rowIndex}-${cellIndex}`}
                              className="px-3 py-2 whitespace-pre-wrap align-top"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {!hasOptions && (
            <div className="text-sm text-gray-500">Esta pregunta no contiene alternativas registradas.</div>
          )}
          {options.map(([key, value]) => {
            const isSelected = currentAnswer === key;
            const isCorrect = showExplanation && key === question.correctAnswer;
            const isWrong = showExplanation && isSelected && key !== question.correctAnswer;

            return (
              <button
                key={key}
                onClick={() => onAnswer(key)}
                disabled={showExplanation}
                className={clsx(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  'hover:border-indigo-500 hover:bg-indigo-50',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  {
                    'border-gray-200 bg-white': !isSelected && !isCorrect && !isWrong,
                    'border-indigo-500 bg-indigo-50': isSelected && !showExplanation,
                    'border-green-500 bg-green-50': isCorrect,
                    'border-red-500 bg-red-50': isWrong,
                  }
                )}
              >
                <div className="flex items-start">
                  <span className="font-semibold text-lg mr-3">{key.toUpperCase()})</span>
                  <span className="text-lg whitespace-pre-line">{value ?? ''}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="w-full max-w-3xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-900 mb-2">Explicación:</h4>
          <p className="text-blue-800 whitespace-pre-line">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
