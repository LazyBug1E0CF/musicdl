import { useEffect, useMemo, useState } from 'react';
import { Checkbox, InputNumber, Radio } from 'antd';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { DownloadFilenameFormat, DownloadMode, SourceOption, WebUISettings } from '../types';
import { displaySource, preferredSourceOptions } from '../utils/sources';
import { hasCookieValue } from '../utils/cookies';
import { SourceBadge } from '../components/SourceBadge';

interface SettingsPageProps {
  sourceOptions: SourceOption[];
  settings: WebUISettings;
  onBack: () => void;
  onUpdateSettings: (settings: Partial<WebUISettings>) => void;
  onSaveCookie: (source: string, cookie: string) => void;
  onClearCookie: (source: string) => void;
  labels: Record<string, string>;
}

export function SettingsPage({ sourceOptions, settings, onBack, onUpdateSettings, onSaveCookie, onClearCookie, labels }: SettingsPageProps) {
  const sources = useMemo(() => preferredSourceOptions(sourceOptions), [sourceOptions]);
  const activeSource = sources.some((source) => source.value === settings.activeCookieSource)
    ? settings.activeCookieSource
    : sources[0]?.value || settings.activeCookieSource;
  const [cookieDraft, setCookieDraft] = useState(settings.sourceCookies[activeSource] ?? '');

  useEffect(() => {
    setCookieDraft(settings.sourceCookies[activeSource] ?? '');
  }, [activeSource, settings.sourceCookies]);

  function selectSource(source: string) {
    onUpdateSettings({ activeCookieSource: source });
  }

  function setDownloadMode(downloadMode: DownloadMode) {
    onUpdateSettings({
      downloadMode,
      autoImportToLibrary: downloadMode === 'server' ? settings.autoImportToLibrary : false,
    });
  }

  function setFilenameFormat(downloadFilenameFormat: DownloadFilenameFormat) {
    onUpdateSettings({ downloadFilenameFormat });
  }

  return (
    <main className="settings-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        {labels.back}
      </button>
      <header className="settings-heading">
        <h1>{labels.settingsTitle}</h1>
        <p>{labels.settingsSubtitle}</p>
      </header>

      <section className="settings-card cookie-card">
        <div className="settings-card-header">
          <h2>{labels.cookiesConfig}</h2>
          <p>{labels.cookiesDescription}</p>
        </div>
        <div className="settings-content">
          <nav className="platform-tabs" aria-label={labels.platformSources}>
            {sources.map((source) => (
              <button
                className={source.value === activeSource ? 'platform-tab platform-tab-active' : 'platform-tab'}
                key={source.value}
                type="button"
                onClick={() => selectSource(source.value)}
              >
                <SourceBadge source={source.value} />
                {hasCookieValue(settings.sourceCookies[source.value]) && <span className="cookie-dot" aria-label="Cookies saved" />}
              </button>
            ))}
          </nav>
          <div className="cookie-editor">
            <label>
              <span>{displaySource(activeSource)}</span>
              <textarea
                value={cookieDraft}
                placeholder={labels.cookiePlaceholder}
                onChange={(event) => setCookieDraft(event.target.value)}
                spellCheck={false}
              />
            </label>
            <div className="settings-actions">
              <button className="primary-gradient-button small-button" type="button" onClick={() => onSaveCookie(activeSource, cookieDraft)}>
                <Save size={16} />
                {labels.save}
              </button>
              <button className="secondary-button small-button" type="button" onClick={() => onClearCookie(activeSource)}>
                <Trash2 size={16} />
                {labels.clear}
              </button>
            </div>
            <p className="settings-tip">{labels.cookieTip}</p>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-header">
          <h2>{labels.downloadBehavior}</h2>
          <p>{labels.downloadBehaviorDescription}</p>
        </div>
        <div className="download-preferences">
          <Radio.Group value={settings.downloadMode} onChange={(event) => setDownloadMode(event.target.value)}>
            <div className="radio-row">
              <Radio value="server">{labels.serverDownload}</Radio>
              <p>{labels.serverDownloadHelp}</p>
            </div>
            <div className="radio-row">
              <Radio value="browser">{labels.browserDirectDownload}</Radio>
              <p>{labels.browserDirectDownloadHelp}</p>
            </div>
          </Radio.Group>
          <Checkbox
            checked={settings.autoImportToLibrary}
            disabled={settings.downloadMode !== 'server'}
            onChange={(event) => onUpdateSettings({ autoImportToLibrary: event.target.checked })}
          >
            {labels.autoImport}
          </Checkbox>
          <p className="settings-tip">{labels.autoImportHelp}</p>
          <div className="settings-field">
            <label htmlFor="max-results">{labels.maxResults}</label>
            <InputNumber
              id="max-results"
              min={1}
              max={500}
              value={settings.maxResults}
              placeholder="Auto"
              onChange={(value) => onUpdateSettings({ maxResults: typeof value === 'number' && value > 0 ? Math.floor(value) : undefined })}
            />
            <p>{labels.maxResultsHelp}</p>
          </div>
          <div className="settings-field">
            <span>{labels.filenameFormat}</span>
            <Radio.Group value={settings.downloadFilenameFormat} onChange={(event) => setFilenameFormat(event.target.value)}>
              <Radio.Button value="artist-title">{labels.filenameArtistTitle}</Radio.Button>
              <Radio.Button value="title-artist">{labels.filenameTitleArtist}</Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </section>
    </main>
  );
}
