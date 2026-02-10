import { createRouter, RouterProvider, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import EquipmentMasterPage from './pages/EquipmentMasterPage';
import EquipmentListPage from './pages/EquipmentListPage';
import SparePartsPage from './pages/SparePartsPage';
import CataloguingPage from './pages/CataloguingPage';
import MaintenancePage from './pages/MaintenancePage';
import DocumentsPage from './pages/DocumentsPage';
import ReportsPage from './pages/ReportsPage';
import PageLayout from './components/PageLayout';

function RootLayout() {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: EquipmentMasterPage,
});

const equipmentListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/equipment-list',
  component: EquipmentListPage,
});

const sparePartsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spare-parts',
  component: SparePartsPage,
});

const cataloguingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cataloguing',
  component: CataloguingPage,
});

const maintenanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/maintenance',
  component: MaintenancePage,
});

const documentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/documents',
  component: DocumentsPage,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  equipmentListRoute,
  sparePartsRoute,
  cataloguingRoute,
  maintenanceRoute,
  documentsRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
