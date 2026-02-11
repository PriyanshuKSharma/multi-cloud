import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import PageGuide from '../components/ui/PageGuide';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  X,
  Loader,
  ExternalLink,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Project {
  id: number;
  name: string;
  description: string;
  resource_count: number;
  team_members: number;
  created_at: string;
  last_updated: string;
}

interface ProjectCreatePayload {
  name: string;
  description?: string;
}

const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [projectName, setProjectName] = React.useState('');
  const [projectDescription, setProjectDescription] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = React.useState<number | null>(null);

  const { data: projects, isLoading, refetch, isError, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/projects/');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: ProjectCreatePayload) => {
      const response = await axios.post('/projects/', payload);
      return response.data as Project;
    },
    onSuccess: () => {
      setShowCreateModal(false);
      setProjectName('');
      setProjectDescription('');
      setFormError(null);
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        setFormError(detail);
      } else {
        setFormError('Failed to create project. Please try again.');
      }
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await axios.delete(`/projects/${projectId}`);
    },
    onMutate: (projectId) => {
      setDeletingProjectId(projectId);
      setActionError(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Failed to delete project.');
    },
    onSettled: () => {
      setDeletingProjectId(null);
    },
  });

  const filteredProjects = (projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setFormError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (createProjectMutation.isPending) return;
    setShowCreateModal(false);
    setFormError(null);
  };

  const submitCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setFormError('Project name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setFormError('Project name must be at least 2 characters.');
      return;
    }
    createProjectMutation.mutate({
      name: trimmedName,
      description: projectDescription.trim() || undefined,
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FolderKanban className="w-8 h-8 text-blue-500" />
            <span>Projects</span>
          </h1>
          <p className="text-gray-400 mt-1">Organize and manage your cloud resources by project</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={openCreateModal}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Project</span>
          </button>
        </div>
      </div>

      <PageGuide
        title="About Projects"
        purpose="Projects group your infrastructure into logical workspaces for ownership, cost visibility, and lifecycle control."
        actions={[
          'search existing projects',
          'review project resource counts and activity recency',
          'create a new project workspace for isolated deployments',
        ]}
      />

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Failed to load projects</p>
              <p className="text-sm text-gray-400 mt-1">
                {error instanceof Error ? error.message : 'Please retry in a moment.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FolderKanban className="w-6 h-6 text-blue-500" />
                </div>
                <Link
                  to="/resources"
                  className="cursor-pointer inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200"
                >
                  <span>Open Resources</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Resources</p>
                  <p className="text-lg font-semibold text-gray-300">{project.resource_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Team Members</p>
                  <p className="text-lg font-semibold text-gray-300">{project.team_members}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Updated {new Date(project.last_updated).toLocaleDateString()}</span>
              </div>

              {project.resource_count === 0 && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete project "${project.name}"? This cannot be undone.`
                      )
                    ) {
                      deleteProjectMutation.mutate(project.id);
                    }
                  }}
                  disabled={deletingProjectId === project.id}
                  className="cursor-pointer mt-4 inline-flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-lg text-xs border border-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{deletingProjectId === project.id ? 'Deleting...' : 'Delete Project'}</span>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No projects found</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first project to get started</p>
          <button
            onClick={openCreateModal}
            className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Project</span>
          </button>
        </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-lg bg-[#0f0f11] border border-gray-800/60 rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-white">Create Project</h2>
              <button
                onClick={closeCreateModal}
                className="cursor-pointer p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Production Platform"
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700/60 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Optional notes for this workspace"
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700/60 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/70 text-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                >
                  {createProjectMutation.isPending && <Loader className="w-4 h-4 animate-spin" />}
                  <span>{createProjectMutation.isPending ? 'Creating...' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
