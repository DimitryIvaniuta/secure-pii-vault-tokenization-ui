import type { ReactNode } from 'react';

interface PageTitleProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageTitle({ eyebrow, title, description, actions }: PageTitleProps) {
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted page-description">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
