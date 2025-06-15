import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './utils/forceTextVisibility';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import EmailsPage from './pages/EmailsPage';
import FollowUpsPage from './pages/FollowUpsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import GmailCallback from './components/emails/GmailCallback';
import FocusPage from './pages/FocusPage';
import FocusAnalyticsPage from './pages/FocusAnalyticsPage';
import DocumentsPage from './pages/DocumentsPage';

// Components
import AppLayout from './components/layouts/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import NotificationHandler from './components/notifications/NotificationHandler';
import { FocusProvider } from './context/FocusContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const appContent = (
    <>
      {/* Notification Handler - only show for authenticated users */}
      {user && <NotificationHandler />}
    
      <Routes>
        {/* Public routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password/:token" element={!user ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />
      
      {/* Gmail Auth Callback - needs to be a top-level route to handle redirects */}
      <Route path="/auth/gmail/callback" element={user ? <GmailCallback /> : <Navigate to="/login" />} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="emails" element={<EmailsPage />} />
        <Route path="followups" element={<FollowUpsPage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="focus/analytics" element={<FocusAnalyticsPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* 404 page */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
  
  return (
    <NotificationProvider>
      {user ? (
        <FocusProvider>
          {appContent}
        </FocusProvider>
      ) : (
        appContent
      )}
    </NotificationProvider>
  );
}

export default App;
