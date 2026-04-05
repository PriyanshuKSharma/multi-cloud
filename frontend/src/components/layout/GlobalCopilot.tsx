import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Bot, Loader2, SendHorizontal, Wand2, X } from 'lucide-react';

interface CopilotFinding {
  severity: 'info' | 'warning' | 'error';
  title: string;
  evidence?: string | null;
  recommendation: string;
}

interface CopilotAction {
  label: string;
  action_type: 'navigate' | 'api';
  description: string;
  route?: string | null;
  method?: string | null;
  endpoint?: string | null;
  body?: Record<string, unknown> | null;
  requires_confirmation?: boolean;
}

interface CopilotResponse {
  answer: string;
  findings: CopilotFinding[];
  actions: CopilotAction[];
}

type CopilotProvider = 'auto' | 'openai' | 'gemini' | 'anthropic' | 'huggingface' | 'custom';

interface CopilotProvidersResponse {
  active_provider: string | null;
  preferred_provider: string | null;
  provider_priority: string[];
  available_providers: string[];
  configured_providers: string[];
  provider_status: Record<string, boolean>;
  models: Record<string, string>;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  text: string;
  response?: CopilotResponse;
}

const QUICK_PROMPTS = [
  'Why did my latest deployment fail?',
  'How can I fix cloud credential problems quickly?',
  'What should I validate before creating resources?',
  'Give me safe next steps based on current context.',
];

const PROVIDER_CHOICES = ['openai', 'gemini', 'anthropic', 'huggingface', 'custom'] as const;

const formatProviderLabel = (provider: string) =>
  provider === 'huggingface'
    ? 'Hugging Face'
    : provider === 'custom'
      ? 'Custom (Fine-tuned)'
      : provider.charAt(0).toUpperCase() + provider.slice(1);

const buildMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getErrorDetail = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
  ) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }
  return 'Request failed';
};

