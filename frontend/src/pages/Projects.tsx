import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import PageGuide from '../components/ui/PageGuide';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  Settings,
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

const ProjectsPage: React.FC = () => {
  const [search, setSearch] = React.useState('');

  const { data: projects, isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get('/projects');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
  });

  const filteredProjects = (projects ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all">
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
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <FolderKanban className="w-6 h-6 text-blue-500" />
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                </button>
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
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No projects found</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first project to get started</p>
          <button className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all">
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
