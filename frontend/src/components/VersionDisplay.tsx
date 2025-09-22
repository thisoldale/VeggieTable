// frontend/src/components/VersionDisplay.tsx
import React from 'react';
import { useGetBackendVersionQuery } from '../store/plantApi';

const VersionDisplay: React.FC = () => {
  const { data: backendVersionData, isLoading: isBackendVersionLoading } = useGetBackendVersionQuery();
  const frontendVersion = import.meta.env.VITE_APP_VERSION;

  return (
    <div className="text-xs text-muted-foreground p-2 text-center">
      <div>Frontend Version: {frontendVersion}</div>
      <div>
        Backend Version: {isBackendVersionLoading ? 'Loading...' : backendVersionData?.version || 'N/A'}
      </div>
    </div>
  );
};

export default VersionDisplay;
