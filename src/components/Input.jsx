import './Input.css';

export default function Input({ label, id, error, helperText, ...props }) {
  return (
    <div className="input-group">
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <input id={id} className={`input-field ${error ? 'input-field--error' : ''}`} {...props} />
      {error && <p className="input-error">{error}</p>}
      {helperText && !error && <p className="input-helper">{helperText}</p>}
    </div>
  );
}
