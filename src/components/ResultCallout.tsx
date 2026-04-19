import type { ReactNode } from 'react';

interface ResultCalloutProps {
  title: string;
  children: ReactNode;
}

export function ResultCallout({ title, children }: ResultCalloutProps) {
  return (
    <div className="result-callout">
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
