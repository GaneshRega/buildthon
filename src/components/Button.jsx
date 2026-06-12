import './Button.css';

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  fullWidth = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''}`}
    >
      {loading ? <span className="btn__spinner" /> : children}
    </button>
  );
}
