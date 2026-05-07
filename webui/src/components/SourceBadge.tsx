import { displaySource, sourceColor, sourceInitial } from '../utils/sources';

interface SourceBadgeProps {
  source: string;
  compact?: boolean;
}

export function SourceBadge({ source, compact = false }: SourceBadgeProps) {
  return (
    <span className={compact ? 'source-badge source-badge-compact' : 'source-badge'}>
      <span className="source-badge-icon" style={{ background: sourceColor(source) }}>
        {sourceInitial(source)}
      </span>
      {!compact && <span>{displaySource(source)}</span>}
    </span>
  );
}
