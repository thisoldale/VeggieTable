import { configureStore } from '@reduxjs/toolkit';
import { plantApi } from './plantApi';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [plantApi.reducerPath]: plantApi.reducer,
    auth: authReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(plantApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
