import { useState, useEffect } from 'react';
import { Sparkles, ChevronUp, ChevronDown, X, Rocket, Target, Clock, BookOpen } from 'lucide-react';

export function WelcomeBanner() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed');
    const collapsed = localStorage.getItem('welcomeBannerCollapsed');
    if (dismissed === 'true') setIsDismissed(true);
    if (collapsed === 'true') setIsCollapsed(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('welcomeBannerCollapsed', String(newState));
  };

  if (isDismissed) return null;

  const tips = [
    { icon: Rocket, text: 'Practica diariamente', desc: 'La constancia es clave' },
    { icon: Target, text: 'Enfócate en tus débiles', desc: 'Mejora donde más necesitas' },
    { icon: Clock, text: 'Simula condiciones reales', desc: 'Prepárate para el día D' },
    { icon: BookOpen, text: 'Revisa los resúmenes', desc: 'Refuerza conceptos clave' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bienvenido a TutorPAES</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">Tu preparación inteligente para la PAES</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleCollapse}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tips Grid */}
        {!isCollapsed && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div 
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{tip.text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}