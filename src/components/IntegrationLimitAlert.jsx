import { AlertCircle, Crown } from "lucide-react";

const LIMIT_NORMAL = 100;
const LIMIT_VIP = 500;

export function getIntegrationLimit(user) {
  const isVip = user?.is_vip || user?.tipo_hierarquia === "UsuarioVIP";
  return isVip ? LIMIT_VIP : LIMIT_NORMAL;
}

export function getIntegrationUsage(user) {
  return user?.integration_usage_count || 0;
}

export function isOverLimit(user) {
  return getIntegrationUsage(user) >= getIntegrationLimit(user);
}

export function getRemainingUsage(user) {
  return Math.max(0, getIntegrationLimit(user) - getIntegrationUsage(user));
}

export default function IntegrationLimitAlert({ user }) {
  const usage = getIntegrationUsage(user);
  const limit = getIntegrationLimit(user);
  const remaining = getRemainingUsage(user);
  const isVip = user?.is_vip || user?.tipo_hierarquia === "UsuarioVIP";
  const overLimit = usage >= limit;
  const nearLimit = usage >= limit * 0.8;

  if (!nearLimit && !overLimit) return null;

  return (
    <div className={`rounded-xl p-3 text-xs border ${
      overLimit 
        ? "bg-red-50 border-red-200 text-red-700" 
        : "bg-amber-50 border-amber-200 text-amber-700"
    }`}>
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          {overLimit ? (
            <>
              <p className="font-semibold mb-1">⚠️ Limite de integrações atingido</p>
              <p>
                Você utilizou <strong>{usage}/{limit}</strong> integrações do seu plano {isVip ? "VIP" : "gratuito"}.
                Para que o sistema seja funcional para todos sem custo, essa cota é limitada por usuário.
              </p>
              {!isVip && (
                <p className="mt-1 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Usuários VIP possuem limite de {LIMIT_VIP} integrações.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold mb-1">⚡ Atenção: Uso de integrações</p>
              <p>
                Você já utilizou <strong>{usage}/{limit}</strong> integrações. Restam <strong>{remaining}</strong>.
                {!isVip && " Usuários VIP possuem limite ampliado."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}