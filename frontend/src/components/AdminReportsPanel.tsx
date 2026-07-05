import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flag, RefreshCw, Check, X, Eye, ChevronLeft, ExternalLink, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminReports,
  updateReportStatus,
  type AdminReportRow,
  type QuestionReportStatus,
  type QuestionReportReason,
} from '../lib/questions';

const SUPABASE_STORAGE_URL =
  'https://bmsmmlymsjpydpealmcw.supabase.co/storage/v1/object/public/questions-images';

const STATUS_META: Record<QuestionReportStatus, { label: string; classes: string }> = {
  open: { label: 'Abierto', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' },
  reviewing: { label: 'En revisión', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  resolved: { label: 'Corregido', classes: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  rejected: { label: 'Descartado', classes: 'bg-gray-200 text-gray-600 dark:bg-gray-600/40 dark:text-gray-300' },
};

const REASON_LABEL: Record<QuestionReportReason, string> = {
  clave_incorrecta: 'Clave incorrecta',
  opciones_incorrectas: 'Opciones incorrectas',
  enunciado_confuso: 'Enunciado confuso',
  error_tipografico: 'Error tipográfico',
  imagen_no_carga: 'Imagen no carga',
  otro: 'Otro',
};

const SUBJECT_LABEL: Record<string, string> = {
  M1: 'Matemática 1', M2: 'Matemática 2', L: 'Lenguaje', H: 'Historia',
  C: 'Ciencias', CF: 'Física', CQ: 'Química', CB: 'Biología',
};

const STATUS_FILTERS: { value: QuestionReportStatus | 'all'; label: string }[] = [
  { value: 'open', label: 'Abiertos' },
  { value: 'reviewing', label: 'En revisión' },
  { value: 'resolved', label: 'Corregidos' },
  { value: 'rejected', label: 'Descartados' },
  { value: 'all', label: 'Todos' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface AdminReportsPanelProps {
  onExit: () => void;
}

export function AdminReportsPanel({ onExit }: AdminReportsPanelProps) {
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<QuestionReportStatus | 'all'>('open');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAdminReports({
        status: statusFilter,
        subject: subjectFilter,
      });
      setReports(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, subjectFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const subjectsInData = useMemo(() => {
    const set = new Set(reports.map((r) => r.question.subject));
    return Array.from(set).sort();
  }, [reports]);

  const handleAction = async (report: AdminReportRow, status: QuestionReportStatus) => {
    setBusyId(report.id);
    try {
      await updateReportStatus(report.id, status);
      toast.success(`Reporte marcado como "${STATUS_META[status].label}"`);
      // Si el filtro es por status específico, el ítem sale de la lista
      if (statusFilter !== 'all' && statusFilter !== status) {
        setReports((prev) => prev.filter((r) => r.id !== report.id));
      } else {
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, status } : r))
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Volver"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Flag className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Reportes de preguntas
            </h2>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {subjectsInData.length > 1 && (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="ml-auto px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-200"
          >
            <option value="all">Todas las materias</option>
            {subjectsInData.map((s) => (
              <option key={s} value={s}>{SUBJECT_LABEL[s] ?? s}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <Flag className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No hay reportes con este filtro.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {reports.length} reporte{reports.length !== 1 ? 's' : ''}
          </p>
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              busy={busyId === report.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReportCardProps {
  report: AdminReportRow;
  busy: boolean;
  onAction: (report: AdminReportRow, status: QuestionReportStatus) => void;
}

function ReportCard({ report, busy, onAction }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const q = report.question;
  const statusMeta = STATUS_META[report.status];
  const imageSrc = q.image_url ? `${SUPABASE_STORAGE_URL}/${q.image_url}` : null;
  const dashboardUrl = `https://supabase.com/dashboard/project/bmsmmlymsjpydpealmcw/editor?filter=id:eq:${q.id}`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusMeta.classes}`}>
            {statusMeta.label}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300">
            {REASON_LABEL[report.reason] ?? report.reason}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {SUBJECT_LABEL[q.subject] ?? q.subject}
          </span>
          {q.tema && (
            <span className="text-xs text-gray-400">{q.tema}</span>
          )}
          <span className="ml-auto text-xs text-gray-400">{formatDate(report.created_at)}</span>
        </div>

        {report.details && (
          <div className="mb-3 text-sm text-gray-800 dark:text-gray-100 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2">
            <span className="font-medium text-amber-700 dark:text-amber-300">Comentario: </span>
            {report.details}
          </div>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white flex items-start gap-2"
        >
          <Eye className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
          <span className={expanded ? '' : 'line-clamp-2'}>{q.content}</span>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Imagen de la pregunta"
                className="max-h-64 rounded-lg border border-gray-200 dark:border-gray-700"
              />
            )}
            {q.options && (
              <ul className="space-y-1">
                {Object.entries(q.options).map(([key, val]) => {
                  const isCorrect = key.toUpperCase() === q.correct_answer?.toUpperCase();
                  return (
                    <li
                      key={key}
                      className={`text-sm px-3 py-1.5 rounded-lg border ${
                        isCorrect
                          ? 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-300 font-medium'
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="font-semibold mr-2">{key.toUpperCase()})</span>
                      {val}
                      {isCorrect && <span className="ml-2 text-xs">✓ clave</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            {report.user_answer && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Respuesta del alumno: <span className="font-medium">{report.user_answer.toUpperCase()}</span>
              </p>
            )}
            {q.explanation && (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                <span className="font-medium">Explicación: </span>{q.explanation}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
              {q.origen && <span>Origen: {q.origen}</span>}
              {report.reporter_email && <span>Reportado por: {report.reporter_email}</span>}
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
              >
                <ExternalLink className="w-3 h-3" /> Editar en Supabase
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        {report.status !== 'reviewing' && (
          <button
            onClick={() => onAction(report, 'reviewing')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" /> En revisión
          </button>
        )}
        {report.status !== 'resolved' && (
          <button
            onClick={() => onAction(report, 'resolved')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-500/30 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Corregido
          </button>
        )}
        {report.status !== 'rejected' && (
          <button
            onClick={() => onAction(report, 'rejected')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-200 text-gray-600 dark:bg-gray-600/40 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" /> Descartar
          </button>
        )}
        {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400 self-center" />}
      </div>
    </div>
  );
}
