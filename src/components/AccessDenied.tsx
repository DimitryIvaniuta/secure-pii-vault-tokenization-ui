import { Link } from 'react-router-dom';

interface AccessDeniedProps {
  title: string;
  description: string;
}

export function AccessDenied({ title, description }: AccessDeniedProps) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Access denied</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
      <div className="inline-actions">
        <Link className="button button--primary" to="/dashboard">Return to dashboard</Link>
      </div>
    </div>
  );
}
