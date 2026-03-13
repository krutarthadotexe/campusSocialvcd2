export function Avatar({ user, size = 'medium' }) {
  const classes = `avatar avatar-${size}`;

  if (user?.avatar?.url) {
    return <img className={classes} src={user.avatar.url} alt={user.name || user.username || 'User avatar'} />;
  }

  const label = (user?.name || user?.username || 'U').trim().charAt(0).toUpperCase();
  return <div className={`${classes} avatar-fallback`}>{label}</div>;
}
