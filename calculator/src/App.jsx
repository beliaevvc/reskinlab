import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './lib/i18n';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ViewAsRoleProvider } from './contexts/ViewAsRoleContext';

// Layouts
import { AppLayout } from './components/layout';

// Auth components
import { ProtectedRoute } from './components/auth';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App pages
import DashboardPage from './pages/dashboard/DashboardPage';
import CalculatorPage from './pages/calculator/CalculatorPage';
import PublicCalculatorPage from './pages/calculator/PublicCalculatorPage';
import ProfilePage from './pages/profile/ProfilePage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectPage from './pages/projects/ProjectPage';
import SpecificationDetailPage from './pages/specifications/SpecificationDetailPage';
import SpecificationsPage from './pages/specifications/SpecificationsPage';

// Phase 3: Offers & Invoices
import OffersPage from './pages/offers/OffersPage';
import OfferDetailPage from './pages/offers/OfferDetailPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';

// Phase 6: Admin Panel
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import PromoCodesPage from './pages/admin/PromoCodesPage';
import PricingPage from './pages/admin/PricingPage';
import { TaskAutoCreationSettingsPage } from './pages/admin/TaskAutoCreationSettingsPage';
import CryptoWalletsPage from './pages/admin/CryptoWalletsPage';
import OfferTemplatesPage from './pages/admin/OfferTemplatesPage';
import OfferTemplateEditorPage from './pages/admin/OfferTemplateEditorPage';

// Placeholder pages for future implementation
function PlaceholderPage({ title }) {
  return (
    <div className="bg-white rounded-md border border-neutral-200 p-6">
      <h1 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h1>
      <p className="text-neutral-500">
        This page will be implemented in upcoming phases.
      </p>
    </div>
  );
}

// Create React Query client (настройки из systemPatterns.md)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Важно для стабильности
    },
  },
});

function AppContent() {
  return (
    <>
      <ViewAsRoleProvider>
          <Routes>
            {/* ==================== */}
            {/* PUBLIC ROUTES */}
            {/* ==================== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/shared/calculator" element={<PublicCalculatorPage />} />
            <Route path="/shared/calculator/:code" element={<PublicCalculatorPage />} />

            {/* ==================== */}
            {/* CLIENT ROUTES */}
            {/* ==================== */}
            <Route element={<ProtectedRoute allowedRoles={['client']} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectPage />} />
                <Route path="/specifications/:id" element={<SpecificationDetailPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/offers/:id" element={<OfferDetailPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* ==================== */}
            {/* ACCOUNT MANAGER ROUTES */}
            {/* ==================== */}
            <Route element={<ProtectedRoute allowedRoles={['am', 'admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/am/dashboard" element={<DashboardPage />} />
                <Route path="/am/calculator" element={<CalculatorPage />} />
                <Route path="/am/projects" element={<ProjectsPage />} />
                <Route path="/am/projects/:id" element={<ProjectPage />} />
                <Route path="/am/specifications" element={<SpecificationsPage />} />
                <Route path="/am/specifications/:id" element={<SpecificationDetailPage />} />
                <Route path="/am/offers" element={<OffersPage />} />
                <Route path="/am/offers/:id" element={<OfferDetailPage />} />
                <Route path="/am/invoices" element={<InvoicesPage />} />
                <Route path="/am/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/am/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* ==================== */}
            {/* ADMIN ROUTES */}
            {/* ==================== */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/calculator" element={<CalculatorPage />} />
                <Route path="/admin/projects" element={<ProjectsPage />} />
                <Route path="/admin/projects/:id" element={<ProjectPage />} />
                <Route path="/admin/specifications" element={<SpecificationsPage />} />
                <Route path="/admin/specifications/:id" element={<SpecificationDetailPage />} />
                <Route path="/admin/offers" element={<OffersPage />} />
                <Route path="/admin/offers/:id" element={<OfferDetailPage />} />
                <Route path="/admin/invoices" element={<InvoicesPage />} />
                <Route path="/admin/invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/pricing" element={<PricingPage />} />
                <Route path="/admin/promo-codes" element={<PromoCodesPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/task-settings" element={<TaskAutoCreationSettingsPage />} />
                <Route path="/admin/wallets" element={<CryptoWalletsPage />} />
                <Route path="/admin/offer-templates" element={<OfferTemplatesPage />} />
                <Route path="/admin/offer-templates/:id" element={<OfferTemplateEditorPage />} />
                <Route path="/admin/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* ==================== */}
            {/* REDIRECTS */}
            {/* ==================== */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
      </ViewAsRoleProvider>
    </>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
