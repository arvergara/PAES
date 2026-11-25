import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Home } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

interface PaymentResultProps {
  onGoHome: () => void;
}

export function PaymentResult({ onGoHome }: PaymentResultProps) {
  const { subscription, refresh, loading } = useSubscription();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give webhook a moment to process, then check status
    const timer = setTimeout(async () => {
      await refresh();
      setChecking(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [refresh]);

  const isSuccess = subscription.status === 'active';

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full text-center">
        {isSuccess ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pago exitoso
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu plan Premium está activo. Ya puedes acceder a todas las funcionalidades de TutorPAES.
            </p>
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pago no confirmado
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              No pudimos confirmar tu pago. Si crees que es un error, espera unos minutos e intenta recargar la página.
            </p>
          </>
        )}

        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Home className="h-5 w-5" />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}
