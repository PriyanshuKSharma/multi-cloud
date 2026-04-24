import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import PageHero from '../components/ui/PageHero';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { getSubscriptionLimits, getSubscriptionPlanLabel } from '../data/subscriptionLimits';
import {
  CURRENT_PROJECT_CHANGED_EVENT,
  clearCurrentProject,
  readCurrentProjectId,
  setCurrentProject,
} from '../utils/currentProject';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  X,
  Loader,
  AlertCircle,
  Trash2,
  Eye,
  Pencil,
  Boxes,
  MapPin,
  ArrowRight,
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

interface ProjectResource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  region?: string | null;
  created_at: string;
}

interface ProjectDetail extends Project {
  resources: ProjectResource[];
}

interface ProjectPayload {
  name: string;
  description?: string;
}

interface DeleteProjectResponse {
  message: string;
  deleted_resources: number;
}

const formatProjectDate = (value: string): string => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Unknown';
  return new Date(timestamp).toLocaleDateString();
};

const formatResourceType = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'vm') return 'Virtual Machine';
  if (normalized === 'faas') return 'Function';
  if (normalized === 'storage') return 'Storage';
  if (normalized === 'sqs') return 'Queue';
  if (normalized === 'sns') return 'Topic';
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Resource';
};

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [isProjectFormOpen, setIsProjectFormOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [projectName, setProjectName] = React.useState('');
  const [projectDescription, setProjectDescription] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = React.useState<number | null>(null);
  const [selectedProjectIdForDetail, setSelectedProjectIdForDetail] = React.useState<number | null>(null);
  const [currentProjectId, setCurrentProjectId] = React.useState<number | null>(() => readCurrentProjectId());

  const { data: projects, isLoading, refetch, isError, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/projects/');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
  });

  const {
    data: projectDetail,
    isLoading: isProjectDetailLoading,
    isError: isProjectDetailError,
    error: projectDetailError,
  } = useQuery<ProjectDetail>({
    queryKey: ['project-detail', selectedProjectIdForDetail],
    enabled: selectedProjectIdForDetail !== null,
    queryFn: async () => {
      const response = await axios.get(`/projects/${selectedProjectIdForDetail}`);
      return response.data as ProjectDetail;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: ProjectPayload) => {
      const response = await axios.post('/projects/', payload);
      return response.data as Project;
    },
    onSuccess: (createdProject) => {
      setIsProjectFormOpen(false);
      setEditingProject(null);
      setProjectName('');
      setProjectDescription('');
      setFormError(null);
      setActionMessage(null);
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCurrentProject({ id: createdProject.id, name: createdProject.name });
      setCurrentProjectId(createdProject.id);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Failed to create project. Please try again.');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: number; payload: ProjectPayload }) => {
      const response = await axios.put(`/projects/${projectId}`, payload);
      return response.data as Project;
    },
    onSuccess: (updatedProject) => {
      setIsProjectFormOpen(false);
      setEditingProject(null);
      setProjectName('');
      setProjectDescription('');
      setFormError(null);
      setActionMessage('Project updated successfully.');
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', updatedProject.id] });
      if (currentProjectId === updatedProject.id) {
        setCurrentProject({ id: updatedProject.id, name: updatedProject.name });
      }
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Failed to update project. Please try again.');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
      const response = await axios.delete(`/projects/${project.id}`);
      return {
        project,
        result: response.data as DeleteProjectResponse,
      };
    },
    onMutate: ({ id }) => {
      setDeletingProjectId(id);
      setActionMessage(null);
      setActionError(null);
    },
    onSuccess: ({ project, result }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', project.id] });

      const remainingProjects = (projects ?? []).filter((item) => item.id !== project.id);
      if (currentProjectId === project.id) {
        if (remainingProjects.length > 0) {
          const fallback = remainingProjects[0];
          setCurrentProject({ id: fallback.id, name: fallback.name });
          setCurrentProjectId(fallback.id);
        } else {
          clearCurrentProject();
          setCurrentProjectId(null);
        }
      }

      if (selectedProjectIdForDetail === project.id) {
        setSelectedProjectIdForDetail(null);
      }

      setProjectToDelete(null);
      setActionMessage(
        result.deleted_resources > 0
          ? `Deleted "${project.name}" and ${result.deleted_resources} resource record${result.deleted_resources === 1 ? '' : 's'}.`
          : `Deleted "${project.name}".`
      );
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Failed to delete project.');
    },
    onSettled: () => {
      setDeletingProjectId(null);
    },
  });

  const filteredProjects = (projects ?? []).filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );
  const projectLimit = getSubscriptionLimits(user?.subscription_plan).projects;
  const hasReachedProjectLimit = projectLimit !== null && (projects?.length ?? 0) >= projectLimit;
  const projectLimitMessage =
    hasReachedProjectLimit && projectLimit !== null
      ? `${getSubscriptionPlanLabel(user?.subscription_plan)} plan allows up to ${projectLimit} projects. Delete one to create another.`
      : null;
  const isSubmittingProjectForm = createProjectMutation.isPending || updateProjectMutation.isPending;

  React.useEffect(() => {
    if (!projects || projects.length === 0) return;
    const storedId = readCurrentProjectId();
    if (storedId && projects.some((project) => project.id === storedId)) {
      setCurrentProjectId(storedId);
      return;
    }
    const first = projects[0];
    setCurrentProject({ id: first.id, name: first.name });
    setCurrentProjectId(first.id);
  }, [projects]);

  React.useEffect(() => {
    const onProjectChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: number | null }>;
      if (typeof customEvent.detail?.id === 'number') {
        setCurrentProjectId(customEvent.detail.id);
        return;
      }
      if (customEvent.detail?.id === null) {
        setCurrentProjectId(null);
      }
    };

    window.addEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
    return () =>
      window.removeEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
  }, []);

  const openCreateModal = () => {
    if (hasReachedProjectLimit) return;
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setFormError(null);
    setActionMessage(null);
    setIsProjectFormOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setFormError(null);
    setActionMessage(null);
    setSelectedProjectIdForDetail(null);
    setIsProjectFormOpen(true);
  };

  const closeProjectFormModal = () => {
    if (isSubmittingProjectForm) return;
    setIsProjectFormOpen(false);
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setFormError(null);
  };

  const openProjectDetails = (project: Project) => {
    setActionMessage(null);
    setActionError(null);
    setSelectedProjectIdForDetail(project.id);
  };

  const submitProjectForm = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setFormError('Project name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setFormError('Project name must be at least 2 characters.');
      return;
    }

    const payload = {
      name: trimmedName,
      description: projectDescription.trim() || undefined,
    };

    if (editingProject) {
      updateProjectMutation.mutate({ projectId: editingProject.id, payload });
      return;
    }

    createProjectMutation.mutate(payload);
  };

  const deleteDialogMessage = projectToDelete
    ? `Delete project "${projectToDelete.name}"?\n\nThis will also delete all resource records in the project from Nebula.${projectToDelete.resource_count > 0 ? ` ${projectToDelete.resource_count} resource record${projectToDelete.resource_count === 1 ? '' : 's'} will be removed.` : ''}`
    : '';

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="projects"
        tone="blue"
        eyebrow="Workspaces and ownership"
        eyebrowIcon={<FolderKanban className="h-3.5 w-3.5" />}
        title="Projects"
        titleIcon={<FolderKanban className="w-8 h-8 text-blue-400" />}
        description="Organize resources into project workspaces for ownership, lifecycle, and access boundaries."
        chips={[
          { label: `${projects?.length ?? 0} projects`, tone: 'blue' },
          { label: `${filteredProjects.length} visible`, tone: 'cyan' },
          { label: currentProjectId ? `current: #${currentProjectId}` : 'current: none', tone: 'indigo' },
        ]}
        guide={{
          title: 'About Projects',
          purpose: 'Projects group your infrastructure into logical workspaces for ownership, cost visibility, and lifecycle control.',
          actions: [
            'search and review existing projects',
            'open project details to inspect managed resources',
            'edit project metadata or delete a project with its resource records',
          ],
        }}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              disabled={hasReachedProjectLimit}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-500"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">
                {hasReachedProjectLimit ? 'Project Limit Reached' : 'New Project'}
              </span>
            </button>
          </>
        }
      />

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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

      {actionMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-200">
          {actionMessage}
        </div>
      )}

      {projectLimitMessage && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {projectLimitMessage}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-64 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
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
                {currentProjectId === project.id ? (
                  <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                    Current Project
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentProject({ id: project.id, name: project.name })}
                    className="cursor-pointer rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20"
                  >
                    Set Current
                  </button>
                )}
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">{project.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Resources</p>
                  <p className="text-lg font-semibold text-gray-300">{project.resource_count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-300">{formatProjectDate(project.last_updated)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Created {formatProjectDate(project.created_at)}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={() => openProjectDetails(project)}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-200 hover:bg-blue-500/15"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => openEditModal(project)}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setProjectToDelete(project)}
                  disabled={deletingProjectId === project.id}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deletingProjectId === project.id ? 'Deleting...' : 'Delete'}</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentProject({ id: project.id, name: project.name });
                    setSelectedProjectIdForDetail(project.id);
                  }}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Resources</span>
                </button>
              </div>
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
            disabled={hasReachedProjectLimit}
            className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-500"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">
              {hasReachedProjectLimit ? 'Project Limit Reached' : 'New Project'}
            </span>
          </button>
        </div>
      )}

      <ConfirmDialog
        open={projectToDelete !== null}
        title="Delete Project"
        message={deleteDialogMessage}
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={
          projectToDelete !== null &&
          deletingProjectId === projectToDelete.id &&
          deleteProjectMutation.isPending
        }
        onCancel={() => {
          if (!deleteProjectMutation.isPending) {
            setProjectToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!projectToDelete) return;
          deleteProjectMutation.mutate(projectToDelete);
        }}
      />

      {isProjectFormOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeProjectFormModal}
        >
          <div
            className="w-full max-w-lg bg-[#0f0f11] border border-gray-800/60 rounded-xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {editingProject ? 'Edit Project' : 'Create Project'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {editingProject
                    ? 'Update the project name or description.'
                    : 'Create a new project workspace for grouped resources.'}
                </p>
              </div>
              <button
                onClick={closeProjectFormModal}
                className="cursor-pointer p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitProjectForm} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g., Production Platform"
                  className="w-full px-4 py-2 bg-gray-800/60 border border-gray-700/60 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
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
                  onClick={closeProjectFormModal}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-gray-800/60 hover:bg-gray-700/70 text-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProjectForm}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                >
                  {isSubmittingProjectForm && <Loader className="w-4 h-4 animate-spin" />}
                  <span>
                    {isSubmittingProjectForm
                      ? editingProject
                        ? 'Saving...'
                        : 'Creating...'
                      : editingProject
                        ? 'Save Changes'
                        : 'Create Project'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProjectIdForDetail !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedProjectIdForDetail(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-gray-800/70 bg-[#0f0f11]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-800/70 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-blue-400">Project Detail</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {projectDetail?.name ?? 'Loading project...'}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {projectDetail?.description ?? 'Fetching resource inventory for this project.'}
                </p>
              </div>
              <button
                onClick={() => setSelectedProjectIdForDetail(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[calc(85vh-88px)] overflow-y-auto px-6 py-5">
              {isProjectDetailLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Loading project resources...
                </div>
              ) : isProjectDetailError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {projectDetailError instanceof Error
                    ? projectDetailError.message
                    : 'Failed to load project detail.'}
                </div>
              ) : projectDetail ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Resources</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{projectDetail.resource_count}</p>
                    </div>
                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Created</p>
                      <p className="mt-2 text-lg font-semibold text-white">{formatProjectDate(projectDetail.created_at)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-800/70 bg-gray-900/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Last Updated</p>
                      <p className="mt-2 text-lg font-semibold text-white">{formatProjectDate(projectDetail.last_updated)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setCurrentProject({ id: projectDetail.id, name: projectDetail.name })}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/15"
                    >
                      <Boxes className="w-4 h-4" />
                      <span>Set Current Project</span>
                    </button>
                    <button
                      onClick={() => openEditModal(projectDetail)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-700/70 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit Project</span>
                    </button>
                    <button
                      onClick={() => setProjectToDelete(projectDetail)}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/15"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Project</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-gray-800/70 bg-gray-950/40 overflow-hidden">
                    <div className="border-b border-gray-800/70 px-5 py-4">
                      <h3 className="text-lg font-semibold text-white">Resources in this project</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Managed resources attached to this project workspace.
                      </p>
                    </div>

                    {projectDetail.resources.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <FolderKanban className="mx-auto h-12 w-12 text-gray-600" />
                        <p className="mt-3 text-sm text-gray-400">No resources are assigned to this project yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800/70">
                        {projectDetail.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3">
                                <ProviderIcon provider={resource.provider as 'aws' | 'azure' | 'gcp'} size="md" />
                                <div className="min-w-0">
                                  <p className="truncate text-base font-semibold text-white">{resource.name}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                    <span>{formatResourceType(resource.type)}</span>
                                    {resource.region ? (
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{resource.region}</span>
                                      </span>
                                    ) : null}
                                    <span>Created {formatProjectDate(resource.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              <StatusBadge status={resource.status as any} size="sm" />
                              <Link
                                to={`/deployments/${resource.id}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-200 hover:bg-blue-500/15"
                              >
                                <span>View Deployment</span>
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
