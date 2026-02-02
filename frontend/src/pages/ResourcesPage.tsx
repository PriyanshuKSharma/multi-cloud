import React from 'react';
import ResourceList from '../components/ResourceList';

const ResourcesPage: React.FC = () => {
    return (
        <div className="space-y-6">
             <h1 className="text-2xl font-bold text-white">All Resources</h1>
             <ResourceList />
        </div>
    );
};
export default ResourcesPage;
