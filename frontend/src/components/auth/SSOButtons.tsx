import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

type SSOProviderId = 'google' | 'microsoft' | 'github';

interface ProviderStatus {
  id: SSOProviderId;
  label: string;
  configured: boolean;
}

interface SSOButtonsProps {
  onProviderClick: (provider: SSOProviderId) => void;
  disabled?: boolean;
  accent?: 'cyan' | 'emerald';
}

const PROVIDER_DISPLAY: Record<SSOProviderId, { label: string; logoSrc: string }> = {
  google: { label: 'Google', logoSrc: '/provider-logos/gcp.svg' },
  microsoft: { label: 'Microsoft', logoSrc: '/provider-logos/azure.svg' },
  github: { label: 'GitHub', logoSrc: '/provider-logos/github.svg' },
};

const FALLBACK_PROVIDERS: ProviderStatus[] = [
  { id: 'google', label: 'Google', configured: true },
  { id: 'microsoft', label: 'Microsoft', configured: true },
  { id: 'github', label: 'GitHub', configured: true },
];

const SSOButtons: React.FC<SSOButtonsProps> = ({ onProviderClick, disabled = false, accent = 'cyan' }) => {
  const { data, isLoading } = useQuery<ProviderStatus[]>({
    queryKey: ['auth', 'sso-providers'],
    queryFn: async () => {
      const response = await api.get('/auth/sso/providers');
      const providers = Array.isArray(response.data?.providers) ? response.data.providers : [];
      return providers
        .map((item: any) => ({
          id: String(item?.id ?? '').toLowerCase() as SSOProviderId,
          label: String(item?.label ?? '').trim(),
          configured: Boolean(item?.configured),
        }))
        .filter((item: ProviderStatus) => item.id === 'google' || item.id === 'microsoft' || item.id === 'github');
    },
    staleTime: 120_000,
    retry: 1,
  });

  const providerMap = new Map((data && data.length > 0 ? data : FALLBACK_PROVIDERS).map((item) => [item.id, item]));

  const ringClass =
    accent === 'emerald'
      ? 'hover:border-emerald-300/50 hover:bg-emerald-500/10 focus-visible:ring-emerald-300/40'
      : 'hover:border-cyan-300/50 hover:bg-cyan-500/10 focus-visible:ring-cyan-300/40';

  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-300/80">
        or continue with SSO
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.keys(PROVIDER_DISPLAY) as SSOProviderId[]).map((providerId) => {
          const status = providerMap.get(providerId);
          const display = PROVIDER_DISPLAY[providerId];
          const isConfigured = Boolean(status?.configured);
          const isButtonDisabled = disabled || !isConfigured;

          return (
            <button
              key={providerId}
              type="button"
              onClick={() => onProviderClick(providerId)}
              disabled={isButtonDisabled}
              className={`flex items-center justify-center gap-2 rounded-xl border border-slate-300/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 transition-all focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55 ${ringClass}`}
              title={
                isConfigured
                  ? `Continue with ${display.label}`
                  : `${display.label} SSO is not configured on the backend`
              }
            >
              <img src={display.logoSrc} alt={`${display.label} logo`} className="h-5 w-5 rounded object-cover" />
              <span>{display.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading && <p className="text-center text-[11px] text-slate-400">Loading SSO providers...</p>}
      {data && data.some((item) => !item.configured) && (
        <p className="text-center text-[11px] text-amber-200/90">
          Some providers are not configured yet. Add client IDs/secrets in backend env to enable them.
        </p>
      )}
    </div>
  );
};

export default SSOButtons;
