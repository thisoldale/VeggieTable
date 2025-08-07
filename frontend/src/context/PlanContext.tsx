import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';
import { GardenPlan } from '../types';
import { useTouchGardenPlanMutation } from '../store/plantApi';

interface PlanContextType {
  activePlan: GardenPlan | null;
  setActivePlan: (plan: GardenPlan | null) => void;
  clearActivePlan: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activePlan, setActivePlanState] = useState<GardenPlan | null>(null);
  const [touchGardenPlan] = useTouchGardenPlanMutation();

  const setActivePlan = useCallback((plan: GardenPlan | null) => {
    setActivePlanState(plan);
    // When a plan is set as active, "touch" it on the backend to update its last_accessed_date
    if (plan) {
      touchGardenPlan(plan.id);
    }
  }, [touchGardenPlan]);

  const clearActivePlan = useCallback(() => {
    setActivePlanState(null);
  }, []);

  const contextValue = useMemo(() => ({
    activePlan,
    setActivePlan,
    clearActivePlan
  }), [activePlan, setActivePlan, clearActivePlan]);

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
};
