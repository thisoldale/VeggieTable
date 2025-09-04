import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { plantApi } from './plantApi';
// The store is configured with the auth reducer and the plant API reducer.
// The middleware is also configured to include the plant API middleware.
export const store = configureStore({
  reducer: {
    [plantApi.reducerPath]: plantApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(plantApi.middleware),
});

// These types are exported for use throughout the application.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks are created here to be used instead of the plain `useDispatch` and `useSelector` hooks.
// This provides type safety.
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
