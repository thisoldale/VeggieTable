import { useState, useEffect, useMemo } from 'react';
import { ColumnPreset } from '../types';
import { Table } from '@tanstack/react-table';

const defaultPresets: ColumnPreset[] = [
  { name: 'Default', visibility: {} },
  { name: 'Basic View', visibility: { species: false } },
  { name: 'Full View', visibility: { id: true, name: true, species: true } },
];

/**
 * Custom hook to manage column visibility presets for a TanStack Table.
 * @param table - The TanStack Table instance.
 */
export const useColumnPresets = <TData,>(table: Table<TData>) => {
  const [savedPresets, setSavedPresets] = useState<ColumnPreset[]>([]);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Default');

  // Load saved presets from local storage on initial render.
  useEffect(() => {
    const storedPresets = localStorage.getItem('columnPresets');
    if (storedPresets) {
      try {
        setSavedPresets(JSON.parse(storedPresets));
      } catch (e) {
        console.error("Failed to parse stored column presets:", e);
        localStorage.removeItem('columnPresets');
      }
    }
  }, []);

  // Persist saved presets to local storage whenever they change.
  useEffect(() => {
    localStorage.setItem('columnPresets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const allPresets = useMemo(() => [...defaultPresets, ...savedPresets], [savedPresets]);

  // Apply the selected preset's visibility to the table.
  useEffect(() => {
    const presetToApply = allPresets.find(p => p.name === selectedPresetName);

    if (presetToApply) {
      const newVisibility: Record<string, boolean> = {};
      table.getAllColumns().forEach(column => {
        if (column.getCanHide()) {
          newVisibility[column.id] = true; // Default to visible
        }
      });

      // Apply the preset's specific visibility settings
      Object.entries(presetToApply.visibility).forEach(([columnId, isVisible]) => {
        if (table.getColumn(columnId)) {
          newVisibility[columnId] = isVisible;
        }
      });

      table.setColumnVisibility(newVisibility);
    }
  }, [selectedPresetName, allPresets, table]);

  /**
   * Saves the current column visibility as a new preset.
   * @param presetName - The name for the new preset.
   * @returns An error message if the name is invalid, otherwise null.
   */
  const saveCurrentPreset = (presetName: string): string | null => {
    const trimmedName = presetName.trim();
    if (!trimmedName) {
      return 'View name cannot be empty.';
    }
    if (allPresets.some(p => p.name === trimmedName)) {
      return 'A view with this name already exists.';
    }

    const currentVisibility: Record<string, boolean> = {};
    table.getAllColumns().forEach(column => {
      if (column.getCanHide()) {
        currentVisibility[column.id] = column.getIsVisible();
      }
    });

    const newPreset: ColumnPreset = { name: trimmedName, visibility: currentVisibility };
    setSavedPresets(prev => [...prev, newPreset]);
    setSelectedPresetName(trimmedName);
    return null; // Success
  };

  /**
   * Deletes a custom preset by its name.
   * @param presetName - The name of the preset to delete.
   */
  const deletePreset = (presetName: string) => {
    setSavedPresets(prev => prev.filter(p => p.name !== presetName));
    if (selectedPresetName === presetName) {
      setSelectedPresetName('Default'); // Revert to default if the active one is deleted
    }
  };

  return {
    selectedPresetName,
    setSelectedPresetName,
    savedPresets,
    defaultPresets,
    saveCurrentPreset,
    deletePreset,
  };
};
