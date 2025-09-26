// frontend/src/components/VersionDisplay.tsx
import React from 'react';
import { useGetBackendVersionQuery } from '../store/plantApi';

const VersionDisplay: React.FC = () => {
  const { data: backendVersionData, isLoading: isBackendVersionLoading } = useGetBackendVersionQuery();
  const frontendVersion = import.meta.env.VITE_APP_VERSION;
  const frontendBuildDate = import.meta.env.VITE_APP_BUILD_DATE;

  const backendVersionString = backendVersionData
    ? `${backendVersionData.version} (${backendVersionData.build_date})`
    : 'N/A';

  return (
    <div className="text-xs text-foreground/70 p-2 text-center">
      <div>Frontend Version: {frontendVersion} ({frontendBuildDate})</div>
      <div>
        Backend Version: {isBackendVersionLoading ? 'Loading...' : backendVersionString}
      </div>
    </div>
  );
};

export default VersionDisplay;
