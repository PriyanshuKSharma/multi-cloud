import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { formatTerraformOutput, normalizeLogText } from '../utils/terraformOutput';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import TextInputDialog from '../components/ui/TextInputDialog';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Terminal,
  AlertCircle,
  CalendarClock,
  Cloud,
  Boxes,
  Activity,
  Download,
  Upload,
  FolderUp,
  Globe2,
  ExternalLink,
} from 'lucide-react';

interface DeploymentDetail {
  id: number;
  resource_id: number;
  resource_name: string;
  provider: string;
  resource_type: string;
  status: string;
  project_id: number;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  has_logs: boolean;
  log_line_count: number;
  logs: string;
  configuration: Record<string, unknown>;
  terraform_output: Record<string, unknown>;
}

interface StorageObject {
  key: string;
  size: number;
  etag?: string;
  last_modified?: string;
}

interface StorageWebsiteInfo {
  enabled: boolean;
  website_url: string;
  index_document?: string;
  error_document?: string;
}

const normalizeDeploymentDetail = (deployment: unknown): DeploymentDetail => {
  const item = (deployment ?? {}) as Record<string, unknown>;
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

  return {
    id: Number(item.id ?? 0),
    resource_id: Number(item.resource_id ?? item.id ?? 0),
    resource_name: String(item.resource_name ?? 'Unnamed Resource'),
    provider: String(item.provider ?? '').toLowerCase(),
    resource_type: String(item.resource_type ?? 'resource'),
    status: String(item.status ?? 'pending'),
    project_id: Number(item.project_id ?? 0),
    started_at: String(item.started_at ?? new Date().toISOString()),
    completed_at: item.completed_at ? String(item.completed_at) : null,
    duration_seconds:
      typeof item.duration_seconds === 'number'
        ? item.duration_seconds
        : item.duration_seconds
          ? Number(item.duration_seconds)
          : null,
    has_logs: Boolean(item.has_logs),
    log_line_count: Number(item.log_line_count ?? 0),
    logs: typeof item.logs === 'string' ? item.logs : '',
    configuration: asObject(item.configuration),
    terraform_output: asObject(item.terraform_output),
  };
};

const prettyJson = (value: Record<string, unknown>) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
};

