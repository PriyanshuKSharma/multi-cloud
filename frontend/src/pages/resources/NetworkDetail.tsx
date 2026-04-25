import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDisplayValue } from '../../utils/displayValue';
import {
  Network,
  ArrowLeft,
  Tag,
  Wifi,
  Server,
  Terminal,
  GitBranch,
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  X,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface NetworkResource {
  id: number;
  resource_id: string;
  resource_name: string;
  provider: string;
  region: string;
  status: string;
  source: 'inventory' | 'provisioning';
  metadata: {
    cidr_block?: string;
    subnet_count?: number;
    vpc_id?: string;
    internet_gateway?: boolean;
    nat_gateway?: boolean;
    dns_enabled?: boolean;
    tags?: any;
  };
  created_at: string;
  last_synced: string;
}

interface DeploymentDetail {
  id: number;
  resource_name: string;
  provider: string;
  resource_type: string;
  status: string;
  started_at: string;
  logs: string;
  configuration: Record<string, unknown>;
  terraform_output: Record<string, unknown>;
}

/** Derive all network data from both inventory + resources endpoints */
const useNetworkDetail = (id: string | undefined) => {
  return useQuery<NetworkResource | null>({
    queryKey: ['network-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const numId = Number(id);

      // Try provisioned resources first
      try {
        const res = await axios.get(`/resources/${numId}`);
        const item = res.data;
        const config = item.configuration ?? {};
        const regionValue = config.region ?? config.location;
        return {
          id: item.id,
          resource_id: String(item.id),
          resource_name: formatDisplayValue(item.name || 'Unnamed Network', 'Unnamed Network'),
          provider: formatDisplayValue(item.provider ?? '', '').toLowerCase(),
          region: formatDisplayValue(regionValue ?? 'unknown', 'unknown'),
          status: formatDisplayValue(item.status || 'pending', 'pending'),
          source: 'provisioning' as const,
          metadata: {
            cidr_block: formatDisplayValue(
              typeof config.cidr === 'string' ? config.cidr : typeof config.cidr_block === 'string' ? config.cidr_block : undefined,
              ''
            ),
            nat_gateway: typeof config.nat_gateway === 'boolean' ? config.nat_gateway : undefined,
            dns_enabled: typeof config.dns_enabled === 'boolean' ? config.dns_enabled : undefined,
            tags: config.tags,
          },
          created_at: item.created_at ?? '',
          last_synced: item.created_at ?? '',
        } as NetworkResource;
      } catch {
        // fallback to inventory
        const res = await axios.get(`/inventory/networks`);
        const payload = res.data;
        const list = Array.isArray(payload) ? payload : (payload?.items ?? []);
        const raw = list.find((n: any) => String(n.id) === id);
        if (!raw) return null;
        const metadata = raw.metadata ?? {};
        return {
          id: raw.id,
          resource_id: formatDisplayValue(raw.resource_id ?? '', ''),
          resource_name: formatDisplayValue(raw.resource_name ?? raw.name ?? 'Unnamed Network', 'Unnamed Network'),
          provider: formatDisplayValue(raw.provider ?? '', '').toLowerCase(),
          region: formatDisplayValue(raw.region ?? 'unknown', 'unknown'),
          status: formatDisplayValue(raw.status ?? 'unknown', 'unknown'),
          source: 'inventory' as const,
          metadata: {
            cidr_block: formatDisplayValue(metadata.cidr_block ?? raw.cidr_block, ''),
            subnet_count: metadata.subnet_count ?? raw.subnet_count,
            vpc_id: formatDisplayValue(metadata.vpc_id ?? raw.vpc_id, ''),
            internet_gateway: metadata.internet_gateway ?? raw.internet_gateway,
            nat_gateway: metadata.nat_gateway ?? raw.nat_gateway,
            dns_enabled: metadata.dns_enabled ?? raw.dns_enabled,
            tags: metadata.tags ?? raw.tags,
          },
          created_at: raw.created_at ?? '',
          last_synced: raw.last_synced ?? raw.last_synced_at ?? '',
        } as NetworkResource;
      }
    },
    refetchInterval: 15000,
  });
};

const useDeploymentLogs = (id: number | undefined, isProvisioned: boolean) =>
  useQuery<DeploymentDetail>({
    queryKey: ['deployments', 'detail', id, 'network-page'],
    enabled: isProvisioned && !!id,
    queryFn: async () => {
      const res = await axios.get(`/deployments/${id}`);
      return res.data as DeploymentDetail;
    },
    refetchInterval: 8000,
  });

const extractLogs = (data: DeploymentDetail | undefined): string => {
  if (!data) return '';
  const output = data.terraform_output;
  if (typeof output?.logs === 'string') return output.logs;
  if (Array.isArray(output?.logs)) return (output.logs as string[]).join('\n');
  if (typeof data.logs === 'string') return data.logs;
  return '';
};

/** Build a .tf template string from the network config */
const buildTerraformTemplate = (network: NetworkResource): string => {
  const provider = network.provider;
  const cidr = network.metadata.cidr_block || '10.0.0.0/16';
  const name = network.resource_name;
  const region = network.region || 'us-east-1';
  const enableDns = network.metadata.dns_enabled !== false;
  const natGw = network.metadata.nat_gateway === true;

  if (provider === 'aws' || !provider) {
    return `# Terraform template for AWS VPC: ${name}
# Generated by Nebula Cloud Console

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${region}"
}

resource "aws_vpc" "main" {
  cidr_block           = "${cidr}"
  enable_dns_support   = ${enableDns}
  enable_dns_hostnames = ${enableDns}

  tags = {
    Name      = "${name}"
    ManagedBy = "Nebula"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${name}-igw"
  }
}
${natGw ? `
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  # subnet_id   = aws_subnet.public.id  # Replace with public subnet ID
  tags = {
    Name = "${name}-nat"
  }
}
` : ''}
output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}
`;
  }

  if (provider === 'azure') {
    return `# Terraform template for Azure VNet: ${name}
# Generated by Nebula Cloud Console

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "${name}-rg"
  location = "${region}"
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${name}"
  address_space       = ["${cidr}"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  tags = {
    ManagedBy = "Nebula"
  }
}

output "vnet_id" {
  value = azurerm_virtual_network.vnet.id
}
`;
  }

  return `# Terraform template for GCP VPC: ${name}
# Generated by Nebula Cloud Console

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  region = "${region}"
}

resource "google_compute_network" "network" {
  name                    = "${name}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${name}-subnet"
  ip_cidr_range = "${cidr}"
  region        = "${region}"
  network       = google_compute_network.network.id
}

output "network_id" {
  value = google_compute_network.network.id
}
`;
};

