import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import PageGuide from '../components/ui/PageGuide';
import {
  FileCode,
  Plus,
  RefreshCw,
  Copy,
  Play,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Blueprint {
  id: number;
  name: string;
  description: string;
  provider: string;
  resource_type: string;
  uses_count: number;
  created_at: string;
}

type TemplateMode = 'generic' | 'cloudformation';
const BLUEPRINT_EDITOR_DRAFT_KEY = 'blueprint_editor_draft_v1';
const INDENT = '  ';

const BlueprintsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [jsonMessage, setJsonMessage] = React.useState<string | null>(null);
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const [isDraggingJson, setIsDraggingJson] = React.useState(false);
  const [editorMinimized, setEditorMinimized] = React.useState(false);
  const [editorExpanded, setEditorExpanded] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [templateMode, setTemplateMode] = React.useState<TemplateMode>('generic');
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    provider: 'aws',
    resource_type: 'vm',
    template: '{}',
  });

  const { data: blueprints, isLoading, refetch } = useQuery<Blueprint[]>({
    queryKey: ['blueprints'],
    queryFn: async () => {
      const response = await axios.get('/blueprints');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
  });

  const createBlueprint = useMutation({
    mutationFn: async () => {
      let parsedTemplate = {};
      try {
        parsedTemplate = parseJsonTemplate(form.template);
      } catch {
        throw new Error('Template JSON is invalid.');
      }
      const response = await axios.post('/blueprints', {
        name: form.name,
        description: form.description,
        provider: form.provider,
        resource_type: form.resource_type,
        template: {
          ...parsedTemplate,
          _template_mode: templateMode,
        },
      });
      return response.data as Blueprint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprints'] });
      setShowCreate(false);
      setCreateError(null);
      setForm({
        name: '',
        description: '',
        provider: 'aws',
        resource_type: 'vm',
        template: '{}',
      });
      setTemplateMode('generic');
    },
    onError: (error: any) => {
      setCreateError(error?.response?.data?.detail || error?.message || 'Failed to create blueprint');
    },
  });

  const useBlueprint = useMutation({
    mutationFn: async (id: number) => axios.post(`/blueprints/${id}/use`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blueprints'] }),
  });

  const deleteBlueprint = useMutation({
    mutationFn: async (id: number) => axios.delete(`/blueprints/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blueprints'] }),
  });

  const cloneBlueprint = (bp: Blueprint) => {
    setShowCreate(true);
    setCreateError(null);
    setJsonError(null);
    setJsonMessage(null);
    setForm({
      name: `${bp.name} Copy`,
      description: bp.description,
      provider: bp.provider.toLowerCase(),
      resource_type: bp.resource_type.toLowerCase(),
      template: '{}',
    });
  };

  const parseJsonTemplate = (input: string) => {
    const parsed = JSON.parse(input || '{}');
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('Template JSON must be an object.');
    }
    if (templateMode === 'cloudformation') {
      const resources = (parsed as Record<string, unknown>).Resources;
      if (!resources || typeof resources !== 'object' || Array.isArray(resources)) {
        throw new Error('CloudFormation template must include a valid "Resources" object.');
      }
      if (Object.keys(resources as Record<string, unknown>).length === 0) {
        throw new Error('CloudFormation "Resources" cannot be empty.');
      }
    }
    return parsed;
  };

  const validateTemplateJson = () => {
    try {
      parseJsonTemplate(form.template);
      setJsonError(null);
      setJsonMessage('JSON is valid.');
    } catch (error: any) {
      setJsonMessage(null);
      setJsonError(error?.message || 'Template JSON is invalid.');
    }
  };

  const formatTemplateJson = () => {
    try {
      const parsed = parseJsonTemplate(form.template);
      setForm((prev) => ({ ...prev, template: JSON.stringify(parsed, null, 2) }));
      setJsonError(null);
      setJsonMessage('JSON formatted successfully.');
    } catch (error: any) {
      setJsonMessage(null);
      setJsonError(error?.message || 'Cannot format invalid JSON.');
    }
  };

  const handleTemplateFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      try {
        const parsed = parseJsonTemplate(text);
        setForm((prev) => ({ ...prev, template: JSON.stringify(parsed, null, 2) }));
        setJsonError(null);
        setJsonMessage(`Loaded ${file.name}`);
      } catch (error: any) {
        setJsonMessage(null);
        setJsonError(error?.message || 'Uploaded file contains invalid JSON.');
      }
    };
    reader.onerror = () => {
      setJsonMessage(null);
      setJsonError('Failed to read dropped file.');
    };
    reader.readAsText(file);
  };

  const saveEditorDraft = () => {
    try {
      parseJsonTemplate(form.template);
      localStorage.setItem(
        BLUEPRINT_EDITOR_DRAFT_KEY,
        JSON.stringify({
          ...form,
          templateMode,
          saved_at: new Date().toISOString(),
        })
      );
      setJsonError(null);
      setJsonMessage('Draft saved in terminal editor (Ctrl+S).');
    } catch (error: any) {
      setJsonMessage(null);
      setJsonError(error?.message || 'Cannot save draft: invalid JSON.');
    }
  };

  React.useEffect(() => {
    if (!showCreate) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
      if (!isSave) return;
      event.preventDefault();
      saveEditorDraft();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCreate, form, templateMode]);

  const clearEditor = () => {
    setForm((prev) => ({ ...prev, template: '{\n  "current_schema_version": "0.0.1"\n}' }));
    setJsonError(null);
    setJsonMessage('Editor content cleared and reset.');
    setEditorMinimized(false);
    setEditorExpanded(false);
  };

  const applyEditorEdit = (nextTemplate: string, cursorStart: number, cursorEnd: number = cursorStart) => {
    setForm((prev) => ({ ...prev, template: nextTemplate }));
    setJsonError(null);
    setJsonMessage(null);
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      editor.selectionStart = cursorStart;
      editor.selectionEnd = cursorEnd;
    });
  };

  const insertSnippet = (snippet: string) => {
    const editor = editorRef.current;
    const current = form.template;
    if (!editor) {
      setForm((prev) => ({ ...prev, template: snippet }));
      return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasOnlyDefault = current.trim() === '{}' || current.trim() === '{\n  "current_schema_version": "0.0.1"\n}';

    if (hasOnlyDefault) {
      applyEditorEdit(snippet, snippet.length);
      return;
    }

    const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
    applyEditorEdit(next, start + snippet.length);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
    if (isSave) {
      e.preventDefault();
      e.stopPropagation();
      saveEditorDraft();
      return;
    }

    const editor = e.currentTarget;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = editor.value;
    const before = value.slice(0, start);
    const after = value.slice(end);

    if (e.key === 'Tab') {
      e.preventDefault();
      applyEditorEdit(`${before}${INDENT}${after}`, start + INDENT.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLine = before.split('\n').pop() ?? '';
      const currentIndent = (currentLine.match(/^\s*/) ?? [''])[0];
      const prevChar = before.trimEnd().slice(-1);
      const nextChar = after.trimStart().charAt(0);
      const addLevel = prevChar === '{' || prevChar === '[';
      const nextIndent = addLevel ? `${currentIndent}${INDENT}` : currentIndent;

      if (addLevel && (nextChar === '}' || nextChar === ']')) {
        const insertion = `\n${nextIndent}\n${currentIndent}`;
        const cursorPos = start + 1 + nextIndent.length;
        applyEditorEdit(`${before}${insertion}${after}`, cursorPos);
        return;
      }

      const insertion = `\n${nextIndent}`;
      applyEditorEdit(`${before}${insertion}${after}`, start + insertion.length);
      return;
    }

    const openClosePairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '"': '"',
    };

    if (openClosePairs[e.key]) {
      e.preventDefault();
      const close = openClosePairs[e.key];
      const selected = value.slice(start, end);
      const wrapped = `${e.key}${selected}${close}`;
      const cursorPos = selected.length > 0 ? start + wrapped.length : start + 1;
      const selectionEnd = selected.length > 0 ? cursorPos : cursorPos;
      applyEditorEdit(`${before}${wrapped}${after}`, cursorPos, selectionEnd);
      return;
    }

    if ((e.key === '}' || e.key === ']' || e.key === '"') && after.startsWith(e.key)) {
      e.preventDefault();
      applyEditorEdit(value, start + 1, start + 1);
      return;
    }

    if (e.key === ':') {
      e.preventDefault();
      applyEditorEdit(`${before}: ${after}`, start + 2);
    }
  };

  const editorSnippets = React.useMemo(() => {
    if (templateMode === 'cloudformation') {
      return [
        {
          label: 'Stack Skeleton',
          content:
            '{\n  "AWSTemplateFormatVersion": "2010-09-09",\n  "Description": "CloudFormation stack",\n  "Resources": {}\n}',
        },
        {
          label: 'S3 Bucket Resource',
          content:
            '"MyBucket": {\n  "Type": "AWS::S3::Bucket",\n  "Properties": {\n    "BucketName": "my-demo-bucket"\n  }\n}',
        },
        {
          label: 'EC2 Instance Resource',
          content:
            '"MyInstance": {\n  "Type": "AWS::EC2::Instance",\n  "Properties": {\n    "InstanceType": "t3.micro",\n    "ImageId": "ami-xxxxxxxx"\n  }\n}',
        },
      ];
    }
    return [
      {
        label: 'VM Skeleton',
        content:
          '{\n  "region": "us-east-1",\n  "instance_type": "t3.micro",\n  "image": "ubuntu-22.04"\n}',
      },
      {
        label: 'Storage Skeleton',
        content:
          '{\n  "region": "us-east-1",\n  "bucket_name": "my-bucket",\n  "versioning": true\n}',
      },
      {
        label: 'Tags Block',
        content: '"tags": {\n  "environment": "dev",\n  "owner": "platform-team"\n}',
      },
    ];
  }, [templateMode]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FileCode className="w-8 h-8 text-pink-500" />
            <span>Blueprints</span>
          </h1>
          <p className="text-gray-400 mt-1">Reusable infrastructure templates and configurations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Blueprint</span>
          </button>
        </div>
      </div>

      <PageGuide
        title="About Blueprints"
        purpose="Blueprints are reusable templates for common infrastructure setups."
        actions={[
          'create standardized templates for VM, storage, and network stacks',
          'clone existing templates for quick variations',
          'track usage counts when teams deploy from a blueprint',
          'delete outdated templates to keep the catalog clean',
        ]}
      />

      {showCreate && (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Create Blueprint</h3>
            <button
              onClick={() => setShowCreate(false)}
              className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {createError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              {createError}
            </div>
          )}
          {jsonError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{jsonError}</span>
            </div>
          )}
          {jsonMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{jsonMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={templateMode}
              onChange={(e) => {
                const nextMode = e.target.value as TemplateMode;
                setTemplateMode(nextMode);
                setJsonError(null);
                setJsonMessage(null);
                if (nextMode === 'cloudformation' && form.provider !== 'aws') {
                  setForm((prev) => ({ ...prev, provider: 'aws' }));
                }
              }}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 text-sm"
            >
              <option value="generic">Generic Template</option>
              <option value="cloudformation">AWS CloudFormation</option>
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Blueprint name"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 text-sm"
            />
            <select
              value={form.provider}
              onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
              disabled={templateMode === 'cloudformation'}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 text-sm"
            >
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 text-sm"
            />
            <select
              value={form.resource_type}
              onChange={(e) => setForm((prev) => ({ ...prev, resource_type: e.target.value }))}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 text-sm"
            >
              <option value="vm">VM</option>
              <option value="storage">Storage</option>
              <option value="network">Network</option>
            </select>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingJson(true);
            }}
            onDragLeave={() => setIsDraggingJson(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingJson(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleTemplateFile(file);
            }}
            className={`rounded-lg border-2 border-dashed p-4 transition-colors ${
              isDraggingJson ? 'border-pink-400 bg-pink-500/10' : 'border-gray-700 bg-gray-800/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-300">
                {templateMode === 'cloudformation'
                  ? 'Drag & drop a CloudFormation JSON template here, or use file picker.'
                  : 'Drag & drop a JSON file here, or use file picker.'}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json,.template"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleTemplateFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-gray-800/70 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium flex items-center gap-2"
                >
                  <Upload className="w-3 h-3" />
                  Choose JSON File
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700/50 overflow-hidden bg-[#0c0d12]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50 bg-[#151821]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Clear editor (close)"
                  onClick={clearEditor}
                  className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
                />
                <button
                  type="button"
                  title={editorMinimized ? 'Restore editor' : 'Minimize editor'}
                  onClick={() => setEditorMinimized((prev) => !prev)}
                  className="w-3.5 h-3.5 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
                />
                <button
                  type="button"
                  title={editorExpanded ? 'Normal size' : 'Expand editor'}
                  onClick={() => {
                    setEditorMinimized(false);
                    setEditorExpanded((prev) => !prev);
                  }}
                  className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
                />
              </div>
              <div className="text-xs text-gray-400 font-mono">
                {templateMode === 'cloudformation' ? 'template.cloudformation.json' : 'template.json'}
              </div>
              <div className="text-[11px] text-gray-500">
                {editorMinimized ? 'minimized' : editorExpanded ? 'expanded' : 'normal'}
              </div>
            </div>

            {!editorMinimized ? (
              <textarea
                ref={editorRef}
                value={form.template}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, template: e.target.value }));
                  setJsonError(null);
                  setJsonMessage(null);
                }}
                onKeyDown={handleEditorKeyDown}
                rows={5}
                placeholder={
                  templateMode === 'cloudformation'
                    ? '{"AWSTemplateFormatVersion":"2010-09-09","Description":"Sample stack","Resources":{"MyBucket":{"Type":"AWS::S3::Bucket","Properties":{"BucketName":"my-demo-bucket"}}}}'
                    : 'Template JSON, e.g. {"region":"us-east-1","instance_type":"t3.micro"}'
                }
                className={`w-full px-4 py-3 bg-[#0c0d12] text-green-200 text-sm font-mono border-0 focus:outline-none ${
                  editorExpanded ? 'h-[32rem]' : 'h-56'
                }`}
              />
            ) : (
              <div className="px-4 py-4 text-sm text-gray-400 flex items-center justify-between">
                <span>Editor is minimized.</span>
                <button
                  type="button"
                  onClick={() => setEditorMinimized(false)}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs"
                >
                  Restore Editor
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">Auto syntax:</span>
            {editorSnippets.map((snippet) => (
              <button
                key={snippet.label}
                type="button"
                onClick={() => insertSnippet(snippet.content)}
                className="px-3 py-1.5 bg-gray-800/70 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium"
              >
                {snippet.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={validateTemplateJson}
              className="px-3 py-2 bg-gray-800/70 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium"
            >
              Validate JSON
            </button>
            <button
              type="button"
              onClick={formatTemplateJson}
              className="px-3 py-2 bg-gray-800/70 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-medium"
            >
              Format JSON
            </button>
          </div>

          <button
            onClick={() => createBlueprint.mutate()}
            disabled={createBlueprint.isPending || !form.name.trim() || !form.description.trim()}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
          >
            {createBlueprint.isPending ? 'Creating...' : 'Create Blueprint'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (blueprints ?? []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints?.map((blueprint, index) => (
            <motion.div
              key={blueprint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-pink-500/10 rounded-lg">
                  <FileCode className="w-6 h-6 text-pink-500" />
                </div>
                <span className="px-2 py-1 bg-gray-800/50 text-xs text-gray-400 rounded">
                  {blueprint.provider.toUpperCase()}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{blueprint.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{blueprint.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500">{blueprint.resource_type}</span>
                <span className="text-xs text-gray-500">Used {blueprint.uses_count} times</span>
              </div>

                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => useBlueprint.mutate(blueprint.id)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-xs transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Deploy</span>
                </button>
                <button
                  onClick={() => cloneBlueprint(blueprint)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-xs transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Clone</span>
                </button>
                <button
                  onClick={() => deleteBlueprint.mutate(blueprint.id)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition-colors"
                  title="Delete Blueprint"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <FileCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No blueprints yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create reusable templates for your infrastructure</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Blueprint</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BlueprintsPage;
