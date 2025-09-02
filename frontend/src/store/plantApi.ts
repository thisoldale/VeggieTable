import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Plant, GardenPlan, Planting, PlantingCreatePayload, Task, User } from '../types';
import { RootState } from './index'; // Import RootState

// Define a service using a base URL and expected endpoints
export const plantApi = createApi({
  reducerPath: 'plantApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: (headers, { getState }) => {
      // Correctly access the token from the auth slice
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Plant', 'GardenPlan', 'Planting', 'Task'], // Used for cache invalidation
  endpoints: (builder) => ({
    // --- Plant Library Endpoints ---
    getPlants: builder.query<Plant[], void>({
      query: () => 'plants/',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Plant' as const, id })),
              { type: 'Plant', id: 'LIST' },
            ]
          : [{ type: 'Plant', id: 'LIST' }],
    }),
    getPlantById: builder.query<Plant, number>({
      query: (id) => `plants/${id}`,
      providesTags: (result, error, id) => [{ type: 'Plant', id }],
    }),
    addPlant: builder.mutation<Plant, Partial<Plant>>({
      query: (body) => ({
        url: 'plants/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Plant', id: 'LIST' }],
    }),
    updatePlant: builder.mutation<Plant, Partial<Plant> & Pick<Plant, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `plants/${id}`,
        method: 'PUT',
        body: patch,
      }),
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          plantApi.util.updateQueryData('getPlants', undefined, (draft) => {
            const plant = draft.find((p) => p.id === id);
            if (plant) {
              Object.assign(plant, patch);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    deletePlant: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `plants/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          plantApi.util.updateQueryData('getPlants', undefined, (draft) => {
            const index = draft.findIndex((p) => p.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    importPlants: builder.mutation<{ message: string }, { file: File; mode: 'append' | 'replace' }>({
        query: ({ file, mode }) => {
            const formData = new FormData();
            formData.append('file', file);
            return {
                url: `plants/import?mode=${mode}`,
                method: 'POST',
                body: formData,
            }
        },
        invalidatesTags: [{ type: 'Plant', id: 'LIST' }],
    }),

    // --- Garden Plan Endpoints ---
    getGardenPlans: builder.query<GardenPlan[], void>({
        query: () => 'garden-plans/',
        providesTags: (result) =>
            result
            ? [
                ...result.map(({ id }) => ({ type: 'GardenPlan' as const, id })),
                { type: 'GardenPlan', id: 'LIST' },
                ]
            : [{ type: 'GardenPlan', id: 'LIST' }],
    }),
    getGardenPlanById: builder.query<GardenPlan, number>({
        query: (id) => `garden-plans/${id}`,
        providesTags: (result, error, id) => [{ type: 'GardenPlan', id }],
    }),
    getMostRecentGardenPlan: builder.query<GardenPlan, void>({
        query: () => 'garden-plans/most-recent',
        providesTags: [{ type: 'GardenPlan', id: 'LIST' }],
    }),
    addGardenPlan: builder.mutation<GardenPlan, Partial<GardenPlan>>({
        query: (body) => ({
            url: 'garden-plans/',
            method: 'POST',
            body,
        }),
        invalidatesTags: [{ type: 'GardenPlan', id: 'LIST' }],
    }),
    deleteGardenPlan: builder.mutation<{ success: boolean; id: number }, number>({
      query: (id) => ({
        url: `garden-plans/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          plantApi.util.updateQueryData('getGardenPlans', undefined, (draft) => {
            const index = draft.findIndex((p) => p.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    touchGardenPlan: builder.mutation<GardenPlan, number>({
        query: (id) => ({
            url: `garden-plans/${id}/touch`,
            method: 'PUT',
        }),
        invalidatesTags: [{ type: 'GardenPlan', id: 'LIST' }],
    }),

    // --- Planting Endpoints ---
    getPlantingById: builder.query<Planting, number>({
        query: (id) => `plantings/${id}`,
        providesTags: (result, error, id) => [{ type: 'Planting', id }],
    }),
    addPlanting: builder.mutation<Planting, { planId: number, payload: PlantingCreatePayload }>({
        query: ({ planId, payload }) => ({
            url: `garden-plans/${planId}/plantings`,
            method: 'POST',
            body: payload,
        }),
        invalidatesTags: (result, error, { planId }) => [{ type: 'GardenPlan', id: planId }],
    }),
    updatePlanting: builder.mutation<Planting, Partial<Planting> & Pick<Planting, 'id'>>({
        query: ({ id, ...patch }) => ({
            url: `plantings/${id}`,
            method: 'PUT',
            body: patch,
        }),
        invalidatesTags: (result, error, { id }) => [{ type: 'Planting', id }, { type: 'GardenPlan', id: result?.garden_plan_id }],
    }),
    deletePlanting: builder.mutation<{ success: boolean; id: number }, number>({
        query(id) {
            return {
            url: `plantings/${id}`,
            method: 'DELETE',
            };
        },
        invalidatesTags: (result, error, id) => [{ type: 'Planting', id }],
    }),

    // --- Task Endpoints ---
    getTasksForPlan: builder.query<Task[], number>({
        query: (planId) => `garden-plans/${planId}/tasks/`,
        providesTags: (result) =>
            result
            ? [
                ...result.map(({ id }) => ({ type: 'Task' as const, id })),
                { type: 'Task', id: 'LIST' },
                ]
            : [{ type: 'Task', id: 'LIST' }],
    }),
    addTask: builder.mutation<Task, Partial<Task>>({
        query: (body) => ({
            url: 'tasks/',
            method: 'POST',
            body,
        }),
        invalidatesTags: [{ type: 'Task', id: 'LIST' }, { type: 'GardenPlan', id: 'LIST' }],
    }),
    updateTask: builder.mutation<Task, Partial<Task> & Pick<Task, 'id'>>({
        query: ({ id, ...patch }) => ({
            url: `tasks/${id}`,
            method: 'PUT',
            body: patch,
        }),
        invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }, { type: 'Task', id: 'LIST' }, { type: 'GardenPlan', id: 'LIST' }],
    }),
    deleteTask: builder.mutation<{ success: boolean; id: number }, number>({
        query(id) {
            return {
                url: `tasks/${id}`,
                method: 'DELETE',
            };
        },
        invalidatesTags: (result, error, id) => [{ type: 'Task', id }, { type: 'Task', id: 'LIST' }, { type: 'GardenPlan', id: 'LIST' }],
    }),

    updateTaskGroup: builder.mutation<Task[], { groupId: number, dateDiffDays: number }>({
      query: ({ groupId, dateDiffDays }) => ({
        url: `task-groups/${groupId}`,
        method: 'PUT',
        body: { date_diff_days: dateDiffDays },
      }),
      invalidatesTags: (result, error, { groupId }) => [{ type: 'Task', id: 'LIST' }, { type: 'GardenPlan', id: 'LIST' }],
    }),

    unlinkTaskGroup: builder.mutation<Task[], { groupId: number }>({
      query: ({ groupId }) => ({
        url: `task-groups/${groupId}/unlink`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { groupId }) => [{ type: 'Task', id: 'LIST' }, { type: 'GardenPlan', id: 'LIST' }],
    }),

    // --- Auth Endpoints ---
    login: builder.mutation<{ access_token: string }, any>({
        query: (credentials) => ({
            url: 'token',
            method: 'POST',
            body: credentials,
        }),
    }),
    register: builder.mutation<User, any>({
        query: (userInfo) => ({
            url: 'users/',
            method: 'POST',
            body: userInfo,
        }),
    }),
    importMappedPlants: builder.mutation<{ message: string }, { data: any[], mapping: Record<string, string> }>({
        query: (body) => ({
            url: 'plants/import-mapped',
            method: 'POST',
            body,
        }),
        invalidatesTags: [{ type: 'Plant', id: 'LIST' }],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetPlantsQuery,
  useGetPlantByIdQuery,
  useAddPlantMutation,
  useUpdatePlantMutation,
  useDeletePlantMutation,
  useImportPlantsMutation,
  useGetGardenPlansQuery,
  useGetGardenPlanByIdQuery,
  useGetMostRecentGardenPlanQuery,
  useAddGardenPlanMutation,
  useDeleteGardenPlanMutation,
  useTouchGardenPlanMutation,
  useGetPlantingByIdQuery,
  useAddPlantingMutation,
  useUpdatePlantingMutation,
  useDeletePlantingMutation,
  useGetTasksForPlanQuery,
  useAddTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useLoginMutation,
  useRegisterMutation,
  useImportMappedPlantsMutation,
} = plantApi;