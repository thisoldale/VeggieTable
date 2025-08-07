// frontend/src/hooks/usePlantData.ts
// This file should now correctly import the restored `importCsv` function.
import { useState, useEffect, useCallback } from 'react';
import { Plant } from '../types';
import { getAllPlants, createPlant, updatePlantById, deletePlantById, importCsv } from '../api/plantService';

// Define a type for the status message
export type StatusMessage = {
  type: 'success' | 'error' | 'info';
  message: string;
} | null;

/**
 * Custom hook to manage all plant data interactions and state.
 */
export const usePlantData = () => {
    const [data, setData] = useState<Plant[]>([]);
    const [originalData, setOriginalData] = useState<Plant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);
    const [editedRows, setEditedRows] = useState<Record<string, Plant>>({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const plants = await getAllPlants();
            setData(plants);
            setOriginalData(plants);
        } catch (err) {
            console.error('Error fetching plants:', err);
            setError('Failed to fetch plants.');
            setStatusMessage({ type: 'error', message: 'Failed to fetch plants.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveChanges = async () => {
        setStatusMessage(null);
        const editedPlants = Object.values(editedRows);
        if (editedPlants.length === 0) {
            setStatusMessage({ type: 'info', message: 'No changes to save.' });
            return;
        }

        const createPromises = editedPlants
            .filter(p => p.id <= 0)
            .map(p => {
                const { id, ...plantData } = p;
                return createPlant(plantData as Omit<Plant, 'id'>);
            });

        const updatePromises = editedPlants
            .filter(p => p.id > 0)
            .map(p => updatePlantById(p.id, p));

        try {
            await Promise.all([...createPromises, ...updatePromises]);
            setStatusMessage({ type: 'success', message: 'All changes saved successfully!' });
            setEditedRows({});
            fetchData(); // Refresh data from server
        } catch (err) {
            console.error('Failed to save changes:', err);
            setStatusMessage({ type: 'error', message: 'Failed to save some changes. See console for details.' });
        }
    };

    const deleteRows = async (plantIds: number[]) => {
        setLoading(true);
        setError(null);
        let successCount = 0;
        let failCount = 0;
        const failedIds: number[] = [];

        for (const plantId of plantIds) {
            try {
                await deletePlantById(plantId);
                successCount++;
            } catch (err) {
                console.error(`Failed to delete plant with ID ${plantId}:`, err);
                failCount++;
                failedIds.push(plantId);
            }
        }

        if (failCount > 0) {
            setStatusMessage({ type: 'error', message: `Successfully deleted ${successCount}. Failed to delete ${failCount}: ${failedIds.join(', ')}.` });
        } else {
            setStatusMessage({ type: 'success', message: `Successfully deleted ${successCount} selected plants.` });
        }
        fetchData(); // Refresh data
    };

    const importData = async (file: File, mode: 'append' | 'replace') => {
        setLoading(true);
        setStatusMessage({ type: 'info', message: `Importing CSV (${mode} mode)...` });
        try {
            const response = await importCsv(file, mode);
            setStatusMessage({ type: 'success', message: response.message || 'CSV imported successfully!' });
            fetchData();
        } catch (err: any) {
            console.error('Error importing CSV:', err);
            const detail = err.response?.data?.detail;
            setStatusMessage({ type: 'error', message: `Import failed: ${detail || 'Check console.'}` });
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        setData,
        originalData,
        loading,
        error,
        statusMessage,
        setStatusMessage,
        editedRows,
        setEditedRows,
        fetchData,
        saveChanges,
        deleteRows,
        importData,
    };
};
