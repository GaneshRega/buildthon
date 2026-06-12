import './Card.css';

export default function Card({ children, title, subtitle, footer, onClick, hoverable = false, className = '' }) {
  return (
    <div className={`card ${hoverable ? 'card--hoverable' : ''} ${onClick ? 'card--clickable' : ''} ${className}`} onClick={onClick}>
      {(title || subtitle) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="card__body">{children}</div>
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  );
}
