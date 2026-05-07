import type { SourceOption } from '../types';
import { preferredSourceOptions } from '../utils/sources';
import { hasCookieValue } from '../utils/cookies';
import { SourceBadge } from './SourceBadge';

interface SourcePickerProps {
  options: SourceOption[];
  selected: string[];
  sourceCookies: Record<string, string>;
  onChange: (sources: string[]) => void;
  label: string;
}

export function SourcePicker({ options, selected, sourceCookies, onChange, label }: SourcePickerProps) {
  const visible = preferredSourceOptions(options);

  function toggle(source: string) {
    if (selected.includes(source)) {
      if (selected.length <= 1) return;
      onChange(selected.filter((item) => item !== source));
      return;
    }
    onChange([...selected, source]);
  }

  return (
    <div className="source-picker">
      <span className="section-label">{label}</span>
      <div className="source-chip-grid">
        {visible.map((source) => {
          const checked = selected.includes(source.value);
          const locked = checked && selected.length <= 1;
          return (
            <button
              className={checked ? 'source-chip source-chip-active' : 'source-chip'}
              key={source.value}
              type="button"
              onClick={() => toggle(source.value)}
              aria-pressed={checked}
              aria-disabled={locked}
            >
              <span className={checked ? 'checkbox-proxy checkbox-proxy-on' : 'checkbox-proxy'}>{checked ? '✓' : ''}</span>
              <SourceBadge source={source.value} />
              {hasCookieValue(sourceCookies[source.value]) && <span className="cookie-dot" aria-label="Cookies saved" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
