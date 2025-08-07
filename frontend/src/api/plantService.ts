// frontend/src/api/plantService.ts
// Updated to be more complete and use a specific type for creating plantings.
import axios from 'axios';
import { 
    Plant, 
    GardenPlan, 
    PlantingGroup, 
    Planting, 
    PlantingDetail, 
    PlantingStatus, 
    PlantingMethod, 
    LogActionType,
    PlantingCreatePayload
} from '../types';

const API_BASE_URL = '/api';

// --- Plant Library ---
export const getAllPlants = async (): Promise<Plant[]> => {
  const response = await axios.get<Plant[]>(`${API_BASE_URL}/plants/`);
  return response.data;
};

export const getPlantById = async (plantId: string): Promise<Plant> => {
  const response = await axios.get<Plant>(`${API_BASE_URL}/plants/${plantId}`);
  return response.data;
};

export const createPlant = async (plantData: Omit<Plant, 'id'>): Promise<Plant> => {
  const response = await axios.post<Plant>(`${API_BASE_URL}/plants/`, plantData);
  return response.data;
};

export const updatePlantById = async (plantId: number, plantData: Partial<Plant>): Promise<Plant> => {
  const response = await axios.put<Plant>(`${API_BASE_URL}/plants/${plantId}`, plantData);
  return response.data;
};

export const deletePlantById = async (plantId: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/plants/${plantId}`);
};

export const importCsv = async (file: File, mode: 'append' | 'replace'): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post<{ message: string }>(`${API_BASE_URL}/plants/import?mode=${mode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// --- Garden Plans ---
export const getMostRecentGardenPlan = async (): Promise<GardenPlan | null> => {
    const response = await axios.get<GardenPlan | null>(`${API_BASE_URL}/garden-plans/most-recent`);
    return response.data;
};

export const getAllGardenPlans = async (): Promise<GardenPlan[]> => {
    const response = await axios.get<GardenPlan[]>(`${API_BASE_URL}/garden-plans/`);
    return response.data;
};

export const getGardenPlanById = async (planId: string): Promise<GardenPlan> => {
    const response = await axios.get<GardenPlan>(`${API_BASE_URL}/garden-plans/${planId}`);
    return response.data;
};

export const createGardenPlan = async (planData: { name: string, description?: string }): Promise<GardenPlan> => {
    const response = await axios.post<GardenPlan>(`${API_BASE_URL}/garden-plans/`, planData);
    return response.data;
};

// --- Planting Groups ---
export const createPlantingGroup = async (groupData: { garden_plan_id: number, name: string, notes?: string }): Promise<PlantingGroup> => {
    const response = await axios.post<PlantingGroup>(`${API_BASE_URL}/planting-groups/`, groupData);
    return response.data;
};

export const getPlantingGroupById = async (groupId: string): Promise<PlantingGroup> => {
    const response = await axios.get<PlantingGroup>(`${API_BASE_URL}/planting-groups/${groupId}`);
    return response.data;
};

export const updatePlantingGroupById = async (groupId: number, groupData: { name?: string, notes?: string }): Promise<PlantingGroup> => {
    const response = await axios.put<PlantingGroup>(`${API_BASE_URL}/planting-groups/${groupId}`, groupData);
    return response.data;
};

export const deletePlantingGroupById = async (groupId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/planting-groups/${groupId}`);
};

export const logGroupAction = async (groupId: number, actionType: LogActionType, actionDate: string, quantity?: number): Promise<PlantingGroup> => {
    const response = await axios.put<PlantingGroup>(`${API_BASE_URL}/planting-groups/${groupId}/log-action`, {
        action_type: actionType,
        action_date: actionDate,
        quantity: quantity,
    });
    return response.data;
};

// --- Plantings ---
export const createPlantings = async (gardenPlanId: number, plantingData: PlantingCreatePayload): Promise<Planting[]> => {
    const response = await axios.post<Planting[]>(`${API_BASE_URL}/garden-plans/${gardenPlanId}/plantings`, plantingData);
    return response.data;
}

export const getPlantingById = async (plantingId: string): Promise<PlantingDetail> => {
    const response = await axios.get<PlantingDetail>(`${API_BASE_URL}/plantings/${plantingId}`);
    return response.data;
};

export const updatePlantingById = async (plantingId: number, plantingData: Partial<PlantingDetail>): Promise<PlantingDetail> => {
    const response = await axios.put<PlantingDetail>(`${API_BASE_URL}/plantings/${plantingId}`, plantingData);
    return response.data;
};

export const deletePlantingById = async (plantingId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/plantings/${plantingId}`);
};
