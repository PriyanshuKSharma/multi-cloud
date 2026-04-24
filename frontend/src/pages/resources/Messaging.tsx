import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageHero from '../../components/ui/PageHero';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  BellRing,
  MessageSquare,
  Plus,
  Search,
  RefreshCw,
  Send,
  Inbox,
  Trash2,
  ArrowUpRight,
  Link2,
  Radio,
  DownloadCloud,
  UploadCloud,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MessagingResource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  configuration?: Record<string, unknown>;
  created_at: string;
}

interface NormalizedMessagingResource {
  id: number;
  name: string;
  provider: string;
  type: 'sqs' | 'sns';
  status: string;
  region: string;
  fifo: boolean;
  configuration: Record<string, unknown>;
  createdAt: string;
}

interface SqsMessageRecord {
  message_id?: string;
  receipt_handle?: string;
  body?: string;
  attributes?: Record<string, string>;
  message_attributes?: Record<string, unknown>;
}

interface SnsSubscriptionRecord {
  subscription_arn?: string;
  protocol?: string;
  endpoint?: string;
  owner?: string;
}

type MessagingType = 'sqs' | 'sns';
type ServiceMode = 'queue' | 'message';
type CloudProvider = 'aws' | 'azure' | 'gcp';

const getServiceModeFromPath = (pathname: string): ServiceMode =>
  pathname.includes('/resources/messages') ? 'message' : 'queue';

const normalizeProvider = (value: string | null): CloudProvider | null => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'aws' || normalized === 'azure' || normalized === 'gcp') {
    return normalized;
  }
  return null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
  }
  return false;
};

const normalizeMessagingResource = (item: MessagingResource): NormalizedMessagingResource => {
  const configuration = item.configuration ?? {};
  const type = String(item.type ?? '').toLowerCase() === 'sns' ? 'sns' : 'sqs';
  const fifo = toBoolean(type === 'sqs' ? configuration.fifo_queue : configuration.fifo_topic);
  return {
    id: item.id,
    name: item.name ?? 'Unnamed resource',
    provider: String(item.provider ?? '').toLowerCase(),
    type,
    status: String(item.status ?? 'unknown').toLowerCase(),
    region: String(configuration.region ?? 'us-east-1'),
    fifo,
    configuration,
    createdAt: item.created_at ?? '',
  };
};

const parseAttributesInput = (raw: string): Record<string, string> | null => {
  const text = raw.trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const result: Record<string, string> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      result[key] = String(value);
    });
    return result;
  } catch {
    return null;
  }
};

