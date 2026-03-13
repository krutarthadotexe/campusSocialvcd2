import { AdminRolePanel } from '../components/AdminRolePanel.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { ProfileEditor } from '../components/ProfileEditor.jsx';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <section className="stack">
      <div className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">Account role</p>
            <h3>{user.role === 'teacher' ? 'Teacher account' : 'Student account'}</h3>
          </div>
        </div>
        <p className="subtle-text">
          Only teacher accounts can publish campus events. Signups can request the teacher role with the teacher password.
        </p>
      </div>
      {user.role === 'admin' ? <AdminRolePanel /> : null}
      <ProfileEditor />
    </section>
  );
}