const formatObjectSize = (sizeBytes: number) => {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(2)} KB`;
  if (sizeBytes < 1024 * 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const downloadBlob = (filename: string, blob: Blob) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
};

const DeploymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const logsRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);

  const [operationMessage, setOperationMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
    href?: string;
  } | null>(null);
  const [selectedDownloadKey, setSelectedDownloadKey] = React.useState('');
  const [isDownloadSubmitting, setIsDownloadSubmitting] = React.useState(false);

  const [pendingUploadFile, setPendingUploadFile] = React.useState<File | null>(null);
  const [uploadKeyInput, setUploadKeyInput] = React.useState('');
  const [uploadDialogError, setUploadDialogError] = React.useState<string | null>(null);
  const [isUploadSubmitting, setIsUploadSubmitting] = React.useState(false);

  const [pendingFolderFiles, setPendingFolderFiles] = React.useState<File[]>([]);
  const [folderPrefixInput, setFolderPrefixInput] = React.useState('');
  const [folderDialogError, setFolderDialogError] = React.useState<string | null>(null);
  const [isFolderUploading, setIsFolderUploading] = React.useState(false);

  const [websiteIndexDocument, setWebsiteIndexDocument] = React.useState('index.html');
  const [websiteErrorDocument, setWebsiteErrorDocument] = React.useState('error.html');
  const [websitePublicRead, setWebsitePublicRead] = React.useState(true);
  const [websiteDialogError, setWebsiteDialogError] = React.useState<string | null>(null);
  const [isWebsiteSubmitting, setIsWebsiteSubmitting] = React.useState(false);

  const { data: deployment, isLoading, isError, error, refetch, isFetching } = useQuery<DeploymentDetail>({
    queryKey: ['deployments', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(`/deployments/${id}`);
      return normalizeDeploymentDetail(response.data);
    },
    refetchInterval: 10000,
  });

  const isAwsStorage = Boolean(
    deployment &&
    deployment.provider.toLowerCase() === 'aws' &&
    deployment.resource_type.toLowerCase() === 'storage'
  );

  const {
    data: storageObjects = [],
    refetch: refetchStorageObjects,
    isFetching: isStorageFetching,
  } = useQuery<StorageObject[]>({
    queryKey: ['deployments', 'detail', id, 'storage', 'objects'],
    enabled: Boolean(id) && isAwsStorage,
    queryFn: async () => {
      const response = await axios.get(`/resources/${id}/storage/objects`, {
        params: { source: 'provisioning', max_keys: 300 },
      });
      const payload = response.data;
      return Array.isArray(payload?.items) ? (payload.items as StorageObject[]) : [];
    },
    refetchInterval: isAwsStorage ? 15000 : false,
  });

  const {
    data: websiteInfo,
    refetch: refetchWebsiteInfo,
    isFetching: isWebsiteInfoFetching,
  } = useQuery<StorageWebsiteInfo>({
    queryKey: ['deployments', 'detail', id, 'storage', 'website'],
    enabled: Boolean(id) && isAwsStorage,
    queryFn: async () => {
      const response = await axios.get(`/resources/${id}/storage/website`, {
        params: { source: 'provisioning' },
      });
      return response.data as StorageWebsiteInfo;
    },
    refetchInterval: isAwsStorage ? 20000 : false,
  });

  React.useEffect(() => {
    if (!folderInputRef.current) return;
    folderInputRef.current.setAttribute('webkitdirectory', '');
    folderInputRef.current.setAttribute('directory', '');
  }, []);

  React.useEffect(() => {
    if (!storageObjects.length) {
      setSelectedDownloadKey('');
      return;
    }
    if (!selectedDownloadKey || !storageObjects.some((item) => item.key === selectedDownloadKey)) {
      setSelectedDownloadKey(storageObjects[0].key);
    }
  }, [selectedDownloadKey, storageObjects]);

  React.useEffect(() => {
    if (!websiteInfo?.enabled) return;
    if (websiteInfo.index_document) setWebsiteIndexDocument(websiteInfo.index_document);
    if (websiteInfo.error_document) setWebsiteErrorDocument(websiteInfo.error_document);
  }, [websiteInfo]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may fail in insecure contexts; keep UX non-blocking.
    }
  };

  const formattedLogs = React.useMemo(
    () => normalizeLogText(deployment?.logs ?? ''),
    [deployment?.logs]
  );
  const formattedTerraformOutput = React.useMemo(
    () => formatTerraformOutput(deployment?.terraform_output ?? {}, { omitLogsKey: true }),
    [deployment?.terraform_output]
  );

  const downloadMetadata = () => {
    if (!deployment) return;
    const metadataPayload = {
      id: deployment.id,
      resource_id: deployment.resource_id,
      resource_name: deployment.resource_name,
      provider: deployment.provider,
      resource_type: deployment.resource_type,
      status: deployment.status,
      project_id: deployment.project_id,
      started_at: deployment.started_at,
      completed_at: deployment.completed_at,
      duration_seconds: deployment.duration_seconds,
      has_logs: deployment.has_logs,
      log_line_count: deployment.log_line_count,
    };
    const metadataBlob = new Blob([JSON.stringify(metadataPayload, null, 2)], { type: 'application/json' });
    downloadBlob(`deployment-${deployment.id}-metadata.json`, metadataBlob);
  };

  const handleDownloadObject = async () => {
    if (!deployment || !selectedDownloadKey) {
      setOperationMessage({ type: 'error', text: 'Select an object key before downloading.' });
      return;
    }

    setIsDownloadSubmitting(true);
    setOperationMessage(null);

    try {
      const response = await axios.get(`/resources/${deployment.id}/storage/download`, {
        params: { key: selectedDownloadKey, source: 'provisioning' },
        responseType: 'blob',
      });
      const filename = selectedDownloadKey.split('/').pop() || 'download';
      downloadBlob(filename, new Blob([response.data]));
      setOperationMessage({ type: 'success', text: `Downloaded "${selectedDownloadKey}".` });
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail;
      setOperationMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Failed to download object from bucket.',
      });
    } finally {
      setIsDownloadSubmitting(false);
    }
  };

  const triggerUploadFileSelection = () => {
    fileInputRef.current?.click();
  };

  const triggerFolderSelection = () => {
    folderInputRef.current?.click();
  };

  const handleUploadFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingUploadFile(file);
    setUploadKeyInput(file.name);
    setUploadDialogError(null);
    event.target.value = '';
  };

  const cancelUploadDialog = () => {
    if (isUploadSubmitting) return;
    setPendingUploadFile(null);
    setUploadKeyInput('');
    setUploadDialogError(null);
  };

  const submitUploadObject = async () => {
    if (!deployment || !pendingUploadFile) return;

    const selectedKey = uploadKeyInput.trim();
    if (!selectedKey) {
      setUploadDialogError('Object key is required.');
      return;
    }

    setIsUploadSubmitting(true);
    setUploadDialogError(null);

    const formData = new FormData();
    formData.append('file', pendingUploadFile);
    formData.append('key', selectedKey);

    try {
      await axios.post(`/resources/${deployment.id}/storage/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { source: 'provisioning' },
      });
      setPendingUploadFile(null);
      setUploadKeyInput('');
      setOperationMessage({ type: 'success', text: `Uploaded "${selectedKey}" to bucket.` });
      refetchStorageObjects();
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail;
      setUploadDialogError(typeof detail === 'string' ? detail : 'Failed to upload object.');
    } finally {
      setIsUploadSubmitting(false);
    }
  };

  const handleFolderSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setPendingFolderFiles(files);
    setFolderPrefixInput('');
    setFolderDialogError(null);
    event.target.value = '';
  };

  const cancelFolderDialog = () => {
    if (isFolderUploading) return;
    setPendingFolderFiles([]);
    setFolderPrefixInput('');
    setFolderDialogError(null);
  };

  const submitFolderUpload = async () => {
    if (!deployment || pendingFolderFiles.length === 0) return;

    setIsFolderUploading(true);
    setFolderDialogError(null);

    const formData = new FormData();
    pendingFolderFiles.forEach((file) => {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('files', file);
      formData.append('keys', relativePath);
    });
    formData.append('prefix', folderPrefixInput.trim());

    try {
      const response = await axios.post(`/resources/${deployment.id}/storage/upload-folder`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { source: 'provisioning' },
      });
      const uploadedCount =
        typeof response.data?.uploaded_count === 'number' ? response.data.uploaded_count : pendingFolderFiles.length;
      setPendingFolderFiles([]);
      setFolderPrefixInput('');
      setOperationMessage({ type: 'success', text: `Uploaded ${uploadedCount} folder objects.` });
      refetchStorageObjects();
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail;
      setFolderDialogError(typeof detail === 'string' ? detail : 'Failed to upload folder.');
    } finally {
      setIsFolderUploading(false);
    }
  };

  const enableWebsiteHosting = async () => {
    if (!deployment) return;

    const indexDocument = websiteIndexDocument.trim();
    const errorDocument = websiteErrorDocument.trim();
    if (!indexDocument) {
      setWebsiteDialogError('Index document is required.');
      return;
    }
    if (!errorDocument) {
      setWebsiteDialogError('Error document is required.');
      return;
    }

    setIsWebsiteSubmitting(true);
    setWebsiteDialogError(null);
    setOperationMessage(null);

    try {
      const response = await axios.post(`/resources/${deployment.id}/storage/website/enable`, {
        index_document: indexDocument,
        error_document: errorDocument,
        public_read: websitePublicRead,
      }, {
        params: { source: 'provisioning' },
      });

      setOperationMessage({
        type: 'success',
        text: 'Static website hosting enabled for this bucket.',
        href: response.data?.website_url,
      });
      refetchWebsiteInfo();
    } catch (requestError: any) {
      const detail = requestError?.response?.data?.detail;
      setWebsiteDialogError(typeof detail === 'string' ? detail : 'Failed to enable static website hosting.');
    } finally {
      setIsWebsiteSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 bg-[#0f0f11] border border-gray-800/50 rounded-lg animate-pulse" />
        <div className="h-64 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
        <div className="h-80 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !deployment) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400">Deployment not found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {error instanceof Error ? error.message : 'Unable to load deployment details'}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={() => refetch()}
                className="cursor-pointer px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/deployments"
                className="cursor-pointer px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Deployments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id={`deployment-detail-${deployment.id}`}
        tone="orange"
        eyebrow="Deployment execution details"
        eyebrowIcon={<Cloud className="h-3.5 w-3.5" />}
        title={deployment.resource_name}
        titleIcon={<Boxes className="w-8 h-8 text-orange-300" />}
        description={`Deployment #${deployment.id} • ${deployment.resource_type}`}
        chips={[
          { label: deployment.provider.toUpperCase(), tone: 'orange' },
          { label: deployment.status, tone: deployment.status.toLowerCase() === 'failed' ? 'pink' : 'emerald' },
          { label: `${deployment.log_line_count} log lines`, tone: 'cyan' },
        ]}
        actions={
          <>
            <Link
              to="/deployments"
              className="cursor-pointer flex items-center rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
              aria-label="Back to deployments"
            >
              <ArrowLeft className="mr-2 w-4 h-4 text-gray-400" />
              Back
            </Link>
            <button
              onClick={() => refetch()}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={() => logsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/20 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Open Logs</span>
            </button>
          </>
        }
      />

      <PageGuide
        title="About This Deployment"
        purpose="Deployment details show metadata, configuration payload, Terraform output, and logs for troubleshooting."
        actions={[
          'inspect deployment metadata and status',
          'download metadata for audit or documentation',
          'use S3 operations when this deployment represents an AWS storage bucket',
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Deployment Metadata</span>
            </h3>
            <button
              onClick={downloadMetadata}
              className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-gray-700/60 bg-gray-800/50 px-2.5 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Resource ID</span>
              <span className="text-gray-200 font-mono">{deployment.resource_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Project ID</span>
              <span className="text-gray-200 font-mono">{deployment.project_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Provider</span>
              <span className="text-gray-200 capitalize">{deployment.provider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-200 capitalize">{deployment.resource_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Started</span>
              <span className="text-gray-200">{new Date(deployment.started_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Completed</span>
              <span className="text-gray-200">
                {deployment.completed_at ? new Date(deployment.completed_at).toLocaleString() : 'In progress'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="text-gray-200">
                {deployment.duration_seconds !== null && deployment.duration_seconds !== undefined
                  ? `${deployment.duration_seconds}s`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Log lines</span>
              <span className="text-gray-200">{deployment.log_line_count}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <span>Configuration</span>
              </h3>
              <button
                onClick={() => copyText(prettyJson(deployment.configuration))}
                className="cursor-pointer p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
                title="Copy configuration JSON"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-[#0b0d12] border border-gray-800/50 rounded-lg p-4 overflow-auto font-mono">
              {prettyJson(deployment.configuration)}
            </pre>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-violet-400" />
                <span>Terraform Output</span>
              </h3>
              <button
                onClick={() => copyText(formattedTerraformOutput)}
                className="cursor-pointer p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
                title="Copy Terraform output JSON"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-[#0b0d12] border border-gray-800/50 rounded-lg p-4 overflow-auto font-mono">
              {formattedTerraformOutput}
            </pre>
          </div>
        </div>
      </div>

      {isAwsStorage && (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Globe2 className="w-5 h-5 text-cyan-400" />
              <span>S3 Bucket Operations</span>
            </h3>
            <button
              onClick={() => {
                refetchStorageObjects();
                refetchWebsiteInfo();
              }}
              className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-gray-700/60 bg-gray-800/50 px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(isStorageFetching || isWebsiteInfoFetching) ? 'animate-spin' : ''}`} />
              <span>Refresh S3</span>
            </button>
          </div>

          {operationMessage && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                operationMessage.type === 'success'
                  ? 'border-green-500/30 bg-green-500/10 text-green-300'
                  : 'border-red-500/30 bg-red-500/10 text-red-300'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span>{operationMessage.text}</span>
                {operationMessage.href && (
                  <a
                    href={operationMessage.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-white"
                  >
                    Open site
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Object Key</label>
              <select
                value={selectedDownloadKey}
                onChange={(event) => setSelectedDownloadKey(event.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {storageObjects.length === 0 ? (
                  <option value="">No objects found</option>
                ) : (
                  storageObjects.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.key}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleDownloadObject}
                disabled={!selectedDownloadKey || isDownloadSubmitting}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadSubmitting ? 'Downloading...' : 'Download Object'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={triggerUploadFileSelection}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
            </button>
            <button
              onClick={triggerFolderSelection}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            >
              <FolderUp className="w-4 h-4" />
              <span>Upload Folder</span>
            </button>
          </div>

          <div className="rounded-xl border border-gray-800/60 bg-[#0b0d12] p-4 space-y-4">
            <h4 className="text-sm font-semibold text-gray-200">Static Website Hosting</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Index Document</label>
                <input
                  type="text"
                  value={websiteIndexDocument}
                  onChange={(event) => setWebsiteIndexDocument(event.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700/60 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="index.html"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Error Document</label>
                <input
                  type="text"
                  value={websiteErrorDocument}
                  onChange={(event) => setWebsiteErrorDocument(event.target.value)}
                  className="w-full px-3 py-2 bg-gray-900/70 border border-gray-700/60 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="error.html"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={websitePublicRead}
                onChange={(event) => setWebsitePublicRead(event.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-cyan-500/50"
              />
              Enable public read for static site content
            </label>
            {websiteDialogError && <p className="text-sm text-red-400">{websiteDialogError}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={enableWebsiteHosting}
                disabled={isWebsiteSubmitting}
                className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Globe2 className="w-4 h-4" />
                <span>{isWebsiteSubmitting ? 'Enabling...' : 'Enable Website Hosting'}</span>
              </button>
              {websiteInfo?.enabled && websiteInfo.website_url && (
                <a
                  href={websiteInfo.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                >
                  {websiteInfo.website_url}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-800/60 bg-[#0b0d12] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800/60 text-sm font-semibold text-gray-200">
              Bucket Object Preview
            </div>
            {storageObjects.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">No objects currently in bucket.</div>
            ) : (
              <div className="max-h-56 overflow-auto divide-y divide-gray-800/60">
                {storageObjects.slice(0, 20).map((item) => (
                  <div key={item.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-300 truncate">{item.key}</span>
                    <span className="text-xs text-gray-500 shrink-0">{formatObjectSize(item.size || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={logsRef} className="bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <CalendarClock className="w-5 h-5 text-emerald-400" />
            <span>Deployment Logs</span>
          </h3>
          <button
            onClick={() => copyText(formattedLogs)}
            className="cursor-pointer p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
            title="Copy logs"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-[#0b0d12]">
          <pre className="text-sm text-green-200 font-mono whitespace-pre-wrap break-all max-h-[28rem] overflow-auto">
            {formattedLogs || 'No logs available for this deployment yet.'}
          </pre>
        </div>
      </div>

      <TextInputDialog
        open={pendingUploadFile !== null}
        title="Upload Object"
        description={deployment ? `Bucket deployment: ${deployment.resource_name}` : undefined}
        label="Object Key"
        placeholder="Enter object key"
        value={uploadKeyInput}
        error={uploadDialogError}
        confirmLabel="Upload"
        cancelLabel="Cancel"
        isLoading={isUploadSubmitting}
        onChange={setUploadKeyInput}
        onCancel={cancelUploadDialog}
        onConfirm={submitUploadObject}
      />

      <TextInputDialog
        open={pendingFolderFiles.length > 0}
        title="Upload Folder"
        description={`${pendingFolderFiles.length} files selected`}
        label="Optional Prefix"
        placeholder="example: website/"
        value={folderPrefixInput}
        error={folderDialogError}
        confirmLabel="Upload Folder"
        cancelLabel="Cancel"
        isLoading={isFolderUploading}
        onChange={setFolderPrefixInput}
        onCancel={cancelFolderDialog}
        onConfirm={submitFolderUpload}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadFileSelected}
      />
      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFolderSelected}
      />
    </div>
  );
};

export default DeploymentDetailPage;
