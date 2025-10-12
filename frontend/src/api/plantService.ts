// frontend/src/api/plantService.ts
// Updated to be more complete and use a specific type for creating plantings.
import api from './api';
import * as z from 'zod';
import {
    Plant,
    PlantSchema,
    GardenPlan,
    GardenPlanSchema,
    Planting,
    PlantingSchema,
    PlantingCreatePayload,
} from '../schemas';

// --- Validation Helper ---
function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        console.error("API response validation failed", error);
        throw new Error("Invalid data structure received from server.");
    }
}

// --- Plant Library ---
export const getAllPlants = async (): Promise<Plant[]> => {
  const response = await api.get<Plant[]>(`/plants/`);
  return validateAndParse(z.array(PlantSchema), response.data);
};

export const getPlantById = async (plantId: string): Promise<Plant> => {
  const response = await api.get<Plant>(`/plants/${plantId}`);
  return validateAndParse(PlantSchema, response.data);
};

export const createPlant = async (plantData: Omit<Plant, 'id'>): Promise<Plant> => {
  const response = await api.post<Plant>(`/plants/`, plantData);
  return validateAndParse(PlantSchema, response.data);
};

export const updatePlantById = async (plantId: number, plantData: Partial<Plant>): Promise<Plant> => {
  const response = await api.put<Plant>(`/plants/${plantId}`, plantData);
  return validateAndParse(PlantSchema, response.data);
};

export const deletePlantById = async (plantId: number): Promise<void> => {
  await api.delete(`/plants/${plantId}`);
};

export const importCsv = async (file: File, mode: 'append' | 'replace'): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ message: string }>(`/plants/import?mode=${mode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // Not validating this response as it's a simple message
};

// --- Garden Plans ---
export const getMostRecentGardenPlan = async (): Promise<GardenPlan | null> => {
    const response = await api.get<GardenPlan | null>(`/garden-plans/most-recent`);
    if (response.data === null) {
        return null;
    }
    return validateAndParse(GardenPlanSchema, response.data);
};

export const getAllGardenPlans = async (): Promise<GardenPlan[]> => {
    const response = await api.get<GardenPlan[]>(`/garden-plans/`);
    return validateAndParse(z.array(GardenPlanSchema), response.data);
};

export const getGardenPlanById = async (planId: string): Promise<GardenPlan> => {
    const response = await api.get<GardenPlan>(`/garden-plans/${planId}`);
    return validateAndParse(GardenPlanSchema, response.data);
};

export const createGardenPlan = async (planData: { name: string, description?: string }): Promise<GardenPlan> => {
    const response = await api.post<GardenPlan>(`/garden-plans/`, planData);
    return validateAndParse(GardenPlanSchema, response.data);
};

// --- Plantings ---
export const createPlantings = async (gardenPlanId: number, plantingData: PlantingCreatePayload): Promise<Planting[]> => {
    const response = await api.post<Planting[]>(`/garden-plans/${gardenPlanId}/plantings`, plantingData);
    return validateAndParse(z.array(PlantingSchema), response.data);
}

export const getPlantingById = async (plantingId: string): Promise<Planting> => {
    const response = await api.get<Planting>(`/plantings/${plantingId}`);
    return validateAndParse(PlantingSchema, response.data);
};

export const updatePlantingById = async (plantingId: number, plantingData: Partial<Planting>): Promise<Planting> => {
    const response = await api.put<Planting>(`/plantings/${plantingId}`, plantingData);
    return validateAndParse(PlantingSchema, response.data);
};

export const deletePlantingById = async (plantingId: number): Promise<void> => {
    await api.delete(`/plantings/${plantingId}`);
};
