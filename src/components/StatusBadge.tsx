interface StatusBadgeProps {
  value: string;
  tone?: 'success' | 'neutral' | 'danger';
}

export function StatusBadge({ value, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{value}</span>;
}
