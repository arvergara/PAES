import React, { useState, memo, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FileText, ChevronLeft, ChevronRight, Loader2, Maximize2, X, Clock, BookOpen } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
  pageStart?: number;
  pageEnd?: number;
  title?: string;
  timeLeft?: number;
  isReadingPhase?: boolean;
}

interface PdfContentProps {
  pdfUrl: string;
  currentPage: number;
  width: number;
  onLoadSuccess: (data: { numPages: number }) => void;
  onLoadError: (err: Error) => void;
  error: string | null;
}

// Componente interno memoizado para el contenido del PDF - evita parpadeo
const MemoizedPdfContent = memo(function PdfContent({ 
  pdfUrl, 
  currentPage, 
  width,
  onLoadSuccess,
  onLoadError,
  error
}: PdfContentProps) {
  return (
    <>
      {error ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            <p className="font-medium">{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              No se pudo cargar el texto. Intenta recargar la página.
            </p>
          </div>
        </div>
      ) : (
        <Document
          file={pdfUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Cargando PDF...</span>
              </div>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            loading={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-600 dark:text-gray-300" />
              </div>
            }
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
            width={width}
          />
        </Document>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar el PDF si cambian estas props específicas
  return (
    prevProps.pdfUrl === nextProps.pdfUrl &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.width === nextProps.width &&
    prevProps.error === nextProps.error
  );
});

export function PdfViewer({ pdfUrl, pageStart = 1, pageEnd, title, timeLeft, isReadingPhase }: PdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(pageStart);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Resetear a página inicial cuando cambie el texto
  React.useEffect(() => {
    setCurrentPage(pageStart);
  }, [pageStart, pdfUrl]);

  // Calcular el rango de páginas efectivo
  const effectiveEndPage = pageEnd || numPages || pageStart;
  const totalPagesInRange = effectiveEndPage - pageStart + 1;
  const pageIndexInRange = currentPage - pageStart + 1;

  // Callbacks memoizados para evitar re-creación
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF:', err);
    setError('Error al cargar el PDF');
    setLoading(false);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => prev > pageStart ? prev - 1 : prev);
  }, [pageStart]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => prev < effectiveEndPage ? prev + 1 : prev);
  }, [effectiveEndPage]);

  // Cerrar con ESC
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    if (isExpanded) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const canGoPrevious = currentPage > pageStart;
  const canGoNext = currentPage < effectiveEndPage;

  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft !== undefined && timeLeft < 30;

  // Calcular width una sola vez (memoizado)
  const normalWidth = useMemo(() => Math.min(800, window.innerWidth - 80), []);
  const expandedWidth = useMemo(() => Math.min(650, window.innerWidth - 120), []);

  const NavigationControls = memo(function NavigationControls({ expanded = false }: { expanded?: boolean }) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={goToPreviousPage}
          disabled={!canGoPrevious}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoPrevious 
              ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200' 
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <span className={`text-sm text-gray-600 dark:text-gray-300 min-w-[80px] text-center ${expanded ? 'text-base' : ''}`}>
          {pageIndexInRange} de {totalPagesInRange}
        </span>
        
        <button
          onClick={goToNextPage}
          disabled={!canGoNext}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoNext 
              ? 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200' 
              : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          }`}
          title="Página siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  });

  return (
    <>
      {/* Visor normal */}
      <div 
        className="relative flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
        style={{ height: 'calc(100vh - 300px)', maxHeight: '70vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <FileText className="w-5 h-5" />
            <span className="font-medium">{title || 'Texto de lectura'}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <NavigationControls />

            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title="Expandir texto"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Expandir</span>
            </button>
          </div>
        </div>

        {/* PDF Viewer - Contenido memoizado para evitar parpadeo */}
        <div className="flex-1 overflow-auto flex justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <MemoizedPdfContent 
            pdfUrl={pdfUrl}
            currentPage={currentPage}
            width={normalWidth}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            error={error}
          />
        </div>
      </div>

      {/* Modal expandido con fondo difuminado */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsExpanded(false)}
        >
          {/* Fondo difuminado */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Contenedor del PDF */}
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[95vh] max-w-[95vw] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                <FileText className="w-6 h-6" />
                <span className="font-semibold text-lg">{title || 'Texto de lectura'}</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Timer en el modal expandido */}
                {timeLeft !== undefined && (
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isLowTime 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    <Clock className={`h-5 w-5 ${isLowTime ? 'animate-pulse' : ''}`} />
                    <span className="font-mono font-medium text-lg">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                
                {/* Badge de fase de lectura */}
                {isReadingPhase && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg">
                    <BookOpen className="h-4 w-4" />
                    <span className="font-medium text-sm">Fase de Lectura</span>
                  </div>
                )}
                
                <NavigationControls expanded />
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  title="Cerrar (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF en modal - Contenido memoizado */}
            <div className="overflow-auto p-6 bg-gray-100 dark:bg-gray-900 flex justify-center">
              <MemoizedPdfContent 
                pdfUrl={pdfUrl}
                currentPage={currentPage}
                width={expandedWidth}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                error={error}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
