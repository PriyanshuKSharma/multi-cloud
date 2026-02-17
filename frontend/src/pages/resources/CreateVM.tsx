import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import { extractProvisioningErrorMessage } from '../../utils/terraformOutput';
import {
  ArrowLeft,
  Server,
  Cloud,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface VMConfig {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  type: 'vm';
  project_id: number;
  configuration: {
    instance_type: string;
    ami?: string;
    instance_name?: string;
    region: string;
    vpc_id?: string;
    subnet_id?: string;
    key_name?: string;
    security_groups?: string[];
  };
}

interface InstanceTypeOption {
  value: string;
  label: string;
  specs: string;
  cost: string;
  freeTier?: boolean;
}

interface CreateVMResponse {
  id: number;
  status: string;
  terraform_output?: {
    error?: string;
    detail?: string;
    [key: string]: unknown;
  } | null;
}

const CreateVMPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [awsFreeTierOnly, setAwsFreeTierOnly] = React.useState(true);

  const [formData, setFormData] = React.useState<VMConfig>({
    name: '',
    provider: 'aws',
    type: 'vm',
    project_id: 0,
    configuration: {
      instance_type: 't3.micro',
      region: 'us-east-1',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VMConfig) => {
      const payload: VMConfig = {
        ...data,
        configuration: {
          ...data.configuration,
          instance_name: data.name,
          ami: data.configuration.ami?.trim() || undefined,
        },
      };

      const response = await axios.post('/resources/', payload);
      return response.data as CreateVMResponse;
    },
    onSuccess: (resource) => {
      if (resource?.status === 'failed') {
        setSubmitError(
          extractProvisioningErrorMessage(
            resource.terraform_output,
            'VM request was accepted but provisioning could not be queued.'
          )
        );
        return;
      }
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      navigate('/deployments');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      if (detail !== undefined) {
        setSubmitError(
          extractProvisioningErrorMessage(detail, 'Failed to create VM resource. Please try again.')
        );
        return;
      }
      setSubmitError('Failed to create VM resource. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    createMutation.mutate(formData);
  };

  const providerOptions = [
    { value: 'aws', label: 'AWS', description: 'Amazon Web Services' },
    { value: 'azure', label: 'Azure', description: 'Microsoft Azure' },
    { value: 'gcp', label: 'GCP', description: 'Google Cloud Platform' },
  ];

  const instanceTypes: Record<'aws' | 'azure' | 'gcp', InstanceTypeOption[]> = {
    aws: [
      { value: 't2.micro', label: 't2.micro', specs: '1 vCPU • 1 GB RAM', cost: '$0.0116/hour', freeTier: true },
      { value: 't3.micro', label: 't3.micro', specs: '2 vCPU • 1 GB RAM', cost: '$0.0104/hour', freeTier: true },
      { value: 't3.small', label: 't3.small', specs: '2 vCPU • 2 GB RAM', cost: '$0.0208/hour' },
      { value: 't3.medium', label: 't3.medium', specs: '2 vCPU • 4 GB RAM', cost: '$0.0416/hour' },
      { value: 't3.large', label: 't3.large', specs: '2 vCPU • 8 GB RAM', cost: '$0.0832/hour' },
      { value: 'm5.large', label: 'm5.large', specs: '2 vCPU • 8 GB RAM', cost: '$0.096/hour' },
      { value: 'm5.xlarge', label: 'm5.xlarge', specs: '4 vCPU • 16 GB RAM', cost: '$0.192/hour' },
    ],
    azure: [
      { value: 'Standard_B1s', label: 'Standard_B1s', specs: '1 vCPU • 1 GB RAM', cost: '$0.0104/hour' },
      { value: 'Standard_B2s', label: 'Standard_B2s', specs: '2 vCPU • 4 GB RAM', cost: '$0.0416/hour' },
      { value: 'Standard_D2s_v3', label: 'Standard_D2s_v3', specs: '2 vCPU • 8 GB RAM', cost: '$0.096/hour' },
    ],
    gcp: [
      { value: 'e2-micro', label: 'e2-micro', specs: '2 vCPU • 1 GB RAM', cost: '$0.0084/hour' },
      { value: 'e2-small', label: 'e2-small', specs: '2 vCPU • 2 GB RAM', cost: '$0.0168/hour' },
      { value: 'e2-medium', label: 'e2-medium', specs: '2 vCPU • 4 GB RAM', cost: '$0.0336/hour' },
    ],
  };

  const regions = {
    aws: ['us-east-1', 'us-west-2', 'ap-south-1', 'eu-west-1', 'ap-southeast-1'],
    azure: ['eastus', 'westus', 'westeurope', 'southeastasia'],
    gcp: ['us-central1', 'us-west1', 'europe-west1', 'asia-southeast1'],
  };

  const availableInstanceTypes = React.useMemo(() => {
    if (formData.provider === 'aws' && awsFreeTierOnly) {
      const freeTierTypes = instanceTypes.aws.filter((type) => type.freeTier);
      return freeTierTypes.length > 0 ? freeTierTypes : instanceTypes.aws;
    }
    return instanceTypes[formData.provider];
  }, [formData.provider, awsFreeTierOnly]);

  React.useEffect(() => {
    const hasSelectedType = availableInstanceTypes.some(
      (type) => type.value === formData.configuration.instance_type
    );
    if (!hasSelectedType && availableInstanceTypes.length > 0) {
      setFormData((previous) => ({
        ...previous,
        configuration: {
          ...previous.configuration,
          instance_type: availableInstanceTypes[0].value,
        },
      }));
    }
  }, [availableInstanceTypes, formData.configuration.instance_type]);

  const selectedInstanceType = availableInstanceTypes.find(
    (t) => t.value === formData.configuration.instance_type
  );

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="create-vm"
        tone="blue"
        eyebrow="Provision compute"
        eyebrowIcon={<Cloud className="h-3.5 w-3.5" />}
        title="Create Virtual Machine"
        titleIcon={<Server className="w-8 h-8 text-blue-400" />}
        description="Deploy a new VM using Terraform-backed orchestration and live job tracking."
        chips={[
          { label: `provider: ${formData.provider.toUpperCase()}`, tone: 'blue' },
          { label: `region: ${formData.configuration.region}`, tone: 'cyan' },
        ]}
        actions={
          <Link
            to="/resources/vms"
            className="cursor-pointer flex items-center space-x-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VMs</span>
          </Link>
        }
      />

      <PageGuide
        title="About Create VM"
        purpose="Use this form to define provider-specific VM configuration and launch compute through the provisioning engine."
        actions={[
          'select provider, region, and instance type',
          'configure networking and machine access settings',
          'submit to create a managed VM resource',
        ]}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-8 space-y-8">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-4">
              Cloud Provider <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {providerOptions.map((provider) => (
                <button
                  key={provider.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      provider: provider.value as any,
                      configuration: {
                        ...formData.configuration,
                        instance_type:
                          provider.value === 'aws' && awsFreeTierOnly
                            ? (instanceTypes.aws.find((type) => type.freeTier)?.value ?? instanceTypes.aws[0].value)
                            : instanceTypes[provider.value as keyof typeof instanceTypes][0].value,
                        region: regions[provider.value as keyof typeof regions][0],
                      },
                    })
                  }
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    formData.provider === provider.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-800/50 bg-gray-800/30 hover:border-gray-700/50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <ProviderIcon provider={provider.value as any} size="lg" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{provider.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{provider.description}</p>
                    </div>
                    {formData.provider === provider.value && (
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Instance Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Instance Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., web-server-01"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Region <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.configuration.region}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, region: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {regions[formData.provider].map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Instance Type */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Instance Type <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.configuration.instance_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  configuration: { ...formData.configuration, instance_type: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {availableInstanceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.specs} - {type.cost}
                </option>
              ))}
            </select>
            {formData.provider === 'aws' && (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-yellow-300">Free Tier Safe Mode</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Restrict instance types to Free Tier eligible options.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={awsFreeTierOnly}
                    onChange={(event) => setAwsFreeTierOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50"
                  />
                </label>
              </div>
            )}
            {selectedInstanceType && (
              <div className="mt-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-gray-400">Specifications</p>
                    <p className="text-white font-medium mt-1">{selectedInstanceType.specs}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">Estimated Cost</p>
                    <p className="text-blue-400 font-semibold mt-1">{selectedInstanceType.cost}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AWS-specific fields */}
          {formData.provider === 'aws' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  VPC ID <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.configuration.vpc_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, vpc_id: e.target.value },
                    })
                  }
                  placeholder="vpc-abc123"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Subnet ID <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.configuration.subnet_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, subnet_id: e.target.value },
                    })
                  }
                  placeholder="subnet-xyz789"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to auto-use/create default VPC + default subnet.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Security Group IDs <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={(formData.configuration.security_groups || []).join(',')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: {
                        ...formData.configuration,
                        security_groups: e.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                  placeholder="sg-0123456789abcdef0,sg-0abcdef1234567890"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Comma-separated list. Use this when your organization blocks default security groups.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  SSH Key Pair <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.configuration.key_name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, key_name: e.target.value },
                    })
                  }
                  placeholder="my-key-pair"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  AMI ID <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.configuration.ami || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      configuration: { ...formData.configuration, ami: e.target.value },
                    })
                  }
                  placeholder="ami-xxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank to use a region-based default AMI.
                </p>
              </div>
            </>
          )}

          {/* Error Message */}
          {(createMutation.isError || submitError) && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400">Failed to create VM</p>
                <p className="text-xs text-gray-400 mt-1">
                  {submitError || 'An error occurred'}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-4 pt-4 border-t border-gray-800/50">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating VM...' : 'Create Virtual Machine'}
            </button>
            <Link
              to="/resources/vms"
              className="px-6 py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {/* Info Box */}
      <div className="max-w-4xl p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start space-x-3">
          <Cloud className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-400 mb-1">Terraform Provisioning</p>
            <p className="text-xs text-gray-400">
              This VM will be provisioned using Terraform. You can monitor the deployment progress in the
              Deployments page. The process typically takes 2-5 minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVMPage;
