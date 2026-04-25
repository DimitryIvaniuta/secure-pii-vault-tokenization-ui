import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="empty-state full-height">
      <h1>Page not found</h1>
      <p className="muted">The requested route does not exist in this banking-style console.</p>
      <Link to="/login" className="button button--primary">Go to sign-in</Link>
    </div>
  );
}
