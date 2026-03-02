import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import TextInputDialog from '../../components/ui/TextInputDialog';
import { useTheme } from '../../context/ThemeContext';
import {
  Database,
  Plus,
  Search,
  RefreshCw,
  Terminal,
  HardDrive,
  Trash2,
  Download,
  Upload,
  FolderUp,
  Layers3,
  ShieldCheck,
  Globe2,
  FilterX,
  Clock3,
  MapPin,
  ArrowUpRight,
  Tag,
  Lock,
  Unlock,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StorageResource {
  id: number;
  resource_id: string;
  resource_name: string;
  provider: string;
  region: string;
  status: string;
  source: 'inventory' | 'provisioning';
  metadata: {
    bucket_type?: string;
    size_gb?: number;
    object_count?: number;
    storage_class?: string;
    versioning_enabled?: boolean;
    public_access?: boolean;
    encryption?: string;
    tags?: Record<string, string>;
  };
  created_at: string;
  last_synced: string;
}

interface ProvisionedResource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  configuration?: Record<string, unknown>;
  created_at: string;
}

interface StorageObject {
  key: string;
  size: number;
  etag?: string;
  last_modified?: string;
}

interface DownloadDialogState {
  resource: StorageResource;
  objects: StorageObject[];
}

interface StorageWebsiteResponse {
  website_url: string;
  index_document: string;
  error_document: string;
  public_read: boolean;
}

const normalizeInventoryStorage = (item: any): StorageResource => {
  const metadata = item.metadata ?? {};
  
  return {
    id: item.id,
    resource_id: item.resource_id ?? '',
    resource_name: item.resource_name ?? item.name ?? 'Unnamed Storage',
    provider: String(item.provider ?? '').toLowerCase(),
    region: item.region ?? 'unknown',
    status: item.status ?? 'unknown',
    source: 'inventory',
    metadata: {
      bucket_type: metadata.bucket_type ?? item.bucket_type,
      size_gb: metadata.size_gb ?? item.size_gb,
      object_count: metadata.object_count ?? item.object_count,
      storage_class: metadata.storage_class ?? item.storage_class,
      versioning_enabled: metadata.versioning_enabled ?? item.versioning_enabled,
      public_access: metadata.public_access ?? item.public_access,
      encryption: metadata.encryption ?? item.encryption,
      tags: metadata.tags ?? item.tags,
    },
    created_at: item.created_at ?? '',
    last_synced: item.last_synced ?? item.last_synced_at ?? '',
  };
};

const normalizeProvisionedStorage = (item: ProvisionedResource): StorageResource => {
  const config = item.configuration ?? {};
  const regionValue = config.region ?? config.location;
  const encryptionEnabled = config.encryption_enabled ?? config.encryption;
  const versioningEnabled = config.versioning_enabled;
  const publicAccess = config.public_access;

  return {
    id: item.id,
    resource_id: String(item.id),
    resource_name: item.name || 'Unnamed Storage',
    provider: String(item.provider ?? '').toLowerCase(),
    region: typeof regionValue === 'string' ? regionValue : 'unknown',
    status: item.status || 'pending',
    source: 'provisioning',
    metadata: {
      bucket_type: 'object-storage',
      size_gb: undefined,
      object_count: undefined,
      storage_class: 'Provisioning',
      versioning_enabled: typeof versioningEnabled === 'boolean' ? versioningEnabled : undefined,
      public_access: typeof publicAccess === 'boolean' ? publicAccess : undefined,
      encryption: typeof encryptionEnabled === 'boolean'
        ? (encryptionEnabled ? 'enabled' : 'disabled')
        : undefined,
      tags: undefined,
    },
    created_at: item.created_at ?? '',
    last_synced: item.created_at ?? '',
  };
};

const normalizeStorageStatus = (status: string): StorageResource['status'] => {
  if (!status) return 'unknown';
  return status.toLowerCase();
};

