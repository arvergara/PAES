import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Trophy, Target, Clock, TrendingUp, Home, RotateCcw, ChevronDown, ChevronUp, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { Question } from '../types';

interface ResultsViewProps {
  questions: Question[];
  answers: Record<string, string>;
  timeSpent: number;
  onExit: () => void;
  onRetry?: () => void;
}

export function ResultsView({ questions, answers, timeSpent, onExit, onRetry }: ResultsViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const results = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const byArea: Record<string, { correct: number; total: number }> = {};
    const details: Array<{
      index: number;
      question: Question;
      userAnswer: string | null;
      isCorrect: boolean;
      isUnanswered: boolean;
    }> = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index] || null;
      const area = question.area_tematica || question.areaTematica || 'Sin clasificar';
      if (!byArea[area]) byArea[area] = { correct: 0, total: 0 };
      byArea[area].total += 1;

      const isUnanswered = !userAnswer;
      const isCorrect = userAnswer === question.correctAnswer;

      if (isUnanswered) unanswered += 1;
      else if (isCorrect) { correct += 1; byArea[area].correct += 1; }
      else incorrect += 1;

      details.push({ index, question, userAnswer, isCorrect: !isUnanswered && isCorrect, isUnanswered });
    });

    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const avgTimePerQuestion = total > 0 ? Math.round(timeSpent / total) : 0;
    return { correct, incorrect, unanswered, total, percentage, avgTimePerQuestion, byArea, details };
  }, [questions, answers, timeSpent]);

  const pieData = [
    { name: 'Correctas', value: results.correct, color: '#10B981' },
    { name: 'Incorrectas', value: results.incorrect, color: '#EF4444' },
    { name: 'Sin responder', value: results.unanswered, color: '#9CA3AF' },
  ].filter((d) => d.value > 0);

  const barData = Object.entries(results.byArea).map(([area, data]) => ({
    area: area.length > 15 ? area.substring(0, 15) + '...' : area,
    Correctas: data.correct,
    Incorrectas: data.total - data.correct,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excelente!', color: 'text-emerald-600' };
    if (percentage >= 75) return { text: 'Muy bien!', color: 'text-blue-600' };
    if (percentage >= 60) return { text: 'Buen trabajo', color: 'text-yellow-600' };
    if (percentage >= 40) return { text: 'Puedes mejorar', color: 'text-orange-600' };
    return { text: 'Sigue practicando', color: 'text-red-600' };
  };

  const scoreMessage = getScoreMessage(results.percentage);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8 shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 mr-4" />
          <h1 className="text-3xl font-bold">Resultados</h1>
        </div>
        <div className="text-center">
          <div className="text-7xl font-bold mb-2">{results.percentage}%</div>
          <div className={'text-2xl font-semibold ' + scoreMessage.color + ' bg-white rounded-full px-6 py-2 inline-block'}>
            {scoreMessage.text}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-emerald-500">
          <div className="flex items-center text-emerald-600 mb-2">
            <Target className="w-5 h-5 mr-2" /><span className="text-sm font-medium">Correctas</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{results.correct}</div>
          <div className="text-sm text-gray-500">de {results.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-red-500">
          <div className="flex items-center text-red-600 mb-2">
            <Target className="w-5 h-5 mr-2" /><span className="text-sm font-medium">Incorrectas</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{results.incorrect}</div>
          <div className="text-sm text-gray-500">de {results.total}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-blue-500">
          <div className="flex items-center text-blue-600 mb-2">
            <Clock className="w-5 h-5 mr-2" /><span className="text-sm font-medium">Tiempo total</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{formatTime(timeSpent)}</div>
          <div className="text-sm text-gray-500">minutos</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border-l-4 border-purple-500">
          <div className="flex items-center text-purple-600 mb-2">
            <TrendingUp className="w-5 h-5 mr-2" /><span className="text-sm font-medium">Promedio</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{results.avgTimePerQuestion}s</div>
          <div className="text-sm text-gray-500">por pregunta</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Distribucion</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => name + ': ' + value}>
                {pieData.map((entry, index) => (<Cell key={'cell-' + index} fill={entry.color} />))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Por area</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="area" width={100} tick={{ fontSize: 12 }} />
                <Tooltip /><Legend />
                <Bar dataKey="Correctas" stackId="a" fill="#10B981" />
                <Bar dataKey="Incorrectas" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="flex items-center justify-center h-[250px] text-gray-500">Sin datos</div>)}
        </div>
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full bg-white rounded-xl p-4 shadow-md flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-800">Ver detalle de respuestas</span>
          {showDetails ? <ChevronUp className="w-6 h-6 text-gray-600" /> : <ChevronDown className="w-6 h-6 text-gray-600" />}
        </button>

        {showDetails && (
          <div className="mt-4 space-y-4">
            {results.details.map(({ index, question, userAnswer, isCorrect, isUnanswered }) => (
              <div
                key={index}
                className={'bg-white rounded-xl p-4 shadow-md border-l-4 ' + (isUnanswered ? 'border-gray-400' : isCorrect ? 'border-emerald-500' : 'border-red-500')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {isUnanswered ? (
                      <MinusCircle className="w-6 h-6 text-gray-400" />
                    ) : isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-800">Pregunta {index + 1}</span>
                      {question.area_tematica && (
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                          {question.area_tematica}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{question.content}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className={'p-2 rounded ' + (isUnanswered ? 'bg-gray-100' : isCorrect ? 'bg-emerald-100' : 'bg-red-100')}>
                        <span className="font-medium">Tu respuesta: </span>
                        {isUnanswered ? (
                          <span className="text-gray-500 italic">Sin responder</span>
                        ) : (
                          <span className={isCorrect ? 'text-emerald-700' : 'text-red-700'}>
                            {userAnswer ? userAnswer.toUpperCase() + ') ' + (question.options[userAnswer as keyof typeof question.options] || '') : ''}
                          </span>
                        )}
                      </div>
                      {!isCorrect && (
                        <div className="p-2 rounded bg-emerald-100">
                          <span className="font-medium">Correcta: </span>
                          <span className="text-emerald-700">
                            {question.correctAnswer.toUpperCase() + ') ' + (question.options[question.correctAnswer as keyof typeof question.options] || '')}
                          </span>
                        </div>
                      )}
                    </div>

                    {question.explanation && !isCorrect && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-800">Explicacion: </span>
                        <span className="text-blue-700">{question.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRetry && (
          <button onClick={onRetry} className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
            <RotateCcw className="w-5 h-5 mr-2" />Intentar de nuevo
          </button>
        )}
        <button onClick={onExit} className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
          <Home className="w-5 h-5 mr-2" />Volver al inicio
        </button>
      </div>
    </div>
  );
}
