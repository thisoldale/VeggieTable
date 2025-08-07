import React from 'react';

// This context will be shared between the App layout and the table component.
export const DirtyContext = React.createContext<{
  isPageDirty: boolean;
  setIsPageDirty: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);
