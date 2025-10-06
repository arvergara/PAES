import React, { useState } from 'react';
import { Header } from './components/Header';
import { SubjectCard } from './components/SubjectCard';
import { ModeSelector } from './components/ModeSelector';
import { PAESMode } from './components/PAESMode';
import { TestMode } from './components/TestMode';
import { ReviewMode } from './components/ReviewMode';
import { Toaster } from 'react-hot-toast';
import type { Subject, PracticeMode } from './types';
import { useAuth } from './hooks/useAuth';

function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const { user } = useAuth();

  const subjects: Subject[] = ['M1', 'M2', 'L', 'C', 'H', 'ALL'];

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const handleModeSelect = (mode: PracticeMode) => {
    setSelectedMode(mode);
  };

  const handleReset = () => {
    setSelectedSubject(null);
    setSelectedMode(null);
  };

  const renderContent = () => {
    if (!selectedSubject) {
      return (
        <>
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Selecciona una Materia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject}
                subject={subject}
                onSelect={handleSubjectSelect}
              />
            ))}
          </div>
        </>
      );
    }

    if (!selectedMode) {
      return (
        <>
          <button
            onClick={handleReset}
            className="mb-8 text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
          >
            ← Volver a materias
          </button>
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Elige tu Modo de Práctica
          </h2>
          <ModeSelector onSelect={handleModeSelect} />
        </>
      );
    }

    if (!user) {
      return (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Inicia sesión para continuar
          </h2>
          <p className="text-gray-600 mb-8">
            Necesitas una cuenta para acceder a los modos de práctica
          </p>
          <button
            onClick={handleReset}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      );
    }

    switch (selectedMode) {
      case 'PAES':
        return <PAESMode subject={selectedSubject} onExit={handleReset} />;
      case 'TEST':
        return <TestMode subject={selectedSubject} onExit={handleReset} />;
      case 'REVIEW':
        return <ReviewMode subject={selectedSubject} onExit={handleReset} />;
      default:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Próximamente!
            </h2>
            <p className="text-gray-600 mb-8">
              Esta funcionalidad estará disponible pronto.
            </p>
            <button
              onClick={handleReset}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Header />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;