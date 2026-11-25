import { useState } from 'react';
import { X, Check, Crown, Loader2, Zap, BookOpen, BarChart3, Clock, Shield, Tag } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLAN_PRICE = 25000;

const FREE_FEATURES = [
  { icon: BookOpen, text: '5 preguntas por día' },
  { icon: BarChart3, text: 'Estadísticas básicas' },
];

const PREMIUM_FEATURES = [
  { icon: Zap, text: 'Preguntas ilimitadas' },
  { icon: Clock, text: 'Simulacros PAES completos' },
  { icon: BarChart3, text: 'Estadísticas avanzadas y diagnóstico' },
  { icon: BookOpen, text: 'Explicaciones detalladas' },
  { icon: Shield, text: 'Acceso a todas las materias' },
  { icon: Crown, text: 'Resúmenes por tema' },
];

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user } = useAuth();
  const { isPremium, subscription, createPayment } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  if (!isOpen) return null;

  const finalPrice = promoApplied
    ? Math.round(PLAN_PRICE * (1 - discountPercent / 100))
    : PLAN_PRICE;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setError(null);

    try {
      // Validate promo code against DB
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('discount_percent, expires_at, max_uses, current_uses')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (!promo) {
        setError('Código promocional inválido');
        return;
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        setError('Código promocional expirado');
        return;
      }
      if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
        setError('Código promocional agotado');
        return;
      }

      setDiscountPercent(promo.discount_percent);
      setPromoApplied(true);
      setError(null);
    } catch {
      setError('Error al validar código');
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setDiscountPercent(0);
    setPromoCode('');
    setError(null);
  };

  const handleSubscribe = async () => {
    if (!user) {
      setError('Debes iniciar sesión para suscribirte');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const code = promoApplied ? promoCode.trim().toUpperCase() : undefined;
      const { paymentUrl } = await createPayment(code);
      window.location.href = paymentUrl;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isTrialing = subscription.status === 'trialing';
  const trialDaysLeft = subscription.trialEnd
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Crown className="h-8 w-8" />
            <h2 className="text-2xl font-bold">TutorPAES Premium</h2>
          </div>
          <p className="text-white/90">Prepárate al máximo para la PAES</p>
        </div>

        <div className="p-6">
          {/* Trial banner */}
          {isTrialing && trialDaysLeft > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium mb-1">
                <Clock className="h-5 w-5" />
                <span>Período de prueba gratuito</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-500">
                Te quedan <strong>{trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}</strong> de prueba gratuita.
                {trialDaysLeft <= 3 && ' Suscríbete para no perder acceso.'}
              </p>
            </div>
          )}

          {/* Already premium (paid) */}
          {isPremium && !isTrialing && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-1">
                <Check className="h-5 w-5" />
                <span>Plan Premium activo</span>
              </div>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-green-600 dark:text-green-500">
                  Válido hasta {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>
          )}

          {/* Price */}
          {(!isPremium || isTrialing) && (
            <div className="text-center mb-6">
              <div className="flex items-baseline justify-center gap-1">
                {promoApplied && (
                  <span className="text-2xl text-gray-400 line-through mr-2">
                    ${PLAN_PRICE.toLocaleString('es-CL')}
                  </span>
                )}
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${finalPrice.toLocaleString('es-CL')}
                </span>
                <span className="text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              {promoApplied && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                  {discountPercent}% de descuento aplicado
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Paga con WebPay, tarjeta o transferencia
              </p>
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-6">
            {PREMIUM_FEATURES.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Promo code input */}
          {(!isPremium || isTrialing) && (
            <div className="mb-4">
              {!promoApplied ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Código promocional"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Aplicar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                    <Check className="h-4 w-4" />
                    <span>Código <strong>{promoCode}</strong> aplicado ({discountPercent}% dcto)</span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm underline"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* CTA Button */}
          {(!isPremium || isTrialing) && (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5" />
                  {isTrialing ? 'Suscribirse ahora' : 'Suscribirse ahora'}
                </>
              )}
            </button>
          )}

          {/* Free plan comparison */}
          {!isPremium && !isTrialing && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Plan Gratuito incluye:</p>
              <div className="space-y-2">
                {FREE_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <feature.icon className="h-4 w-4" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
