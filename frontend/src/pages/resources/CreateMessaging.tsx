import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import { extractProvisioningErrorMessage } from '../../utils/terraformOutput';
import {
  CURRENT_PROJECT_CHANGED_EVENT,
  readCurrentProjectId,
  setCurrentProject,
} from '../../utils/currentProject';
import { ArrowLeft, BellRing, Check, Loader, MessageSquare, PlusSquare } from 'lucide-react';

type MessagingType = 'sqs' | 'sns';
type CloudProvider = 'aws' | 'azure' | 'gcp';
type ServiceMode = 'queue' | 'message';

interface ProjectOption {
  id: number;
  name: string;
}

interface CreateResourceResponse {
  id: number;
  status: string;
  terraform_output?: {
    error?: string;
    detail?: string;
    [key: string]: unknown;
  } | null;
}

const AWS_REGIONS = ['us-east-1', 'us-west-2', 'ap-south-1', 'eu-west-1'];
const AZURE_REGIONS = ['eastus', 'westus2', 'centralindia', 'westeurope'];
const GCP_REGIONS = ['us-central1', 'us-east1', 'asia-south1', 'europe-west1'];

const getServiceModeFromPath = (pathname: string): ServiceMode =>
  pathname.includes('/resources/messages') ? 'message' : 'queue';

const normalizeProvider = (value: string | null): CloudProvider | null => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'aws' || normalized === 'azure' || normalized === 'gcp') {
    return normalized;
  }
  return null;
};

