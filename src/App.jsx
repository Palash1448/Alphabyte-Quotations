import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CompanyProfile from './pages/CompanyProfile';
import CreateQuotation from './pages/CreateQuotation';
import ManageQuotations from './pages/ManageQuotations';
import QuotationPreview from './pages/QuotationPreview';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="company" element={<CompanyProfile />} />
        <Route path="quotations" element={<ManageQuotations />} />
        <Route path="quotations/new" element={<CreateQuotation />} />
        <Route path="quotations/edit/:id" element={<CreateQuotation />} />
        <Route path="quotations/preview/:id" element={<QuotationPreview />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
