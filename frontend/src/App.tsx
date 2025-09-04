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
import { DirtyContext } from './DirtyContext';
import { PlanProvider, usePlan } from './context/PlanContext';
import ChangePlanModal from './components/ChangePlanModal';
import { useGetMostRecentGardenPlanQuery } from './store/plantApi';
import packageJson from '../package.json';

import { useTheme } from './context/ThemeContext';

function SideMenu() {
  const { activePlan } = usePlan();
  const [isChangePlanModalOpen, setChangePlanModalOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const openChangePlanModal = () => setChangePlanModalOpen(true);
  const closeChangePlanModal = () => setChangePlanModalOpen(false);

  const handleCreatePlanClick = () => {
    navigate('/plans');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="p-4 pt-16">
        {activePlan ? (
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-white">{activePlan.name}</h2>
            <button onClick={openChangePlanModal} className="text-sm text-green-300 hover:underline">
              (Change Plan)
            </button>
          </div>
        ) : (
          <div className="mb-8 text-center">
            <button onClick={handleCreatePlanClick} className="text-xl font-bold text-white hover:underline">
              Create a Plan
            </button>
          </div>
        )}
        <nav>
          <ul>
            <li className="mb-4">
              <Link to="/" className="block p-2 text-xl hover:bg-green-700 rounded transition duration-200">
                Home
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/tasks" className="block p-2 text-xl hover:bg-green-700 rounded transition duration-200">
                Tasks
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/plans" className="block p-2 text-xl hover:bg-green-700 rounded transition duration-200">
                All Garden Plans
              </Link>
            </li>
            <li className="mb-4">
              <Link to="/bulk-edit" className="block p-2 text-xl hover:bg-green-700 rounded transition duration-200">
                Plant Library
              </Link>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4">
          <div className="flex justify-center mb-2">
            <button
              onClick={toggleTheme}
              className="px-4 py-2 text-sm rounded-md text-white bg-gray-700 hover:bg-gray-600"
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
          <div className="text-center text-xs text-gray-400 mb-2">
            Version: {packageJson.version}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left p-2 text-xl hover:bg-green-700 rounded transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>
      <ChangePlanModal isOpen={isChangePlanModalOpen} onClose={closeChangePlanModal} />
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
      <div className={`fixed top-0 left-0 h-full bg-green-800 text-white w-64 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-40 shadow-lg`}>
        <button
          onClick={toggleSidebar}
          className="absolute top-4 right-4 text-white text-3xl hover:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close menu"
        >
          &times;
        </button>
        <SideMenu />
      </div>
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleSidebar}></div>
      )}
      <div className={`transition-all duration-300 ease-in-out`}>
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-20 p-2 bg-green-700 text-white rounded-md shadow-lg"
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
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full relative text-center">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Unsaved Changes</h2>
            <p className="text-gray-700 mb-6">You have unsaved changes. Are you sure you want to leave?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => blocker.reset?.()}
                className="px-4 py-2 rounded-md transition duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400 text-sm"
              >
                Stay
              </button>
              <button
                onClick={() => blocker.proceed?.()}
                className="px-4 py-2 rounded-md transition duration-200 bg-red-600 text-white hover:bg-red-700 text-sm"
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


// This component now handles the initial loading of the active plan.
const PlanLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activePlan, setActivePlan } = usePlan();
  // We only fetch if there isn't an active plan already in the state.
  const { data: mostRecentPlan, isLoading } = useGetMostRecentGardenPlanQuery(undefined, {
    skip: !!activePlan,
  });

  useEffect(() => {
    if (mostRecentPlan) {
      setActivePlan(mostRecentPlan);
    }
  }, [mostRecentPlan, setActivePlan]);

  // Show a loading indicator while we're fetching the initial plan.
  if (isLoading) {
    return <div className="p-8 text-center">Loading your garden...</div>;
  }

  return <>{children}</>;
};

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './LoginPage';
import RegistrationPage from './RegistrationPage';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You can replace this with a loading spinner component
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
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
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegistrationPage />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PlanProvider>
          <PlanLoader>
            <Toaster position="top-center" reverseOrder={false} />
            <RouterProvider router={router} />
          </PlanLoader>
        </PlanProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