const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const BoolChip: React.FC<{ value: boolean | undefined | null; label: string }> = ({ value, label }) => (
  <div className="bg-[#0c0d10] rounded-lg border border-gray-800/50 p-4 flex items-center justify-between">
    <span className="text-sm text-gray-400">{label}</span>
    {value === true ? (
      <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-medium">
        <CheckCircle2 className="w-4 h-4" /> Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-medium">
        <X className="w-4 h-4" /> No
      </span>
    )}
  </div>
);

const NetworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const { data: network, isLoading, error, refetch } = useNetworkDetail(id);
  const { data: deployment, isLoading: logsLoading } = useDeploymentLogs(
    network?.id,
    network?.source === 'provisioning'
  );

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/resources/${network!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'networks'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      navigate('/resources/networks');
    },
  });

  const rawLogs = extractLogs(deployment);

  const tagsArray: { key: string; value: string }[] = Array.isArray(network?.metadata.tags)
    ? (network!.metadata.tags as any[])
    : typeof network?.metadata.tags === 'object' && network?.metadata.tags !== null
      ? Object.entries(network!.metadata.tags).map(([key, value]) => ({ key, value: String(value) }))
      : [];

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-48 bg-gray-800/60 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !network) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <p className="text-red-400 text-lg font-medium mb-2">Network not found</p>
          <p className="text-gray-500 text-sm mb-6">This network may have been deleted or the ID is incorrect.</p>
          <Link
            to="/resources/networks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Networks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-3">
        <Link
          to="/resources/networks"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Networks
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-300 text-sm font-medium">{network.resource_name}</span>
      </div>

      {/* Header */}
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Network className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{network.resource_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={network.status as any} size="sm" />
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                network.source === 'provisioning'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                  : 'bg-gray-500/15 text-gray-300 border border-gray-500/20'
              }`}>
                {network.source === 'provisioning' ? 'Provisioned via Console' : 'Synced from Cloud'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer border border-gray-700/50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              const tf = buildTerraformTemplate(network);
              downloadFile(tf, `${network.resource_name}.tf`);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-sm transition-colors cursor-pointer border border-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            Download .tf Template
          </button>
          {network.source === 'provisioning' && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors cursor-pointer border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Identity + Networking */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity */}
          <section className="bg-[#0f0f11] rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <Server className="w-3.5 h-3.5" /> Identity
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-gray-500 mb-1">Provider</p>
                <ProviderIcon provider={network.provider as any} size="sm" showLabel />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Region</p>
                <p className="text-gray-200 font-mono text-sm">{network.region || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Resource ID</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-gray-300 font-mono text-xs truncate max-w-[120px]">
                    {network.resource_id || String(network.id)}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(network.resource_id || String(network.id));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                    title="Copy"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-gray-300 text-xs">{network.created_at ? new Date(network.created_at).toLocaleString() : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Synced</p>
                <p className="text-gray-300 text-xs">{network.last_synced ? new Date(network.last_synced).toLocaleString() : '—'}</p>
              </div>
            </div>
          </section>

          {/* Network Config */}
          <section className="bg-[#0f0f11] rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5" /> Network Configuration
            </h2>

            {/* CIDR Block */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-1.5">VPC / CIDR Block</p>
              <span className="font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-md px-3 py-1.5 text-sm">
                {formatDisplayValue(network.metadata.cidr_block, 'Not specified')}
              </span>
            </div>

            {network.metadata.vpc_id && (
              <div className="mb-5">
                <p className="text-xs text-gray-500 mb-1.5">VPC ID</p>
                <p className="font-mono text-gray-300 text-sm">{formatDisplayValue(network.metadata.vpc_id, 'N/A')}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <BoolChip label="Internet Gateway" value={network.metadata.internet_gateway as boolean | undefined} />
              <BoolChip label="NAT Gateway" value={network.metadata.nat_gateway as boolean | undefined} />
              <BoolChip label="DNS Support" value={network.metadata.dns_enabled} />
              <div className="bg-[#0c0d10] rounded-lg border border-gray-800/50 p-4 flex items-center justify-between">
                <span className="text-sm text-gray-400">Subnets</span>
                <span className="text-white font-semibold text-lg">{network.metadata.subnet_count ?? 0}</span>
              </div>
            </div>
          </section>

          {/* Deployment Logs */}
          <section className="bg-[#0f0f11] rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" /> Deployment Logs
            </h2>
            {network.source === 'inventory' ? (
              <div className="text-center py-10">
                <GitBranch className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">This network was synced from your cloud account.</p>
                <p className="text-gray-600 text-xs mt-1">Terraform logs are only available for networks provisioned through this console.</p>
              </div>
            ) : logsLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading deployment logs...</span>
              </div>
            ) : rawLogs ? (
              <pre className="text-xs text-green-300 font-mono bg-[#050608] rounded-lg p-4 border border-gray-800/50 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap break-all shadow-inner leading-relaxed">
                {rawLogs}
              </pre>
            ) : (
              <div className="text-center py-10">
                <Database className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No deployment logs available yet.</p>
                <p className="text-gray-600 text-xs mt-1">Logs appear here once provisioning completes.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right column — Tags + Terraform Download */}
        <div className="space-y-6">
          {/* Tags */}
          <section className="bg-[#0f0f11] rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" /> Tags
            </h2>
            {tagsArray.length > 0 ? (
              <div className="space-y-2">
                {tagsArray.map((tag, idx) => (
                  <div key={idx} className="flex items-stretch rounded-lg overflow-hidden border border-gray-700/50 text-xs">
                    <span className="bg-gray-800/80 text-gray-400 px-3 py-2 font-mono border-r border-gray-700/50 min-w-[80px]">
                      {tag.key}
                    </span>
                    <span className="bg-gray-900/80 text-cyan-300 px-3 py-2 font-mono flex-1 break-all">
                      {formatDisplayValue(tag.value, '')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm">No tags assigned</p>
            )}
          </section>

          {/* Terraform Template Download */}
          <section className="bg-[#0f0f11] rounded-xl border border-gray-800/50 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-5 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Terraform Template
            </h2>
            <p className="text-gray-500 text-xs mb-4">
              Download a ready-to-use Terraform <code className="text-cyan-300">.tf</code> file generated from this network's configuration.
            </p>
            <button
              onClick={() => {
                const tf = buildTerraformTemplate(network);
                downloadFile(tf, `${network.resource_name}.tf`);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-emerald-500/20"
            >
              <Download className="w-4 h-4" />
              Download {network.resource_name}.tf
            </button>
            <p className="text-gray-600 text-[11px] mt-3 text-center">
              Compatible with Terraform CLI, Atlantis, and Spacelift
            </p>
          </section>

          {/* Quick Links */}
          {network.source === 'provisioning' && (
            <section className="bg-[#0f0f11] rounded-xl border border-gray-800/50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
                Quick Links
              </h2>
              <div className="space-y-2">
                <Link
                  to={`/deployments/${network.id}`}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-800/40 hover:bg-gray-800/70 rounded-lg text-sm text-gray-300 transition-colors group"
                >
                  <span>View in Deployments</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                </Link>
                <Link
                  to="/console"
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-800/40 hover:bg-gray-800/70 rounded-lg text-sm text-gray-300 transition-colors group"
                >
                  <span>Open Cloud Console</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Network"
        message={`Are you sure you want to delete "${network.resource_name}"? This action cannot be undone.`}
        confirmLabel="Delete Network"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default NetworkDetailPage;