const GlobalCopilot: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [providerPreference, setProviderPreference] = React.useState<CopilotProvider>('auto');
  const [allowFallback, setAllowFallback] = React.useState(true);
  const [providerMeta, setProviderMeta] = React.useState<CopilotProvidersResponse | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: buildMessageId(),
      role: 'assistant',
      text: 'Cloud Copilot is ready. Ask for debugging help, guided actions, or architecture advice.',
    },
  ]);
  const feedRef = React.useRef<HTMLDivElement | null>(null);

  const deploymentId = React.useMemo(() => {
    const match = location.pathname.match(/^\/deployments\/(\d+)$/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }, [location.pathname]);

  const resourceId = React.useMemo(() => {
    const vmMatch = location.pathname.match(/^\/resources\/vms\/(\d+)$/);
    if (vmMatch) {
      const parsed = Number(vmMatch[1]);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }, [location.pathname]);

  React.useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, isLoading]);

  React.useEffect(() => {
    if (location.pathname === '/console') {
      setIsOpen(false);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    let mounted = true;

    const loadProviders = async () => {
      try {
        const response = await axios.get<CopilotProvidersResponse>('/assistant/providers');
        if (mounted) {
          setProviderMeta(response.data);
        }
      } catch {
        if (mounted) {
          setProviderMeta(null);
        }
      }
    };

    void loadProviders();

    return () => {
      mounted = false;
    };
  }, []);

  const appendMessage = React.useCallback((message: ChatMessage) => {
    setMessages((previous) => [...previous, message]);
  }, []);

  const askCopilot = React.useCallback(
    async (promptText: string) => {
      const prompt = promptText.trim();
      if (!prompt || isLoading) return;

      appendMessage({
        id: buildMessageId(),
        role: 'user',
        text: prompt,
      });
      setInput('');
      setIsLoading(true);

      try {
        const response = await axios.post<CopilotResponse>('/assistant/query', {
          prompt,
          deployment_id: deploymentId ?? undefined,
          resource_id: resourceId ?? undefined,
          provider: providerPreference,
          allow_fallback: allowFallback,
        });
        appendMessage({
          id: buildMessageId(),
          role: 'assistant',
          text: response.data.answer,
          response: response.data,
        });
      } catch (error) {
        appendMessage({
          id: buildMessageId(),
          role: 'system',
          text: `Copilot request failed: ${getErrorDetail(error)}`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [allowFallback, appendMessage, deploymentId, isLoading, providerPreference, resourceId]
  );

  const runAction = React.useCallback(
    async (action: CopilotAction) => {
      if (action.requires_confirmation) {
        const accepted = window.confirm(`Run action: ${action.label}?`);
        if (!accepted) return;
      }

      if (action.action_type === 'navigate' && action.route) {
        navigate(action.route);
        return;
      }

      if (action.action_type === 'api' && action.endpoint && action.method) {
        try {
          await axios.request({
            method: action.method,
            url: action.endpoint,
            data: action.body ?? undefined,
          });
          appendMessage({
            id: buildMessageId(),
            role: 'system',
            text: `Action succeeded: ${action.label}`,
          });
          return;
        } catch (error) {
          appendMessage({
            id: buildMessageId(),
            role: 'system',
            text: `Action failed (${action.label}): ${getErrorDetail(error)}`,
          });
          return;
        }
      }

      appendMessage({
        id: buildMessageId(),
        role: 'system',
        text: `Action is not configured correctly: ${action.label}`,
      });
    },
    [appendMessage, navigate]
  );

  // Cloud Console already renders its own dedicated copilot drawer.
  if (location.pathname === '/console') {
    return null;
  }

  const contextLabel = deploymentId
    ? `deployment #${deploymentId}`
    : resourceId
      ? `resource #${resourceId}`
      : 'general context';
  const providerOptions =
    providerMeta?.available_providers?.length
      ? providerMeta.available_providers
      : [...PROVIDER_CHOICES];
  const configuredProviders = providerMeta?.configured_providers ?? [];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="copilot-fab cursor-pointer fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
        >
          <Bot className="h-4 w-4" />
          <span>Open Copilot</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          <button
            type="button"
            aria-label="Close Copilot"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/55 lg:hidden pointer-events-auto"
          />

          <aside
            className="copilot-shell pointer-events-auto absolute right-0 top-0 flex h-full w-full max-w-[430px] flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="copilot-header px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-semibold topbar-heading">Cloud Copilot</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="copilot-close-btn cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-md"
                title="Close copilot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="copilot-context-bar px-4 py-2">
              <p className="copilot-context-text text-xs">Context: {contextLabel}</p>
            </div>

            <div ref={feedRef} className="copilot-feed flex-1 overflow-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`copilot-msg max-w-[95%] px-3 py-2 ${
                      message.role === 'user'
                        ? 'copilot-msg-user'
                        : message.role === 'assistant'
                          ? 'copilot-msg-assistant'
                          : 'copilot-msg-system'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>

                    {message.response?.findings && message.response.findings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="copilot-section-label text-[11px] uppercase tracking-wide">Findings</p>
                        {message.response.findings.map((finding, index) => (
                          <div key={`${message.id}-finding-${index}`} className="copilot-finding rounded-lg p-2">
                            <p
                              className={`text-xs font-semibold ${
                                finding.severity === 'error'
                                  ? 'text-red-300'
                                  : finding.severity === 'warning'
                                    ? 'text-yellow-300'
                                    : 'text-cyan-300'
                              }`}
                            >
                              {finding.title}
                            </p>
                            <p className="copilot-finding-text mt-1 text-xs">{finding.recommendation}</p>
                            {finding.evidence && (
                              <p className="copilot-evidence mt-1 text-[11px] font-mono">{finding.evidence}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.response?.actions && message.response.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="copilot-section-label text-[11px] uppercase tracking-wide">Suggested Actions</p>
                        <div className="flex flex-wrap gap-2">
                          {message.response.actions.map((action, index) => (
                            <button
                              key={`${message.id}-action-${index}`}
                              onClick={() => {
                                void runAction(action);
                              }}
                              className="copilot-action-btn cursor-pointer inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs"
                              title={action.description}
                            >
                              <Wand2 className="h-3 w-3" />
                              <span>{action.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="copilot-loader rounded-xl px-3 py-2 text-sm inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                    <span>Analyzing context...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="copilot-footer px-4 py-3 space-y-3">
              <div className="copilot-provider-card rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="global-copilot-provider" className="copilot-field-label text-[11px] uppercase tracking-wide">
                    AI Provider
                  </label>
                  <select
                    id="global-copilot-provider"
                    value={providerPreference}
                    onChange={(event) => setProviderPreference(event.target.value as CopilotProvider)}
                    className="copilot-select rounded-md px-2 py-1 text-xs"
                  >
                    <option value="auto">Auto</option>
                    {providerOptions.map((provider) => (
                      <option key={provider} value={provider}>
                        {formatProviderLabel(provider)}
                        {providerMeta && !providerMeta.provider_status?.[provider] ? ' (not configured)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 text-xs topbar-meta">
                  <input
                    type="checkbox"
                    checked={allowFallback}
                    onChange={(event) => setAllowFallback(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-900 text-blue-400 focus:ring-blue-500/40"
                  />
                  <span>Allow fallback if selected provider fails</span>
                </label>

                <p className="copilot-meta text-[11px]">
                  Configured providers: {configuredProviders.length > 0 ? configuredProviders.map(formatProviderLabel).join(', ') : 'none'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      void askCopilot(prompt);
                    }}
                    className="copilot-quick-btn cursor-pointer rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void askCopilot(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Copilot..."
                  className="copilot-input flex-1 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="copilot-send-btn cursor-pointer inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default GlobalCopilot;
