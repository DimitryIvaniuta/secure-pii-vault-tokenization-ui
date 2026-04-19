interface StatCardProps {
  label: string;
  value: string;
  tone?: 'positive' | 'neutral' | 'warning';
}

export function StatCard({ label, value, tone = 'neutral' }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
    </div>
  );
}
