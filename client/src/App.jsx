import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPanel } from './components/AuthPanel.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { FeedPage } from './pages/FeedPage.jsx';
import { CreatePostPage } from './pages/CreatePostPage.jsx';
import { DiscoverPage } from './pages/DiscoverPage.jsx';
import { EventsPage } from './pages/EventsPage.jsx';
import { MessagesPage } from './pages/MessagesPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { UserProfilePage } from './pages/UserProfilePage.jsx';
import { useAuth } from './state/AuthContext.jsx';

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content-area">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:username" element={<UserProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="splash-screen">Loading session...</div>;
  }

  if (!user) {
    return <AuthPanel />;
  }

  return <AppShell />;
}