const SqsOperations: React.FC<{ resource: NormalizedMessagingResource }> = ({ resource }) => {
  const [messageBody, setMessageBody] = React.useState('');
  const [delaySeconds, setDelaySeconds] = React.useState(0);
  const [messageGroupId, setMessageGroupId] = React.useState('default');
  const [messageDeduplicationId, setMessageDeduplicationId] = React.useState('');
  const [attributesJson, setAttributesJson] = React.useState('{}');
  const [messages, setMessages] = React.useState<SqsMessageRecord[]>([]);
  const [queueAttributes, setQueueAttributes] = React.useState<Record<string, string> | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isLoadingAttributes, setIsLoadingAttributes] = React.useState(false);
  const [isPurging, setIsPurging] = React.useState(false);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const parsedAttributes = parseAttributesInput(attributesJson);
      if (parsedAttributes === null) {
        throw new Error('Message attributes must be a JSON object.');
      }
      const payload: Record<string, unknown> = {
        body: messageBody,
        delay_seconds: delaySeconds,
        message_attributes: parsedAttributes,
      };
      if (resource.fifo) {
        payload.message_group_id = messageGroupId || 'default';
        if (messageDeduplicationId.trim()) {
          payload.message_deduplication_id = messageDeduplicationId.trim();
        }
      }
      const response = await axios.post(`/resources/${resource.id}/sqs/send`, payload);
      return response.data;
    },
    onSuccess: (data: any) => {
      setFeedback(`Message sent: ${data?.message_id ?? 'success'}`);
      setErrorText(null);
      setMessageBody('');
      if (!resource.fifo) {
        setMessageDeduplicationId('');
      }
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : error?.message ?? 'Failed to send SQS message.');
      setFeedback(null);
    },
  });

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await axios.get(`/resources/${resource.id}/sqs/messages`, {
        params: { max_messages: 10, wait_time_seconds: 1 },
      });
      setMessages(Array.isArray(response.data?.messages) ? response.data.messages : []);
      setFeedback(`Fetched ${response.data?.count ?? 0} message(s).`);
      setErrorText(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to fetch messages.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadAttributes = async () => {
    setIsLoadingAttributes(true);
    try {
      const response = await axios.get(`/resources/${resource.id}/sqs/attributes`);
      setQueueAttributes(response.data?.attributes ?? {});
      setFeedback('Queue attributes loaded.');
      setErrorText(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to load queue attributes.');
    } finally {
      setIsLoadingAttributes(false);
    }
  };

  const deleteMessage = async (receiptHandle: string | undefined) => {
    if (!receiptHandle) return;
    try {
      await axios.post(`/resources/${resource.id}/sqs/messages/delete`, { receipt_handle: receiptHandle });
      setMessages((prev) => prev.filter((item) => item.receipt_handle !== receiptHandle));
      setFeedback('Message deleted.');
      setErrorText(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to delete message.');
    }
  };

  const purgeQueue = async () => {
    const accepted = window.confirm('Purge queue? This removes all currently available messages.');
    if (!accepted) return;
    setIsPurging(true);
    try {
      await axios.post(`/resources/${resource.id}/sqs/purge`);
      setMessages([]);
      setFeedback('Queue purge requested.');
      setErrorText(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to purge queue.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-800/70 bg-gray-900/30 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">SQS Operations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Message Body</label>
          <textarea
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            rows={3}
            placeholder='{"event":"order.created","id":"ord_123"}'
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Delay Seconds</label>
          <input
            type="number"
            min={0}
            max={900}
            value={delaySeconds}
            onChange={(event) => setDelaySeconds(Number(event.target.value))}
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
          />
        </div>
        {resource.fifo && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Message Group ID</label>
              <input
                type="text"
                value={messageGroupId}
                onChange={(event) => setMessageGroupId(event.target.value)}
                className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deduplication ID (optional)</label>
              <input
                type="text"
                value={messageDeduplicationId}
                onChange={(event) => setMessageDeduplicationId(event.target.value)}
                className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
              />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Message Attributes JSON</label>
          <textarea
            value={attributesJson}
            onChange={(event) => setAttributesJson(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending || !messageBody.trim()}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Send
        </button>
        <button
          onClick={() => {
            void loadMessages();
          }}
          disabled={isLoadingMessages}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          <Inbox className="w-3.5 h-3.5" />
          Receive
        </button>
        <button
          onClick={() => {
            void loadAttributes();
          }}
          disabled={isLoadingAttributes}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          Attributes
        </button>
        <button
          onClick={() => {
            void purgeQueue();
          }}
          disabled={isPurging}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Purge
        </button>
      </div>

      {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}
      {errorText && (
        <p className="text-xs text-red-300 inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorText}
        </p>
      )}

      {queueAttributes && (
        <div className="rounded-lg border border-gray-800/70 bg-gray-950/50 p-3">
          <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2">Queue Attributes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <p className="text-gray-400">
              Approx messages: <span className="text-gray-200">{queueAttributes.ApproximateNumberOfMessages ?? '-'}</span>
            </p>
            <p className="text-gray-400">
              In flight: <span className="text-gray-200">{queueAttributes.ApproximateNumberOfMessagesNotVisible ?? '-'}</span>
            </p>
            <p className="text-gray-400">
              Visibility timeout: <span className="text-gray-200">{queueAttributes.VisibilityTimeout ?? '-'}s</span>
            </p>
            <p className="text-gray-400">
              Retention: <span className="text-gray-200">{queueAttributes.MessageRetentionPeriod ?? '-'}s</span>
            </p>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((message) => (
            <div key={message.message_id ?? message.receipt_handle} className="rounded-lg border border-gray-800/70 bg-gray-950/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">ID: {message.message_id ?? 'unknown'}</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap break-words mt-1">{message.body ?? ''}</p>
                </div>
                <button
                  onClick={() => {
                    void deleteMessage(message.receipt_handle);
                  }}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SnsOperations: React.FC<{ resource: NormalizedMessagingResource }> = ({ resource }) => {
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [publishAttributesJson, setPublishAttributesJson] = React.useState('{}');
  const [protocol, setProtocol] = React.useState(resource.fifo ? 'sqs' : 'email');
  const [endpoint, setEndpoint] = React.useState('');
  const [subscriptions, setSubscriptions] = React.useState<SnsSubscriptionRecord[]>([]);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [errorText, setErrorText] = React.useState<string | null>(null);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = React.useState(false);

  const publishMutation = useMutation({
    mutationFn: async () => {
      const parsedAttributes = parseAttributesInput(publishAttributesJson);
      if (parsedAttributes === null) {
        throw new Error('Message attributes must be a JSON object.');
      }
      const response = await axios.post(`/resources/${resource.id}/sns/publish`, {
        subject: subject.trim() || undefined,
        message,
        message_attributes: parsedAttributes,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      setFeedback(`Published message: ${data?.message_id ?? 'success'}`);
      setErrorText(null);
      setMessage('');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : error?.message ?? 'Failed to publish SNS message.');
      setFeedback(null);
    },
  });

  const loadSubscriptions = async () => {
    setIsLoadingSubscriptions(true);
    try {
      const response = await axios.get(`/resources/${resource.id}/sns/subscriptions`);
      setSubscriptions(Array.isArray(response.data?.subscriptions) ? response.data.subscriptions : []);
      setFeedback(`Loaded ${response.data?.count ?? 0} subscription(s).`);
      setErrorText(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to load subscriptions.');
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/resources/${resource.id}/sns/subscribe`, {
        protocol,
        endpoint: endpoint.trim(),
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      setFeedback(`Subscription created: ${data?.subscription_arn ?? 'pending confirmation'}`);
      setErrorText(null);
      setEndpoint('');
      void loadSubscriptions();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to create subscription.');
      setFeedback(null);
    },
  });

  const deleteSubscription = async (subscriptionArn: string | undefined) => {
    if (!subscriptionArn || subscriptionArn === 'PendingConfirmation') return;
    try {
      await axios.delete(`/resources/${resource.id}/sns/subscriptions`, {
        params: { subscription_arn: subscriptionArn },
      });
      setSubscriptions((prev) => prev.filter((item) => item.subscription_arn !== subscriptionArn));
      setFeedback('Subscription deleted.');
      setErrorText(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setErrorText(typeof detail === 'string' ? detail : 'Failed to delete subscription.');
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-800/70 bg-gray-900/30 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">SNS Operations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Subject (optional)</label>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Message Attributes JSON</label>
          <textarea
            value={publishAttributesJson}
            onChange={(event) => setPublishAttributesJson(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending || !message.trim()}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Publish
        </button>
        <button
          onClick={() => {
            void loadSubscriptions();
          }}
          disabled={isLoadingSubscriptions}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50"
        >
          <Radio className="w-3.5 h-3.5" />
          Load subscriptions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Protocol</label>
          <select
            value={protocol}
            onChange={(event) => setProtocol(event.target.value)}
            className="w-full rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
          >
            {!resource.fifo && (
              <>
                <option value="email">email</option>
                <option value="https">https</option>
                <option value="http">http</option>
              </>
            )}
            <option value="sqs">sqs</option>
            {!resource.fifo && (
              <>
                <option value="lambda">lambda</option>
                <option value="sms">sms</option>
              </>
            )}
          </select>
          {resource.fifo && (
            <p className="mt-1 text-[10px] text-amber-400 font-medium leading-tight">
              FIFO Topics only support SQS protocols.
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Endpoint</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder={protocol === 'email' ? 'ops@example.com' : protocol === 'sqs' ? 'arn:aws:sqs:...' : 'https://example.com/hook'}
              className="flex-1 rounded-lg border border-gray-700/60 bg-gray-950/60 px-3 py-2 text-sm text-gray-200"
            />
            <button
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending || endpoint.trim().length < 3}
              className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {feedback && <p className="text-xs text-emerald-300">{feedback}</p>}
      {errorText && (
        <p className="text-xs text-red-300 inline-flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorText}
        </p>
      )}

      {subscriptions.length > 0 && (
        <div className="space-y-2">
          {subscriptions.map((subscription) => {
            const subscriptionArn = subscription.subscription_arn ?? '';
            return (
              <div key={`${subscriptionArn}-${subscription.endpoint}`} className="rounded-lg border border-gray-800/70 bg-gray-950/50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">{subscription.protocol ?? 'unknown'} subscription</p>
                    <p className="text-sm text-gray-200 break-all">{subscription.endpoint ?? 'unknown endpoint'}</p>
                    <p className="text-[11px] text-gray-500 break-all mt-1">{subscriptionArn}</p>
                  </div>
                  <button
                    onClick={() => {
                      void deleteSubscription(subscriptionArn);
                    }}
                    disabled={!subscriptionArn || subscriptionArn.toLowerCase().includes('pending')}
                    className="cursor-pointer inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MessagingPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceMode = React.useMemo(() => getServiceModeFromPath(location.pathname), [location.pathname]);
  const serviceType: MessagingType = serviceMode === 'queue' ? 'sqs' : 'sns';
  const selectedProvider = normalizeProvider(searchParams.get('provider')) ?? 'aws';
  const providerOptions = React.useMemo(
    () => [
      { id: 'aws' as const, label: 'AWS', subtitle: serviceMode === 'queue' ? 'SQS' : 'SNS' },
      { id: 'azure' as const, label: 'Azure', subtitle: serviceMode === 'queue' ? 'Service Bus Queue' : 'Service Bus Topic' },
      { id: 'gcp' as const, label: 'GCP', subtitle: serviceMode === 'queue' ? 'Pub/Sub Queue' : 'Pub/Sub Topic' },
    ],
    [serviceMode]
  );
  const serviceLabel = serviceMode === 'queue' ? 'Queues' : 'Messages';
  const createBasePath = serviceMode === 'queue' ? '/resources/queues/create' : '/resources/messages/create';
  const createPath = `${createBasePath}?provider=${selectedProvider}`;
  const pageTitle = `${serviceLabel} Service`;
  const pageDescription =
    serviceMode === 'queue'
      ? 'Manage queue infrastructure and operations across cloud providers from one console.'
      : 'Manage message topic infrastructure and pub-sub operations across cloud providers from one console.';
  const pageGuidePurpose =
    serviceMode === 'queue'
      ? 'Queue services support asynchronous processing, retries, ordering, and backpressure handling.'
      : 'Message services support publish-subscribe fan-out, event notifications, and cross-service integration.';
  const pageGuideActions =
    serviceMode === 'queue'
      ? [
          'select AWS, Azure, or GCP queue provider from the same service page',
          'create queue resources with provider-specific settings',
          'run detailed send/receive operations where runtime integrations are enabled',
        ]
      : [
          'select AWS, Azure, or GCP message provider from the same service page',
          'create topic/notification resources with provider-specific settings',
          'run detailed publish and subscription operations where runtime integrations are enabled',
        ];
  const createButtonLabel = `Create ${serviceMode === 'queue' ? 'Queue' : 'Message'} Service`;
  const emptyStateTitle = `No ${selectedProvider.toUpperCase()} ${serviceMode === 'queue' ? 'queues' : 'message topics'} found`;
  const emptyStateDescription =
    serviceMode === 'queue'
      ? `Create your first ${selectedProvider.toUpperCase()} queue resource to start asynchronous workflows.`
      : `Create your first ${selectedProvider.toUpperCase()} message topic to start pub-sub workflows.`;

  const handleProviderChange = (provider: CloudProvider) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('provider', provider);
    setSearchParams(nextParams, { replace: true });
  };

  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState({
    status: '',
    search: '',
  });
  const [resourceToDelete, setResourceToDelete] = React.useState<NormalizedMessagingResource | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/resources/${id}`);
    },
    onSuccess: () => {
      setActionMessage({ type: 'success', text: `${serviceLabel} resource deleted successfully.` });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : `Failed to delete ${serviceLabel.toLowerCase()} resource.`,
      });
    },
  });

  const { data: resources, isLoading, error, refetch } = useQuery<NormalizedMessagingResource[]>({
    queryKey: ['resources', serviceMode, selectedProvider, filters],
    queryFn: async () => {
      const response = await axios.get('/resources/?limit=500');
      const payload = response.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      return (items as MessagingResource[])
        .filter((item) => ['sqs', 'sns'].includes(String(item.type ?? '').toLowerCase()))
        .map(normalizeMessagingResource)
        .filter((item) => item.type === serviceType)
        .filter((item) => item.provider === selectedProvider)
        .filter((item) => (filters.status ? item.status === filters.status : true))
        .filter((item) => item.name.toLowerCase().includes(filters.search.toLowerCase()))
        .sort((a, b) => {
          const aDate = Date.parse(a.createdAt || '') || 0;
          const bDate = Date.parse(b.createdAt || '') || 0;
          return bDate - aDate;
        });
    },
    refetchInterval: 20000,
  });

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="messaging"
        tone="orange"
        eyebrow="Multi-cloud service operations"
        eyebrowIcon={<MessageSquare className="h-3.5 w-3.5" />}
        title={pageTitle}
        titleIcon={
          serviceMode === 'queue' ? (
            <Inbox className="w-8 h-8 text-cyan-300" />
          ) : (
            <BellRing className="w-8 h-8 text-amber-300" />
          )
        }
        description={pageDescription}
        chips={[
          { label: `provider: ${selectedProvider.toUpperCase()}`, tone: 'purple' },
          { label: `type: ${serviceType.toUpperCase()}`, tone: 'cyan' },
          { label: `${resources?.length ?? 0} resources`, tone: 'orange' },
        ]}
        guide={{
          title: `About ${serviceLabel}`,
          purpose: pageGuidePurpose,
          actions: pageGuideActions,
        }}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <Link
              to={createPath}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">{createButtonLabel}</span>
            </Link>
          </>
        }
      />

      {actionMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            actionMessage.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {providerOptions.map((option) => {
              const active = selectedProvider === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleProviderChange(option.id)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-200'
                      : 'border-gray-700/70 bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <p className="text-sm font-semibold uppercase">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.subtitle}</p>
                </button>
              );
            })}
          </div>

          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={`Search ${serviceLabel.toLowerCase()}...`}
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="provisioning">Provisioning</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {selectedProvider !== 'aws' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Runtime operations from this console are currently enabled for AWS. Provider selection for Azure and GCP is available now, and deep runtime integrations are coming next.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">Failed to load messaging resources</p>
        </div>
      ) : resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex items-start space-x-4 min-w-0">
                  <ProviderIcon provider={resource.provider as any} size="lg" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{resource.name}</h3>
                    <p className="text-xs text-gray-500 uppercase mt-1">
                      {resource.type} • {resource.region} • {resource.fifo ? 'fifo' : 'standard'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={resource.status as any} size="sm" />
                  <Link
                    to={`/deployments/${resource.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20"
                  >
                    Deployment
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setResourceToDelete(resource)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="text-sm text-gray-200 uppercase">{resource.type}</p>
                </div>
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1">Region</p>
                  <p className="text-sm text-gray-200">{resource.region}</p>
                </div>
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1">FIFO</p>
                  <p className="text-sm text-gray-200">{resource.fifo ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm text-gray-200">{resource.createdAt ? new Date(resource.createdAt).toLocaleString() : '-'}</p>
                </div>
              </div>

              {selectedProvider === 'aws' ? (
                resource.type === 'sqs' ? (
                  <SqsOperations resource={resource} />
                ) : (
                  <SnsOperations resource={resource} />
                )
              ) : (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  Detailed runtime operations for {selectedProvider.toUpperCase()} are coming soon.
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <BellRing className="w-14 h-14 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">{emptyStateTitle}</h3>
          <p className="text-sm text-gray-500 mb-6">{emptyStateDescription}</p>
          <Link
            to={createPath}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">{createButtonLabel}</span>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(resourceToDelete)}
        title="Delete Messaging Resource"
        message={
          resourceToDelete
            ? `Delete "${resourceToDelete.name}"? This removes the deployment record from the platform.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!resourceToDelete) return;
          await deleteMutation.mutateAsync(resourceToDelete.id);
          setResourceToDelete(null);
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setResourceToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default MessagingPage;