const normalizeResourceName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const CreateMessagingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const serviceMode = React.useMemo(
    () => getServiceModeFromPath(location.pathname),
    [location.pathname]
  );
  const resourceType: MessagingType = serviceMode === 'message' ? 'sns' : 'sqs';
  const providerFromQuery = normalizeProvider(searchParams.get('provider')) ?? 'aws';
  const [provider, setProvider] = React.useState<CloudProvider>(providerFromQuery);
  const serviceBasePath = serviceMode === 'queue' ? '/resources/queues' : '/resources/messages';
  const messagingListPath = `${serviceBasePath}?provider=${provider}`;

  const [name, setName] = React.useState('');
  const [region, setRegion] = React.useState(AWS_REGIONS[0]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [projectError, setProjectError] = React.useState<string | null>(null);

  const [sqsFifo, setSqsFifo] = React.useState(false);
  const [sqsContentDedup, setSqsContentDedup] = React.useState(false);
  const [sqsVisibilityTimeout, setSqsVisibilityTimeout] = React.useState(30);
  const [sqsRetention, setSqsRetention] = React.useState(345600);
  const [sqsDelay, setSqsDelay] = React.useState(0);
  const [sqsMaxMessageSize, setSqsMaxMessageSize] = React.useState(262144);
  const [sqsReceiveWait, setSqsReceiveWait] = React.useState(2);
  const [sqsEnableDlq, setSqsEnableDlq] = React.useState(false);
  const [sqsDlqName, setSqsDlqName] = React.useState('');
  const [sqsRedriveMaxReceive, setSqsRedriveMaxReceive] = React.useState(5);

  const [snsFifo, setSnsFifo] = React.useState(false);
  const [snsContentDedup, setSnsContentDedup] = React.useState(false);
  const [snsDisplayName, setSnsDisplayName] = React.useState('');

  const [projectMode, setProjectMode] = React.useState<'current' | 'new'>('current');
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | ''>('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDescription, setNewProjectDescription] = React.useState('');

  React.useEffect(() => {
    if (provider !== providerFromQuery) {
      setProvider(providerFromQuery);
    }
  }, [provider, providerFromQuery]);

  const providerOptions = React.useMemo(
    () => [
      {
        id: 'aws' as const,
        label: 'AWS',
        subtitle: serviceMode === 'queue' ? 'SQS' : 'SNS',
      },
      {
        id: 'azure' as const,
        label: 'Azure',
        subtitle: serviceMode === 'queue' ? 'Service Bus Queue' : 'Service Bus Topic',
      },
      {
        id: 'gcp' as const,
        label: 'GCP',
        subtitle: serviceMode === 'queue' ? 'Pub/Sub Queue' : 'Pub/Sub Topic',
      },
    ],
    [serviceMode]
  );

  const regionOptions = React.useMemo(() => {
    if (provider === 'azure') return AZURE_REGIONS;
    if (provider === 'gcp') return GCP_REGIONS;
    return AWS_REGIONS;
  }, [provider]);

  React.useEffect(() => {
    if (!regionOptions.includes(region)) {
      setRegion(regionOptions[0]);
    }
  }, [region, regionOptions]);

  const handleProviderChange = (nextProvider: CloudProvider) => {
    setProvider(nextProvider);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('provider', nextProvider);
    setSearchParams(nextParams, { replace: true });
    setSubmitError(null);
  };

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectOption[]>({
    queryKey: ['projects', 'create-messaging'],
    queryFn: async () => {
      const response = await axios.get('/projects/');
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      return items.map((project: any) => ({
        id: Number(project.id),
        name: String(project.name ?? `Project ${project.id}`),
      }));
    },
    staleTime: 30_000,
    retry: 1,
  });

  React.useEffect(() => {
    if (projects.length === 0) return;
    const storedId = readCurrentProjectId();
    if (storedId && projects.some((project) => project.id === storedId)) {
      setSelectedProjectId(storedId);
      return;
    }
    setSelectedProjectId(projects[0].id);
    setCurrentProject({ id: projects[0].id, name: projects[0].name });
  }, [projects]);

  React.useEffect(() => {
    const onProjectChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: number | null }>;
      if (typeof customEvent.detail?.id === 'number' && customEvent.detail.id > 0) {
        setSelectedProjectId(customEvent.detail.id);
      }
    };
    window.addEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
    return () => window.removeEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
  }, []);

  React.useEffect(() => {
    if (resourceType === 'sqs' && !sqsFifo) {
      setSqsContentDedup(false);
    }
  }, [resourceType, sqsFifo]);

  React.useEffect(() => {
    if (resourceType === 'sns' && !snsFifo) {
      setSnsContentDedup(false);
    }
  }, [resourceType, snsFifo]);

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await axios.post('/resources/', payload);
      return response.data as CreateResourceResponse;
    },
    onSuccess: (resource) => {
      if (resource?.status === 'failed') {
        setSubmitError(
          extractProvisioningErrorMessage(
            resource.terraform_output,
            'Messaging resource request was accepted but provisioning could not be queued.'
          )
        );
        return;
      }
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      navigate(messagingListPath);
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      if (detail !== undefined) {
        setSubmitError(
          extractProvisioningErrorMessage(
            detail,
            `Failed to create ${serviceMode === 'queue' ? 'queue' : 'message'} service.`
          )
        );
        return;
      }
      setSubmitError(`Failed to create ${serviceMode === 'queue' ? 'queue' : 'message'} service.`);
    },
  });

  const resolveProjectId = async (): Promise<number | null> => {
    if (projectMode === 'new') {
      const trimmedName = newProjectName.trim();
      if (!trimmedName) {
        setProjectError('New project name is required.');
        return null;
      }
      if (trimmedName.length < 2) {
        setProjectError('Project name must be at least 2 characters.');
        return null;
      }

      try {
        const response = await axios.post('/projects/', {
          name: trimmedName,
          description: newProjectDescription.trim() || undefined,
        });
        const createdProject = response.data as ProjectOption;
        setCurrentProject({ id: createdProject.id, name: createdProject.name });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        return createdProject.id;
      } catch (error: any) {
        const detail = error?.response?.data?.detail;
        setProjectError(typeof detail === 'string' ? detail : 'Failed to create project.');
        return null;
      }
    }

    const projectId = typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId);
    if (!projectId || projectId <= 0) {
      setProjectError('Select a project or create a new one before provisioning.');
      return null;
    }

    const selectedProject = projects.find((project) => project.id === projectId);
    if (selectedProject) {
      setCurrentProject({ id: selectedProject.id, name: selectedProject.name });
    }
    return projectId;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setProjectError(null);

    if (provider !== 'aws') {
      setSubmitError(
        `${provider.toUpperCase()} ${serviceMode === 'queue' ? 'queue' : 'messaging'} provisioning is coming soon. Select AWS to continue for now.`
      );
      return;
    }

    const normalizedName = normalizeResourceName(name);
    if (!normalizedName) {
      setSubmitError('Resource name is required.');
      return;
    }

    const projectId = await resolveProjectId();
    if (!projectId) return;

    let configuration: Record<string, unknown> = { region };

    if (resourceType === 'sqs') {
      configuration = {
        ...configuration,
        queue_name: normalizedName,
        fifo_queue: sqsFifo,
        content_based_deduplication: sqsFifo ? sqsContentDedup : false,
        visibility_timeout_seconds: sqsVisibilityTimeout,
        message_retention_seconds: sqsRetention,
        delay_seconds: sqsDelay,
        max_message_size: sqsMaxMessageSize,
        receive_wait_time_seconds: sqsReceiveWait,
        enable_dlq: sqsEnableDlq,
        dlq_name: sqsEnableDlq ? normalizeResourceName(sqsDlqName || `${normalizedName}-dlq`) : '',
        redrive_max_receive_count: sqsRedriveMaxReceive,
      };
    } else {
      configuration = {
        ...configuration,
        topic_name: normalizedName,
        fifo_topic: snsFifo,
        content_based_deduplication: snsFifo ? snsContentDedup : false,
        display_name: snsDisplayName.trim(),
      };
    }

    createMutation.mutate({
      name: normalizedName,
      provider,
      type: resourceType,
      project_id: projectId,
      configuration,
    });
  };

  const pageTitle =
    serviceMode === 'queue' ? 'Create Queue Service' : 'Create Message Service';
  const pageDescription =
    serviceMode === 'queue'
      ? 'Create provider-specific queue infrastructure for asynchronous workloads and resilient processing.'
      : 'Create provider-specific notification/topic infrastructure for pub-sub and message fan-out workflows.';
  const createButtonLabel =
    serviceMode === 'queue' ? 'Create Queue Service' : 'Create Message Service';
  const serviceName = serviceMode === 'queue' ? 'Queues' : 'Messages';

  const numericSelectedProjectId =
    typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId);
  const selectedProject = projects.find((project) => project.id === numericSelectedProjectId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHero
        id="create-messaging"
        tone="orange"
        eyebrow="Provision cloud messaging resource"
        eyebrowIcon={<MessageSquare className="h-3.5 w-3.5" />}
        title={pageTitle}
        titleIcon={<BellRing className="w-8 h-8 text-amber-300" />}
        description={pageDescription}
        chips={[
          { label: `service: ${serviceName}`, tone: 'orange' },
          { label: `provider: ${provider.toUpperCase()}`, tone: 'purple' },
          { label: `region: ${region}`, tone: 'cyan' },
        ]}
        actions={
          <button
            onClick={() => navigate(messagingListPath)}
            className="cursor-pointer flex items-center rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to {serviceName}
          </button>
        }
      />

      <PageGuide
        title={`About ${serviceName}`}
        purpose={
          serviceMode === 'queue'
            ? 'Queue services provide asynchronous buffering, retries, ordering controls, and workload decoupling.'
            : 'Message services provide publish-subscribe fan-out, event notification routing, and cross-system integration.'
        }
        actions={[
          serviceMode === 'queue'
            ? 'select cloud provider and configure queue behavior for your workload patterns'
            : 'select cloud provider and configure notification/topic behavior for your event patterns',
          serviceMode === 'queue'
            ? 'manage queue send/receive/deletion workflows from the service console'
            : 'manage publish and subscription workflows from the service console',
          'deploy into your selected provider, region, and project',
        ]}
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <PlusSquare className="w-5 h-5 text-amber-300" />
                Resource Basics
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Cloud Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {providerOptions.map((option) => {
                    const active = provider === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleProviderChange(option.id)}
                        className={`cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                          active
                            ? 'border-amber-500/60 bg-amber-500/10'
                            : 'border-gray-800/70 bg-gray-900/40 hover:border-gray-700'
                        }`}
                      >
                        <p className="text-sm font-semibold text-white uppercase">{option.label}</p>
                        <p className="mt-1 text-xs text-gray-400">{option.subtitle}</p>
                        {active && <Check className="w-4 h-4 text-amber-300 mt-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Region</label>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                >
                  {regionOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  {serviceMode === 'queue' ? 'Queue Name' : 'Topic Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={serviceMode === 'queue' ? 'orders-events' : 'system-alerts'}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {provider !== 'aws' && (
                <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  {provider.toUpperCase()} {serviceMode === 'queue' ? 'queue' : 'message'} provisioning UI is ready. Full deployment automation is currently enabled for AWS; Azure and GCP provisioning support is next.
                </div>
              )}
            </div>
          </div>

          {provider === 'aws' && resourceType === 'sqs' ? (
            <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-800/60">
                <h2 className="text-lg font-semibold text-white">SQS Detail Settings</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={sqsFifo}
                    onChange={(event) => setSqsFifo(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-400 focus:ring-amber-500/40"
                  />
                  FIFO queue
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={sqsContentDedup}
                    onChange={(event) => setSqsContentDedup(event.target.checked)}
                    disabled={!sqsFifo}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-400 focus:ring-amber-500/40 disabled:opacity-50"
                  />
                  Content-based deduplication
                </label>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Visibility Timeout</label>
                  <input
                    type="number"
                    min={0}
                    max={43200}
                    value={sqsVisibilityTimeout}
                    onChange={(event) => setSqsVisibilityTimeout(Number(event.target.value))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Retention (seconds)</label>
                  <input
                    type="number"
                    min={60}
                    max={1209600}
                    value={sqsRetention}
                    onChange={(event) => setSqsRetention(Number(event.target.value))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Delay (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    max={900}
                    value={sqsDelay}
                    onChange={(event) => setSqsDelay(Number(event.target.value))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Max Message Size</label>
                  <input
                    type="number"
                    min={1024}
                    max={262144}
                    value={sqsMaxMessageSize}
                    onChange={(event) => setSqsMaxMessageSize(Number(event.target.value))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Receive Wait (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={sqsReceiveWait}
                    onChange={(event) => setSqsReceiveWait(Number(event.target.value))}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                  />
                </div>

                <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={sqsEnableDlq}
                    onChange={(event) => setSqsEnableDlq(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-400 focus:ring-amber-500/40"
                  />
                  Attach dead-letter queue
                </label>

                {sqsEnableDlq && (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">DLQ Name</label>
                      <input
                        type="text"
                        value={sqsDlqName}
                        onChange={(event) => setSqsDlqName(event.target.value)}
                        placeholder={`${normalizeResourceName(name) || 'queue'}-dlq`}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                        Redrive Max Receive Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={sqsRedriveMaxReceive}
                        onChange={(event) => setSqsRedriveMaxReceive(Number(event.target.value))}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : provider === 'aws' ? (
            <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-800/60">
                <h2 className="text-lg font-semibold text-white">SNS Detail Settings</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={snsFifo}
                    onChange={(event) => setSnsFifo(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-400 focus:ring-amber-500/40"
                  />
                  FIFO topic
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={snsContentDedup}
                    onChange={(event) => setSnsContentDedup(event.target.checked)}
                    disabled={!snsFifo}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-400 focus:ring-amber-500/40 disabled:opacity-50"
                  />
                  Content-based deduplication
                </label>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={snsDisplayName}
                    onChange={(event) => setSnsDisplayName(event.target.value)}
                    placeholder="Operational Alerts"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-800/60">
                <h2 className="text-lg font-semibold text-white">
                  {provider.toUpperCase()} {serviceMode === 'queue' ? 'Queue' : 'Message'} Settings
                </h2>
              </div>
              <div className="p-6 text-sm text-gray-300">
                Detailed {provider.toUpperCase()} configuration will appear here once provisioning modules are enabled.
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Live Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Service</span>
                <span className="text-gray-200">{serviceName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-200 uppercase">{provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-200 truncate max-w-[170px] text-right">{normalizeResourceName(name) || 'not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-gray-200">{region}</span>
              </div>
              {provider === 'aws' && resourceType === 'sqs' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">FIFO</span>
                    <span className="text-gray-200">{sqsFifo ? 'yes' : 'no'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">DLQ</span>
                    <span className="text-gray-200">{sqsEnableDlq ? 'enabled' : 'disabled'}</span>
                  </div>
                </>
              ) : provider === 'aws' ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">FIFO</span>
                  <span className="text-gray-200">{snsFifo ? 'yes' : 'no'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-gray-200">template ready</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-3">
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-gray-400">Project target</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProjectMode('current');
                    setProjectError(null);
                  }}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    projectMode === 'current'
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-200'
                      : 'border-gray-700/70 bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMode('new');
                    setProjectError(null);
                  }}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    projectMode === 'new'
                      ? 'border-amber-500/60 bg-amber-500/10 text-amber-200'
                      : 'border-gray-700/70 bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  New
                </button>
              </div>

              {projectMode === 'current' ? (
                <div>
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(Number(event.target.value))}
                    disabled={isProjectsLoading || projects.length === 0}
                    className="w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {isProjectsLoading ? 'Loading projects...' : projects.length ? 'Select project' : 'No projects'}
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {selectedProject && <p className="mt-2 text-xs text-gray-500">Using: {selectedProject.name}</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(event) => setNewProjectName(event.target.value)}
                    placeholder="Project name"
                    className="w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <textarea
                    value={newProjectDescription}
                    onChange={(event) => setNewProjectDescription(event.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                    className="w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              )}
            </div>

            {projectError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {projectError}
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending || provider !== 'aws'}
              className={`cursor-pointer w-full flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
                createMutation.isPending || provider !== 'aws'
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {createMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Provisioning...
                </>
              ) : provider !== 'aws' ? (
                `Coming soon for ${provider.toUpperCase()}`
              ) : (
                createButtonLabel
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(messagingListPath)}
              className="cursor-pointer w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CreateMessagingPage;
