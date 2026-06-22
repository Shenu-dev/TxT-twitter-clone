const COLORS = ['#ff0066', '#00ff41', '#ffff00', '#1d9bf0', '#ff6932', '#794bc4', '#00ba7c', '#ff7eb6'];

export default function Avatar({ user, size = 40, onClick }) {
  const idx = (user?.id?.charAt?.(0)?.charCodeAt?.(0) || 0) % COLORS.length;
  const initial = (user?.display_name || user?.displayName || '?').charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        backgroundColor: COLORS[idx],
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {initial}
    </div>
  );
}