const StoragePage: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    search: '',
  });
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
    href?: string;
  } | null>(null);
  const [uploadTarget, setUploadTarget] = React.useState<StorageResource | null>(null);
  const [folderUploadTarget, setFolderUploadTarget] = React.useState<StorageResource | null>(null);
  const [downloadDialog, setDownloadDialog] = React.useState<DownloadDialogState | null>(null);
  const [downloadKeyInput, setDownloadKeyInput] = React.useState('');
  const [downloadDialogError, setDownloadDialogError] = React.useState<string | null>(null);
  const [isDownloadSubmitting, setIsDownloadSubmitting] = React.useState(false);
  const [storageToDelete, setStorageToDelete] = React.useState<StorageResource | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = React.useState<File | null>(null);
  const [uploadKeyInput, setUploadKeyInput] = React.useState('');
  const [uploadDialogError, setUploadDialogError] = React.useState<string | null>(null);
  const [isUploadSubmitting, setIsUploadSubmitting] = React.useState(false);
  const [pendingFolderFiles, setPendingFolderFiles] = React.useState<File[]>([]);
  const [folderPrefixInput, setFolderPrefixInput] = React.useState('');
  const [folderUploadError, setFolderUploadError] = React.useState<string | null>(null);
  const [isFolderUploading, setIsFolderUploading] = React.useState(false);
  const [websiteTarget, setWebsiteTarget] = React.useState<StorageResource | null>(null);
  const [websiteIndexDocument, setWebsiteIndexDocument] = React.useState('index.html');
  const [websiteErrorDocument, setWebsiteErrorDocument] = React.useState('error.html');
  const [websitePublicRead, setWebsitePublicRead] = React.useState(true);
  const [websiteDialogError, setWebsiteDialogError] = React.useState<string | null>(null);
  const [isWebsiteSubmitting, setIsWebsiteSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);

  const { data: storage, isLoading, error, refetch } = useQuery<StorageResource[]>({
    queryKey: ['inventory', 'storage', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);
      
      const [inventoryResponse, resourcesResponse] = await Promise.all([
        axios.get(`/inventory/storage?${params.toString()}`),
        axios.get('/resources/?limit=500'),
      ]);

      const inventoryPayload = inventoryResponse.data;
      const inventoryItems = (
        Array.isArray(inventoryPayload)
          ? inventoryPayload
          : Array.isArray(inventoryPayload?.items)
            ? inventoryPayload.items
            : []
      ).map(normalizeInventoryStorage);

      const resourcesPayload = resourcesResponse.data;
      const provisionedResources = (
        Array.isArray(resourcesPayload)
          ? resourcesPayload
          : Array.isArray(resourcesPayload?.items)
            ? resourcesPayload.items
            : []
      ) as ProvisionedResource[];

      const provisionedItems = provisionedResources
        .filter((item) => String(item.type).toLowerCase() === 'storage')
        .map(normalizeProvisionedStorage)
        .filter((item: StorageResource) => (filters.provider ? item.provider === filters.provider : true))
        .filter((item: StorageResource) => (filters.region ? item.region === filters.region : true))
        .map((item: StorageResource) => ({ ...item, status: normalizeStorageStatus(item.status) }));

      const mergedMap = new Map<string, StorageResource>();
      for (const item of inventoryItems) {
        const key = `${item.provider}:${item.resource_name}`.toLowerCase();
        mergedMap.set(key, item);
      }
      for (const item of provisionedItems) {
        const key = `${item.provider}:${item.resource_name}`.toLowerCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        }
      }

      return [...mergedMap.values()].sort((a, b) => {
        const aDate = Date.parse(a.last_synced || a.created_at || '') || 0;
        const bDate = Date.parse(b.last_synced || b.created_at || '') || 0;
        return bDate - aDate;
      });
    },
    refetchInterval: 10000,
  });

  React.useEffect(() => {
    if (!folderInputRef.current) return;
    folderInputRef.current.setAttribute('webkitdirectory', '');
    folderInputRef.current.setAttribute('directory', '');
  }, []);

  const filteredStorage = (storage ?? []).filter((item) =>
    item.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      await axios.delete(`/resources/${resourceId}`);
    },
    onMutate: (resourceId) => {
      setDeletingId(resourceId);
      setDeleteError(null);
      setActionMessage(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setDeleteError(typeof detail === 'string' ? detail : 'Failed to delete storage resource record.');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const listStorageObjects = async (resourceId: number, source: string): Promise<StorageObject[]> => {
    const response = await axios.get(`/resources/${resourceId}/storage/objects`, {
      params: { max_keys: 200, source },
    });
    const payload = response.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items as StorageObject[];
  };

  const handleDownload = async (item: StorageResource) => {
    setDeleteError(null);
    setActionMessage(null);
    setDownloadDialogError(null);

    if (item.source === 'inventory' && item.provider !== 'aws') {
      setActionMessage({
        type: 'error',
        text: 'Download is currently supported only for AWS inventory resources.',
      });
      return;
    }

    try {
      const objects = await listStorageObjects(item.id, item.source);
      if (!objects.length) {
        setActionMessage({
          type: 'error',
          text: `No objects found in bucket "${item.resource_name}". Upload a file first.`,
        });
        return;
      }

      const defaultKey = objects[0].key;
      setDownloadDialog({ resource: item, objects });
      setDownloadKeyInput(defaultKey);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Failed to download object from bucket.',
      });
    }
  };

  const closeDownloadDialog = () => {
    if (isDownloadSubmitting) return;
    setDownloadDialog(null);
    setDownloadKeyInput('');
    setDownloadDialogError(null);
  };

  const handleConfirmDownload = async () => {
    if (!downloadDialog) return;

    const selectedKey = downloadKeyInput.trim();
    if (!selectedKey) {
      setDownloadDialogError('Object key is required.');
      return;
    }

    setIsDownloadSubmitting(true);
    setDownloadDialogError(null);

    try {
      const response = await axios.get(`/resources/${downloadDialog.resource.id}/storage/download`, {
        params: { key: selectedKey, source: downloadDialog.resource.source },
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = selectedKey.split('/').pop() || 'download';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      setActionMessage({
        type: 'success',
        text: `Downloaded "${selectedKey}" from "${downloadDialog.resource.resource_name}".`,
      });
      setDownloadDialog(null);
      setDownloadKeyInput('');
      setDownloadDialogError(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setDownloadDialogError(typeof detail === 'string' ? detail : 'Failed to download object from bucket.');
    } finally {
      setIsDownloadSubmitting(false);
    }
  };

  const handleUploadClick = (item: StorageResource) => {
    setDeleteError(null);
    setActionMessage(null);
    if (item.source === 'inventory' && item.provider !== 'aws') {
      setActionMessage({
        type: 'error',
        text: 'Upload is currently supported only for AWS inventory resources.',
      });
      return;
    }
    setUploadTarget(item);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTarget) return;

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
    setUploadTarget(null);
  };

  const submitUploadObject = async () => {
    if (!pendingUploadFile || !uploadTarget) return;

    const selectedKey = uploadKeyInput.trim();
    if (!selectedKey) {
      setUploadDialogError('Object key is required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', pendingUploadFile);
    formData.append('key', selectedKey);

    setIsUploadSubmitting(true);
    setUploadDialogError(null);

    try {
      await axios.post(`/resources/${uploadTarget.id}/storage/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { source: uploadTarget.source },
      });
      setActionMessage({
        type: 'success',
        text: `Uploaded "${selectedKey}" to "${uploadTarget.resource_name}".`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setPendingUploadFile(null);
      setUploadKeyInput('');
      setUploadTarget(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setUploadDialogError(typeof detail === 'string' ? detail : 'Failed to upload object to bucket.');
    } finally {
      setIsUploadSubmitting(false);
    }
  };

  const handleFolderUploadClick = (item: StorageResource) => {
    setDeleteError(null);
    setActionMessage(null);
    if (item.source === 'inventory' && item.provider !== 'aws') {
      setActionMessage({
        type: 'error',
        text: 'Folder upload is currently supported only for AWS inventory resources.',
      });
      return;
    }
    setFolderUploadTarget(item);
    folderInputRef.current?.click();
  };

  const handleFolderSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length || !folderUploadTarget) return;

    setPendingFolderFiles(selectedFiles);
    setFolderPrefixInput('');
    setFolderUploadError(null);
    event.target.value = '';
  };

  const cancelFolderUploadDialog = () => {
    if (isFolderUploading) return;
    setPendingFolderFiles([]);
    setFolderPrefixInput('');
    setFolderUploadError(null);
    setFolderUploadTarget(null);
  };

  const submitFolderUpload = async () => {
    if (!folderUploadTarget || pendingFolderFiles.length === 0) return;

    const formData = new FormData();
    pendingFolderFiles.forEach((file) => {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('files', file);
      formData.append('keys', relativePath);
    });
    formData.append('prefix', folderPrefixInput.trim());

    setIsFolderUploading(true);
    setFolderUploadError(null);

    try {
      const response = await axios.post(`/resources/${folderUploadTarget.id}/storage/upload-folder`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { source: folderUploadTarget.source },
      });

      const uploadedCount =
        typeof response.data?.uploaded_count === 'number' ? response.data.uploaded_count : pendingFolderFiles.length;
      setActionMessage({
        type: 'success',
        text: `Uploaded ${uploadedCount} files to "${folderUploadTarget.resource_name}".`,
      });

      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setPendingFolderFiles([]);
      setFolderPrefixInput('');
      setFolderUploadTarget(null);
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setFolderUploadError(typeof detail === 'string' ? detail : 'Failed to upload folder contents.');
    } finally {
      setIsFolderUploading(false);
    }
  };

  const openWebsiteDialog = (item: StorageResource) => {
    setDeleteError(null);
    setActionMessage(null);
    if (item.provider !== 'aws') {
      setActionMessage({
        type: 'error',
        text: 'Static website hosting is currently supported only for AWS S3 buckets.',
      });
      return;
    }

    setWebsiteTarget(item);
    setWebsiteIndexDocument('index.html');
    setWebsiteErrorDocument('error.html');
    setWebsitePublicRead(true);
    setWebsiteDialogError(null);
  };

  const cancelWebsiteDialog = () => {
    if (isWebsiteSubmitting) return;
    setWebsiteTarget(null);
    setWebsiteDialogError(null);
  };

  const enableWebsiteHosting = async () => {
    if (!websiteTarget) return;

    const trimmedIndexDocument = websiteIndexDocument.trim();
    const trimmedErrorDocument = websiteErrorDocument.trim();
    if (!trimmedIndexDocument) {
      setWebsiteDialogError('Index document is required.');
      return;
    }
    if (!trimmedErrorDocument) {
      setWebsiteDialogError('Error document is required.');
      return;
    }

    setIsWebsiteSubmitting(true);
    setWebsiteDialogError(null);

    try {
      const response = await axios.post<StorageWebsiteResponse>(
        `/resources/${websiteTarget.id}/storage/website/enable`,
        {
          index_document: trimmedIndexDocument,
          error_document: trimmedErrorDocument,
          public_read: websitePublicRead,
        },
        {
          params: { source: websiteTarget.source },
        }
      );

      setActionMessage({
        type: 'success',
        text: `Static website hosting enabled for "${websiteTarget.resource_name}".`,
        href: response.data.website_url,
      });
      setWebsiteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setWebsiteDialogError(typeof detail === 'string' ? detail : 'Failed to enable static website hosting.');
    } finally {
      setIsWebsiteSubmitting(false);
    }
  };

  const formatSize = (sizeGb?: number) => {
    if (!sizeGb) return 'N/A';
    if (sizeGb < 1) return `${(sizeGb * 1024).toFixed(2)} MB`;
    if (sizeGb < 1024) return `${sizeGb.toFixed(2)} GB`;
    return `${(sizeGb / 1024).toFixed(2)} TB`;
  };

  const formatObjectSize = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(2)} KB`;
    if (sizeBytes < 1024 * 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const totalResources = storage?.length ?? 0;
  const filteredCount = filteredStorage.length;
  const totalObjects = filteredStorage.reduce((sum, item) => sum + (item.metadata.object_count || 0), 0);
  const totalSizeGb = filteredStorage.reduce((sum, item) => sum + (item.metadata.size_gb || 0), 0);
  const encryptedCount = filteredStorage.filter((item) => {
    const encryption = String(item.metadata.encryption ?? '').toLowerCase();
    return encryption.includes('enabled') || encryption.includes('aes') || encryption.includes('kms');
  }).length;
  const publicCount = filteredStorage.filter((item) => Boolean(item.metadata.public_access)).length;
  const provisioningCount = filteredStorage.filter((item) => item.source === 'provisioning').length;
  const inventoryCount = filteredStorage.filter((item) => item.source === 'inventory').length;
  const hasActiveFilters = Boolean(filters.provider || filters.region || filters.search);

  const clearFilters = () => {
    setFilters({ provider: '', region: '', search: '' });
  };

  const statCardClass = isLight
    ? 'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-indigo-50/55 p-4 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/80'
    : 'group relative overflow-hidden rounded-2xl border border-gray-800/70 bg-gradient-to-br from-[#14141a] via-[#101016] to-[#0b0b11] p-4 shadow-[0_18px_30px_-24px_rgba(14,165,233,0.45)] transition-all duration-300 hover:border-indigo-500/40';
  const statLabelClass = isLight
    ? 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600'
    : 'text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500';
  const statValueClass = isLight
    ? 'mt-1 text-2xl font-semibold tracking-tight text-slate-900'
    : 'mt-1 text-2xl font-semibold tracking-tight text-white';
  const statMetaClass = isLight
    ? 'mt-1 text-xs text-slate-500'
    : 'mt-1 text-xs text-gray-500';
  const statIconShellClass = isLight
    ? 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm'
    : 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-700/70 bg-gray-900/80 text-gray-200';
  const statAccentLineClass = isLight
    ? 'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-300/0 via-indigo-500/60 to-cyan-500/0'
    : 'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-500/0 via-cyan-400/70 to-indigo-500/0';
  const heroConsoleButtonClass = isLight
    ? 'cursor-pointer flex items-center space-x-2 px-4 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg border border-cyan-200 transition-all duration-200'
    : 'cursor-pointer flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/20 transition-all duration-200';
  const heroRefreshButtonClass = isLight
    ? 'cursor-pointer flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-all duration-200'
    : 'cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-900/70 hover:bg-gray-900 text-gray-200 rounded-lg border border-gray-700/70 transition-all duration-200';
  const deleteErrorClass = isLight
    ? 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'
    : 'rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300';
  const actionMessageSuccessClass = isLight
    ? 'border-green-200 bg-green-50 text-green-700'
    : 'border-green-500/30 bg-green-500/10 text-green-300';
  const actionMessageErrorClass = isLight
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-red-500/30 bg-red-500/10 text-red-300';
  const filterPanelClass = isLight
    ? 'rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50/95 p-6 space-y-4 shadow-[0_22px_40px_-28px_rgba(15,23,42,0.35)]'
    : 'rounded-2xl border border-gray-800/60 bg-gradient-to-br from-[#111117] to-[#0b0b10] p-6 space-y-4';
  const filterHintClass = isLight
    ? 'text-sm text-slate-700 flex items-center gap-2'
    : 'text-sm text-gray-300 flex items-center gap-2';
  const filterHintIconClass = isLight ? 'h-4 w-4 text-indigo-600' : 'h-4 w-4 text-indigo-300';
  const clearFilterButtonClass = isLight
    ? 'cursor-pointer px-3 py-1.5 rounded-lg text-xs border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
    : 'cursor-pointer px-3 py-1.5 rounded-lg text-xs border border-gray-700/70 bg-gray-900/60 text-gray-300 hover:bg-gray-800/60 disabled:opacity-50 disabled:cursor-not-allowed';
  const filterControlCardClass = isLight
    ? 'rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 space-y-1.5'
    : 'rounded-xl border border-gray-800/70 bg-[#0d0d12]/90 p-3 space-y-1.5';
  const filterLabelClass = isLight
    ? 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600'
    : 'text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500';
  const filterInputClass = isLight
    ? 'w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
    : 'w-full pl-10 pr-4 py-2 bg-gray-900/70 border border-gray-700/60 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';
  const filterSelectClass = isLight
    ? 'w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
    : 'w-full px-4 py-2 bg-gray-900/70 border border-gray-700/60 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';
  const activeFilterPillClass = isLight
    ? 'inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700'
    : 'inline-flex items-center gap-1 rounded-full border border-gray-700/70 bg-gray-900/80 px-2.5 py-1 text-xs text-gray-300';
  const loadingCardClass = isLight
    ? 'h-36 rounded-2xl border border-slate-200 bg-white animate-pulse'
    : 'h-36 rounded-2xl border border-gray-800/50 bg-[#0f0f11] animate-pulse';
  const listErrorContainerClass = isLight
    ? 'bg-red-50 border border-red-200 rounded-xl p-6 text-center'
    : 'bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center';
  const listErrorTextClass = isLight ? 'text-red-700' : 'text-red-400';
  const storageCardClass = isLight
    ? 'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-indigo-50/70 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300/80 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)]'
    : 'group relative overflow-hidden rounded-2xl border border-gray-800/70 bg-gradient-to-br from-[#151520] via-[#101016] to-[#0b0b11] p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/35 hover:shadow-[0_16px_32px_-18px_rgba(99,102,241,0.45)]';
  const resourceTitleClass = isLight
    ? 'truncate text-lg font-semibold text-slate-900 transition-colors hover:text-indigo-700'
    : 'truncate text-lg font-semibold text-white transition-colors hover:text-indigo-300';
  const resourceTitleStaticClass = isLight
    ? 'text-lg font-semibold text-slate-900 truncate'
    : 'text-lg font-semibold text-white truncate';
  const resourceIdTextClass = isLight ? 'mt-1 truncate text-xs text-slate-500' : 'mt-1 truncate text-xs text-gray-500';
  const resourceMetaTextClass = isLight
    ? 'mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700'
    : 'mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-300';
  const resourceMetaChipClass = isLight
    ? 'inline-flex items-center gap-1 rounded-md border border-slate-300/90 bg-white/90 px-2 py-0.5'
    : 'inline-flex items-center gap-1 rounded-md border border-gray-700/60 bg-gray-800/40 px-2 py-0.5';
  const resourceMetaIconClass = isLight ? 'h-3 w-3 text-slate-500' : 'h-3 w-3 text-gray-400';
  const encryptionOnChipClass = isLight
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  const encryptionOffChipClass = isLight
    ? 'border-slate-300/90 bg-white/90 text-slate-700'
    : 'border-gray-700/60 bg-gray-800/40 text-gray-300';
  const publicChipClass = isLight
    ? 'border-amber-300 bg-amber-50 text-amber-700'
    : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
  const privateChipClass = isLight
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  const resourceMetricCardClass = isLight
    ? 'rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-[0_8px_22px_-16px_rgba(15,23,42,0.32)]'
    : 'rounded-xl border border-gray-800/70 bg-[#0c0c12]/95 p-3';
  const resourceMetricLabelClass = isLight
    ? 'text-[11px] uppercase tracking-wide text-slate-500'
    : 'text-[11px] uppercase tracking-wide text-gray-500';
  const resourceMetricValueClass = isLight
    ? 'mt-1 text-[15px] font-semibold text-slate-900'
    : 'mt-1 text-[15px] font-semibold text-gray-100';
  const resourceTagsClass = isLight
    ? 'rounded-md border border-slate-300/90 bg-white px-2 py-1 text-xs text-slate-700'
    : 'rounded-md border border-gray-700/60 bg-gray-800/60 px-2 py-1 text-xs text-gray-300';
  const resourceFooterClass = isLight
    ? 'mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3 text-xs text-slate-500'
    : 'mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800/70 pt-3 text-xs text-gray-500';
  const resourceFooterIconClass = isLight ? 'w-3.5 h-3.5 text-slate-500' : 'w-3.5 h-3.5 text-gray-500';
  const resourceActionsClass = isLight
    ? 'mt-4 rounded-xl border border-slate-200/90 bg-white/85 p-3'
    : 'mt-4 rounded-xl border border-gray-800/70 bg-[#0d0d12]/90 p-3';
  const actionHintTextClass = isLight ? 'mt-2 text-[11px] text-slate-500' : 'mt-2 text-[11px] text-gray-500';
  const neutralActionButtonClass = isLight
    ? 'cursor-pointer inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100'
    : 'cursor-pointer inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-gray-700/60 bg-gray-800/70 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:bg-gray-800';
  const disabledActionButtonClass = isLight
    ? 'h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 cursor-not-allowed'
    : 'h-10 rounded-lg border border-gray-700/40 bg-gray-800/50 px-3 py-1.5 text-xs font-medium text-gray-500 cursor-not-allowed';
  const websiteActionButtonClass = isLight
    ? 'cursor-pointer inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100'
    : 'cursor-pointer inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200 transition-colors hover:bg-blue-500/20';
  const deleteActionButtonClass = isLight
    ? 'cursor-pointer inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60'
    : 'cursor-pointer inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60';
  const emptyStateClass = isLight
    ? 'bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-[0_24px_44px_-30px_rgba(15,23,42,0.32)]'
    : 'bg-[#0f0f11] border border-gray-800/50 rounded-2xl p-12 text-center';
  const emptyIconClass = isLight ? 'w-16 h-16 text-slate-400 mx-auto mb-4' : 'w-16 h-16 text-gray-600 mx-auto mb-4';
  const emptyTitleClass = isLight
    ? 'text-lg font-semibold text-slate-700 mb-2'
    : 'text-lg font-semibold text-gray-400 mb-2';
  const emptyDescriptionClass = isLight ? 'text-sm text-slate-500 mb-6' : 'text-sm text-gray-500 mb-6';
  const summaryTextClass = isLight ? 'text-sm text-slate-600' : 'text-sm text-gray-500';
  const summaryMetaClass = isLight ? 'flex items-center space-x-4 text-sm text-slate-600' : 'flex items-center space-x-4 text-sm text-gray-400';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageHero
        id="storage-resources"
        tone="purple"
        collapsible
        eyebrow="Object and block storage inventory"
        eyebrowIcon={<Layers3 className="h-3.5 w-3.5" />}
        title="Storage Resources"
        titleIcon={<Database className="w-8 h-8 text-purple-400" />}
        description="Operate buckets and volumes across providers with deployment-linked controls."
        chips={[
          { label: `${provisioningCount} provisioning`, tone: 'cyan' },
          { label: `${inventoryCount} inventory`, tone: 'blue' },
          { label: `${encryptedCount} encrypted`, tone: 'emerald' },
        ]}
        actions={
          <>
            <Link
              to="/console"
              className={heroConsoleButtonClass}
            >
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Open Console</span>
            </Link>
            <button
              onClick={() => refetch()}
              className={heroRefreshButtonClass}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <Link
              to="/resources/storage/create"
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Storage</span>
            </Link>
          </>
        }
      />

      <PageGuide
        title="About Storage"
        purpose="Storage shows object and block storage resources discovered from connected cloud accounts."
        actions={[
          'search and filter storage assets by provider and region',
          'review size, object count, and security-related flags',
          'create new storage resources from this page',
        ]}
      />

      {deleteError && (
        <div className={deleteErrorClass}>
          {deleteError}
        </div>
      )}

      {actionMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            actionMessage.type === 'success'
              ? actionMessageSuccessClass
              : actionMessageErrorClass
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span>{actionMessage.text}</span>
            {actionMessage.href && (
              <a
                href={actionMessage.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-white"
              >
                Open website
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className={statCardClass}>
          <div className={statAccentLineClass} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={statLabelClass}>Visible Resources</p>
              <p className={statValueClass}>{filteredCount}</p>
              <p className={statMetaClass}>of {totalResources} total</p>
            </div>
            <span className={statIconShellClass}>
              <HardDrive className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className={statCardClass}>
          <div className={statAccentLineClass} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={statLabelClass}>Stored Objects</p>
              <p className={statValueClass}>{totalObjects.toLocaleString()}</p>
              <p className={statMetaClass}>across filtered resources</p>
            </div>
            <span className={statIconShellClass}>
              <Database className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className={statCardClass}>
          <div className={statAccentLineClass} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={statLabelClass}>Estimated Capacity</p>
              <p className={statValueClass}>{formatSize(totalSizeGb)}</p>
              <p className={statMetaClass}>based on synced metadata</p>
            </div>
            <span className={statIconShellClass}>
              <Layers3 className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className={statCardClass}>
          <div className={statAccentLineClass} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={statLabelClass}>Encrypted</p>
              <p className={statValueClass}>{encryptedCount}</p>
              <p className={statMetaClass}>{publicCount} public access enabled</p>
            </div>
            <span className={`${statIconShellClass} ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
        </div>
        <div className={statCardClass}>
          <div className={statAccentLineClass} />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={statLabelClass}>Source Mix</p>
              <p className={statValueClass}>{provisioningCount}/{inventoryCount}</p>
              <p className={statMetaClass}>provisioning / inventory</p>
            </div>
            <span className={`${statIconShellClass} ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
              <Globe2 className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={filterPanelClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={filterHintClass}>
            <FilterX className={filterHintIconClass} />
            <span>Filter storage resources by name, provider, and region</span>
          </div>
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={clearFilterButtonClass}
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={filterControlCardClass}>
            <label className={filterLabelClass}>Search</label>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-slate-500' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search storage..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className={filterInputClass}
              />
            </div>
          </div>

          <div className={filterControlCardClass}>
            <label className={filterLabelClass}>Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
              className={filterSelectClass}
            >
              <option value="">All Providers</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
          </div>

          <div className={filterControlCardClass}>
            <label className={filterLabelClass}>Region</label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              className={filterSelectClass}
            >
              <option value="">All Regions</option>
              <option value="ap-south-1">ap-south-1</option>
              <option value="us-east-1">us-east-1</option>
              <option value="us-west-2">us-west-2</option>
              <option value="eu-west-1">eu-west-1</option>
              <option value="eastus">eastus</option>
              <option value="westus">westus</option>
              <option value="us-central1">us-central1</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className={activeFilterPillClass}>
            <HardDrive className="h-3 w-3" />
            {filteredCount} shown
          </span>
          {filters.provider && (
            <span className={activeFilterPillClass}>Provider: {filters.provider.toUpperCase()}</span>
          )}
          {filters.region && (
            <span className={activeFilterPillClass}>Region: {filters.region}</span>
          )}
          {filters.search.trim() && (
            <span className={activeFilterPillClass}>Query: {filters.search.trim()}</span>
          )}
        </div>
      </div>

      {/* Storage List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={loadingCardClass}></div>
          ))}
        </div>
      ) : error ? (
        <div className={listErrorContainerClass}>
          <p className={listErrorTextClass}>Failed to load storage resources</p>
        </div>
      ) : filteredStorage && filteredStorage.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredStorage.map((item, index) => {
            const lastSeen = item.last_synced || item.created_at;
            const supportsObjectActions =
              item.source === 'provisioning' || (item.source === 'inventory' && item.provider === 'aws');
            const supportsWebsiteHosting = item.provider === 'aws' && supportsObjectActions;
            const isProvisioning = item.source === 'provisioning';
            const providerTone =
              item.provider === 'aws'
                ? isLight
                  ? {
                      accent: 'from-orange-400/80 to-amber-400/80',
                      chip: 'border-orange-300 bg-orange-50 text-orange-700',
                      panel: 'border-orange-200 bg-orange-50/70',
                      glow: 'from-orange-300/45 via-amber-300/25 to-transparent',
                    }
                  : {
                      accent: 'from-orange-500/80 to-amber-500/80',
                      chip: 'border-orange-500/30 bg-orange-500/10 text-orange-200',
                      panel: 'border-orange-500/20 bg-orange-500/5',
                      glow: 'from-orange-500/30 via-amber-500/20 to-transparent',
                    }
                : item.provider === 'azure'
                  ? isLight
                    ? {
                        accent: 'from-sky-400/80 to-blue-400/80',
                        chip: 'border-sky-300 bg-sky-50 text-sky-700',
                        panel: 'border-sky-200 bg-sky-50/70',
                        glow: 'from-sky-300/45 via-blue-300/25 to-transparent',
                      }
                    : {
                        accent: 'from-sky-500/80 to-blue-500/80',
                        chip: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
                        panel: 'border-sky-500/20 bg-sky-500/5',
                        glow: 'from-sky-500/30 via-blue-500/20 to-transparent',
                      }
                  : {
                      accent: isLight ? 'from-emerald-400/80 to-green-400/80' : 'from-emerald-500/80 to-green-500/80',
                      chip: isLight
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
                      panel: isLight ? 'border-emerald-200 bg-emerald-50/70' : 'border-emerald-500/20 bg-emerald-500/5',
                      glow: isLight
                        ? 'from-emerald-300/45 via-green-300/25 to-transparent'
                        : 'from-emerald-500/30 via-green-500/20 to-transparent',
                    };
            const encryptionValue = String(item.metadata.encryption ?? '').toLowerCase();
            const encryptionEnabled =
              encryptionValue !== '' && !encryptionValue.includes('disabled') && !encryptionValue.includes('none');
            const isPublic = Boolean(item.metadata.public_access);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={storageCardClass}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${providerTone.accent}`} />
                <div className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${providerTone.glow} blur-3xl`} />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex items-start gap-4">
                    <div className={`rounded-xl border p-2.5 ${providerTone.panel}`}>
                      <ProviderIcon provider={item.provider as any} size="lg" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isProvisioning ? (
                          <Link
                            to={`/deployments/${item.id}`}
                            className={resourceTitleClass}
                          >
                            {item.resource_name}
                          </Link>
                        ) : (
                          <span className={resourceTitleStaticClass}>{item.resource_name}</span>
                        )}
                        <StatusBadge status={item.status as any} size="sm" />
                        {isProvisioning && (
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] ${
                              isLight
                                ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
                                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                            }`}
                          >
                            Provisioning
                          </span>
                        )}
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wide ${providerTone.chip}`}>
                          {item.provider}
                        </span>
                      </div>
                      <div className={resourceIdTextClass}>
                        Resource ID: {item.resource_id || `storage-${item.id}`}
                      </div>
                      <div className={resourceMetaTextClass}>
                        <span className={resourceMetaChipClass}>
                          <MapPin className={resourceMetaIconClass} />
                          {item.region}
                        </span>
                        <span className={resourceMetaChipClass}>
                          <Tag className={resourceMetaIconClass} />
                          {item.metadata.storage_class || 'Standard'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
                            encryptionEnabled
                              ? encryptionOnChipClass
                              : encryptionOffChipClass
                          }`}
                        >
                          {encryptionEnabled ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          {encryptionEnabled ? 'Encrypted' : 'Unencrypted'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
                            isPublic
                              ? publicChipClass
                              : privateChipClass
                          }`}
                        >
                          <Globe2 className="h-3 w-3" />
                          {isPublic ? 'Public Access' : 'Private Access'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isProvisioning && (
                    <Link
                      to={`/deployments/${item.id}`}
                      className={`cursor-pointer inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        isLight
                          ? 'border-cyan-300 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                          : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
                      }`}
                      title="Open deployment logs"
                    >
                      Logs
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className={resourceMetricCardClass}>
                    <p className={resourceMetricLabelClass}>Size</p>
                    <p className={resourceMetricValueClass}>{formatSize(item.metadata.size_gb)}</p>
                  </div>
                  <div className={resourceMetricCardClass}>
                    <p className={resourceMetricLabelClass}>Objects</p>
                    <p className={resourceMetricValueClass}>{item.metadata.object_count?.toLocaleString() || '0'}</p>
                  </div>
                  <div className={resourceMetricCardClass}>
                    <p className={resourceMetricLabelClass}>Access</p>
                    <p className="mt-1 text-sm font-semibold">
                      {isPublic ? (
                        <span className={isLight ? 'text-amber-700' : 'text-yellow-300'}>Public</span>
                      ) : (
                        <span className={isLight ? 'text-emerald-700' : 'text-emerald-300'}>Private</span>
                      )}
                    </p>
                  </div>
                  <div className={resourceMetricCardClass}>
                    <p className={resourceMetricLabelClass}>Source</p>
                    <p className={`${resourceMetricValueClass} capitalize`}>{item.source}</p>
                  </div>
                </div>

                {item.metadata.tags && Object.keys(item.metadata.tags).length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {Object.entries(item.metadata.tags).slice(0, 4).map(([key, value]) => (
                      <span key={key} className={resourceTagsClass}>
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}

                <div className={resourceFooterClass}>
                  <div className="flex items-center gap-2">
                    <Clock3 className={resourceFooterIconClass} />
                    <span>
                      Last synced {lastSeen ? new Date(lastSeen).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <span>Created {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>

                <div className={resourceActionsClass}>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {supportsObjectActions ? (
                    <>
                      <button
                        onClick={() => handleDownload(item)}
                        className={`${neutralActionButtonClass} w-full`}
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handleUploadClick(item)}
                        className={`${neutralActionButtonClass} w-full`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        onClick={() => handleFolderUploadClick(item)}
                        className={`${neutralActionButtonClass} w-full`}
                      >
                        <FolderUp className="w-3 h-3" />
                        <span>Upload Folder</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        disabled
                        className={`${disabledActionButtonClass} w-full`}
                        title="Download is available for provisioned resources or AWS inventory"
                      >
                        <Download className="mr-1 inline-block h-3 w-3" />
                        <span>Download</span>
                      </button>
                      <button
                        disabled
                        className={`${disabledActionButtonClass} w-full`}
                        title="Upload is available for provisioned resources or AWS inventory"
                      >
                        <Upload className="mr-1 inline-block h-3 w-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        disabled
                        className={`${disabledActionButtonClass} w-full`}
                        title="Folder upload is available for provisioned resources or AWS inventory"
                      >
                        <FolderUp className="mr-1 inline-block h-3 w-3" />
                        <span>Upload Folder</span>
                      </button>
                    </>
                  )}
                  {supportsWebsiteHosting ? (
                    <button
                      onClick={() => openWebsiteDialog(item)}
                      className={`${websiteActionButtonClass} w-full`}
                    >
                      <Globe2 className="w-3 h-3" />
                      <span>Host Website</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className={`${disabledActionButtonClass} w-full`}
                      title="Static website hosting is currently available for AWS buckets"
                    >
                      <Globe2 className="mr-1 inline-block h-3 w-3" />
                      <span>Host Website</span>
                    </button>
                  )}
                  {isProvisioning ? (
                    <button
                      onClick={() => setStorageToDelete(item)}
                      disabled={deletingId === item.id}
                      className={`${deleteActionButtonClass} w-full`}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{deletingId === item.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className={`${disabledActionButtonClass} w-full`}
                      title="Managed inventory resources are deleted from provider consoles"
                    >
                      <Trash2 className="mr-1 inline-block h-3 w-3" />
                      <span>Delete</span>
                    </button>
                  )}
                  </div>
                  {!supportsObjectActions && (
                    <p className={actionHintTextClass}>
                      Object actions are available for provisioning records and AWS inventory buckets.
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className={emptyStateClass}>
          <HardDrive className={emptyIconClass} />
          <h3 className={emptyTitleClass}>No storage resources found</h3>
          <p className={emptyDescriptionClass}>Get started by creating your first storage bucket</p>
          <Link
            to="/resources/storage/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Storage</span>
          </Link>
        </div>
      )}

      {/* Summary */}
      {filteredStorage && filteredStorage.length > 0 && (
        <div className="flex items-center justify-between">
          <p className={summaryTextClass}>
            Showing {filteredStorage.length} of {storage?.length || 0} storage resources
          </p>
          <div className={summaryMetaClass}>
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4" />
              <span>
                Total Size: {formatSize(filteredStorage.reduce((sum, item) => sum + (item.metadata.size_gb || 0), 0))}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>
                Total Objects: {filteredStorage.reduce((sum, item) => sum + (item.metadata.object_count || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {downloadDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeDownloadDialog}
        >
          <div
            className="w-full max-w-2xl bg-[#0f0f11] border border-gray-800/70 rounded-xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-800/60">
              <h3 className="text-lg font-semibold text-white">Download Object</h3>
              <p className="text-sm text-gray-400 mt-1">
                Bucket: <span className="text-gray-200">{downloadDialog.resource.resource_name}</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">
                Select an object key below or type your own key.
              </p>

              <div className="max-h-56 overflow-y-auto border border-gray-800/60 rounded-lg divide-y divide-gray-800/50">
                {downloadDialog.objects.map((object) => (
                  <button
                    key={object.key}
                    onClick={() => setDownloadKeyInput(object.key)}
                    className={`cursor-pointer w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                      downloadKeyInput === object.key
                        ? 'bg-purple-500/20 text-purple-200'
                        : 'hover:bg-gray-800/40 text-gray-300'
                    }`}
                  >
                    <span className="truncate text-left">{object.key}</span>
                    <span className="ml-4 text-xs text-gray-500 shrink-0">{formatObjectSize(object.size || 0)}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Object Key</label>
                <input
                  type="text"
                  value={downloadKeyInput}
                  onChange={(event) => setDownloadKeyInput(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Enter object key"
                />
              </div>

              {downloadDialogError && (
                <p className="text-sm text-red-400">{downloadDialogError}</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-800/60 flex items-center justify-end space-x-3">
              <button
                onClick={closeDownloadDialog}
                disabled={isDownloadSubmitting}
                className="cursor-pointer px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                disabled={isDownloadSubmitting}
                className="cursor-pointer px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloadSubmitting ? 'Downloading...' : 'Download Object'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TextInputDialog
        open={pendingUploadFile !== null && uploadTarget !== null}
        title="Upload Object"
        description={uploadTarget ? `Bucket: ${uploadTarget.resource_name}` : undefined}
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
        open={pendingFolderFiles.length > 0 && folderUploadTarget !== null}
        title="Upload Folder"
        description={
          folderUploadTarget
            ? `Bucket: ${folderUploadTarget.resource_name} • ${pendingFolderFiles.length} files selected`
            : undefined
        }
        label="Optional Prefix"
        placeholder="example: site-assets/"
        value={folderPrefixInput}
        error={folderUploadError}
        confirmLabel="Upload Folder"
        cancelLabel="Cancel"
        isLoading={isFolderUploading}
        onChange={setFolderPrefixInput}
        onCancel={cancelFolderUploadDialog}
        onConfirm={submitFolderUpload}
      />

      {websiteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={cancelWebsiteDialog}
        >
          <div
            className="w-full max-w-xl bg-[#0f0f11] border border-gray-800/70 rounded-xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-800/60">
              <h3 className="text-lg font-semibold text-white">Enable Static Website Hosting</h3>
              <p className="text-sm text-gray-400 mt-1">
                Bucket: <span className="text-gray-200">{websiteTarget.resource_name}</span>
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Index Document</label>
                <input
                  type="text"
                  value={websiteIndexDocument}
                  onChange={(event) => setWebsiteIndexDocument(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="index.html"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Error Document</label>
                <input
                  type="text"
                  value={websiteErrorDocument}
                  onChange={(event) => setWebsiteErrorDocument(event.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="error.html"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={websitePublicRead}
                  onChange={(event) => setWebsitePublicRead(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500/50"
                />
                Enable public read for website objects
              </label>

              {websiteDialogError && <p className="text-sm text-red-400">{websiteDialogError}</p>}
            </div>

            <div className="px-6 py-4 border-t border-gray-800/60 flex items-center justify-end space-x-3">
              <button
                onClick={cancelWebsiteDialog}
                disabled={isWebsiteSubmitting}
                className="cursor-pointer px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={enableWebsiteHosting}
                disabled={isWebsiteSubmitting}
                className="cursor-pointer px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isWebsiteSubmitting ? 'Enabling...' : 'Enable Hosting'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={storageToDelete !== null}
        title="Delete Storage Resource Record"
        message={
          storageToDelete
            ? `Delete failed/provisioned record "${storageToDelete.resource_name}"? This removes it from deployment/resource history.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={
          storageToDelete !== null &&
          deletingId === storageToDelete.id &&
          deleteMutation.isPending
        }
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setStorageToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!storageToDelete) return;
          deleteMutation.mutate(storageToDelete.id, {
            onSettled: () => setStorageToDelete(null),
          });
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
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

export default StoragePage;
