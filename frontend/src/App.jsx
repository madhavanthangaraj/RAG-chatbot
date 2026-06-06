import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/auth/ProfilePage';
import ChatPage from './features/chat/ChatPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import TicketsPage from './features/tickets/TicketsPage';
import KnowledgeBasePage from './features/kb/KnowledgeBasePage';
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/kb" element={<KnowledgeBasePage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}


