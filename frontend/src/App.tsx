import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  createBrowserRouter,
  RouterProvider,
  Link, 
  Outlet,
  useBlocker,
  useNavigate,
  Navigate,
  useLocation,
} from 'react-router-dom';
import BulkEditTable from './BulkEditTable';
import PlantDetail from './PlantDetail';
import GardenPlansPage from './GardenPlansPage';
import GardenPlanDetailPage from './GardenPlanDetailPage';
import PlantingDetailPage from './PlantingDetailPage';
import HomePage from './HomePage';
import TasksPage from './TasksPage';
import SettingsPage from './SettingsPage';
import { DirtyContext } from './DirtyContext';
import { PlanProvider, usePlan } from './context/PlanContext';
import ChangePlanModal from './components/ChangePlanModal';
import { useGetMostRecentGardenPlanQuery } from './store/plantApi';
import packageJson from '../package.json';
import VersionDisplay from './components/VersionDisplay';

import { useTheme } from './context/ThemeContext';
import ThemeCustomizeModal from './components/ThemeCustomizeModal';

function SideMenu() {
  const { activePlan } = usePlan();
  const [isChangePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const navigate = useNavigate();

  const openChangePlanModal = () => setChangePlanModalOpen(true);
  const closeChangePlanModal = () => setChangePlanModalOpen(false);

  const handleCreatePlanClick = () => {
    navigate('/plans');
  };

  return (
    <>
      <div className="p-4 pt-16">
        {activePlan ? (
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold">{activePlan.name}</h2>
            <button onClick={openChangePlanModal} className="text-sm text-primary-foreground/80 hover:underline">
              (Change Plan)
            </button>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <button onClick={handleCreatePlanClick} className="text-xl font-bold hover:underline">
              Create a Plan
            </button>
          </div>
        )}
        <nav>
          <ul>
            <li className="mb-4">
              <Link to="/" className="block p-2 text-xl hover:bg-black/10 rounded transition duration-200">
                Home
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/tasks" className="block p-2 text-xl hover:bg-black/10 rounded transition duration-200">
                Tasks
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/plans" className="block p-2 text-xl hover:bg-black/10 rounded transition duration-200">
                All Garden Plans
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/bulk-edit" className="block p-2 text-xl hover:bg-black/10 rounded transition duration-200">
                Plant Library
              </Link>
            </li>
          </ul>
        </nav>
        <div className="border-t border-primary-foreground/20 my-4"></div>
        <nav>
          <ul>
            <li className="mb-4">
              <Link to="/settings" className="block p-2 text-xl hover:bg-black/10 rounded transition duration-200">
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4">
          <div className="flex justify-center mb-2">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="px-4 py-2 text-sm rounded-md bg-black/10 hover:bg-black/20"
            >
              Customize Theme
            </button>
          </div>
          <VersionDisplay />
        </div>
      </div>
      <ChangePlanModal isOpen={isChangePlanModalOpen} onClose={closeChangePlanModal} />
      <ThemeCustomizeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </>
  );
}

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPageDirty, setIsPageDirty] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const blocker = useBlocker(isPageDirty);

  return (
    <DirtyContext.Provider value={{ isPageDirty, setIsPageDirty }}>
      <div className={`fixed top-0 left-0 h-full bg-primary text-primary-foreground w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-40 shadow-lg`}>
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 text-primary-foreground text-3xl hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-ring rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close menu"
        >
          &times;
        </button>
        <SideMenu />
      </div>
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar}></div>
      )}
      <div className={`transition-all duration-300 ease-in-out bg-background text-foreground`}>
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-20 p-2 bg-primary text-primary-foreground rounded-md shadow-lg"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <main className="pt-16">
          <Outlet context={{ setIsPageDirty }} />
        </main>
      </div>

      {blocker.state === "blocked" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-component-background p-6 rounded-lg shadow-xl max-w-sm w-full relative text-center">
            <h2 className="text-lg font-bold mb-4">Unsaved Changes</h2>
            <p className="text-muted-foreground mb-6">You have unsaved changes. Are you sure you want to leave?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => blocker.reset?.()}
                className="px-4 py-2 rounded-md transition duration-200 bg-interactive-secondary text-interactive-secondary-foreground hover:bg-interactive-secondary/90 text-sm"
              >
                Stay
              </button>
              <button
                onClick={() => blocker.proceed?.()}
                className="px-4 py-2 rounded-md transition duration-200 bg-interactive-destructive text-interactive-destructive-foreground hover:bg-interactive-destructive/90 text-sm"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </DirtyContext.Provider>
  );
}



import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "tasks",
        element: <TasksPage />,
      },
      {
        path: "plants/:plantId",
        element: <PlantDetail />,
      },
      {
        path: "bulk-edit",
        element: <BulkEditTable />,
      },
      {
        path: "plans",
        element: <GardenPlansPage />,
      },
      {
        path: "plans/:planId",
        element: <GardenPlanDetailPage />,
      },
      {
        path: "plantings/:plantingId",
        element: <PlantingDetailPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <PlanProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <RouterProvider router={router} />
        </PlanProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
