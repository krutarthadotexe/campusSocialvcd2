import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar.jsx';

export function UserListModal({ title, users, onClose }) {
  const navigate = useNavigate();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose}>
          Close
        </button>
        <div className="panel-head">
          <div>
            <p className="eyebrow">Connections</p>
            <h3>{title}</h3>
          </div>
        </div>

        <div className="stack">
          {users.map((user) => (
            <button
              key={user._id}
              type="button"
              className="conversation-row"
              onClick={() => {
                navigate(`/users/${user.username}`);
                onClose();
              }}
            >
              <Avatar user={user} size="medium" />
              <div className="conversation-copy">
                <strong>{user.name}</strong>
                <span className="handle">@{user.username}</span>
                <span className="subtle-text">{user.bio || 'No bio yet.'}</span>
              </div>
            </button>
          ))}
          {!users.length ? <p className="subtle-text">No users to show.</p> : null}
        </div>
      </div>
    </div>
  );
}
