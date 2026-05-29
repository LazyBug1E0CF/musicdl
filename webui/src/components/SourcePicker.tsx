import { useState } from 'react';
import type { SourceOption } from '../types';
import { groupSourceOptions } from '../utils/sources';
import type { SourceGroup } from '../utils/sources';
import { hasCookieValue } from '../utils/cookies';
import { SourceBadge } from './SourceBadge';

interface SourcePickerProps {
  options: SourceOption[];
  selected: string[];
  sourceCookies: Record<string, string>;
  onChange: (sources: string[]) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function SourceGroupSection({
  group,
  selected,
  sourceCookies,
  onToggle,
  collapsed,
}: {
  group: SourceGroup;
  selected: string[];
  sourceCookies: Record<string, string>;
  onToggle: (source: string) => void;
  collapsed?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={collapsed ? 'source-group source-group-collapsed' : 'source-group'}>
      <button
        className="source-group-header"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <span className={`source-group-arrow${expanded ? ' source-group-arrow-open' : ''}`}>▸</span>
        <span className="source-group-name">{group.name}</span>
        <span className="source-group-count">{group.options.length}</span>
      </button>
      {expanded && (
        <div className="source-chip-grid">
          {group.options.map((source) => {
            const checked = selected.includes(source.value);
            return (
              <button
                className={checked ? 'source-chip source-chip-active' : 'source-chip'}
                key={source.value}
                type="button"
                onClick={() => onToggle(source.value)}
                aria-pressed={checked}
              >
                <span className={checked ? 'checkbox-proxy checkbox-proxy-on' : 'checkbox-proxy'}>{checked ? '✓' : ''}</span>
                <SourceBadge source={source.value} />
                {hasCookieValue(sourceCookies[source.value]) && <span className="cookie-dot" aria-label="Cookies saved" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SourcePicker({ options, selected, sourceCookies, onChange, collapsed = false, onToggleCollapse }: SourcePickerProps) {
  const groups = groupSourceOptions(options);

  function toggle(source: string) {
    if (selected.includes(source)) {
      onChange(selected.filter((item) => item !== source));
      return;
    }
    onChange([...selected, source]);
  }

  return (
    <div className="source-picker">
      {groups.map((group) => (
        <SourceGroupSection
          key={group.key}
          group={group}
          selected={selected}
          sourceCookies={sourceCookies}
          onToggle={toggle}
          collapsed={collapsed}
        />
      ))}
      {!collapsed && (
        <div className="collapsed-sources-row">
          <button
            className="collapsed-expand-button"
            type="button"
            onClick={onToggleCollapse}
          >
            收起
          </button>
        </div>
      )}
      {collapsed && (
        <div className="collapsed-sources-row">
          {selected.map((s) => (
            <span key={s} className="collapsed-chip">
              <SourceBadge source={s} compact />
            </span>
          ))}
          <button
            className="collapsed-expand-button"
            type="button"
            onClick={onToggleCollapse}
          >
            展开
          </button>
        </div>
      )}
    </div>
  );
}
