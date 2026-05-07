import { Alert, Button, Empty, Progress, Tag } from 'antd';
import { Download, X } from 'lucide-react';
import type { DownloadTask } from '../types';

function taskErrorText(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message ?? '');
  return JSON.stringify(error);
}

function statusColor(status: DownloadTask['status']) {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'running') return 'processing';
  return 'default';
}

interface DownloadQueueProps {
  tasks: DownloadTask[];
  open: boolean;
  onClose: () => void;
  labels: {
    title: string;
    empty: string;
    failed: string;
    browserDownload: string;
  };
}

export function DownloadQueue({ tasks, open, onClose, labels }: DownloadQueueProps) {
  if (!open) return null;

  return (
    <aside className="download-drawer">
      <div className="drawer-header">
        <strong>{labels.title}</strong>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close downloads">
          <X size={18} />
        </button>
      </div>
      {tasks.length === 0 ? (
        <Empty className="queue-empty" description={labels.empty} />
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <section className="task-card" key={task.task_id}>
              <div className="task-topline">
                <strong title={task.title}>{task.title}</strong>
                <Tag color={statusColor(task.status)}>{task.status}</Tag>
              </div>
              <Progress percent={task.progress} size="small" status={task.status === 'failed' ? 'exception' : undefined} />
              <span className="muted-line">
                {task.completed}/{task.total || '-'} {task.failed ? `${labels.failed}: ${task.failed}` : ''}
              </span>
              {task.serverPath && <code className="server-path">{task.serverPath}</code>}
              {task.error ? <Alert type="error" message={taskErrorText(task.error)} /> : null}
              {task.artifacts.map((artifact) => (
                <Button key={artifact.download_url} href={artifact.download_url} download={artifact.filename} icon={<Download size={15} />}>
                  {labels.browserDownload}
                </Button>
              ))}
              {task.logs.length > 0 && <span className="muted-line">{task.logs[task.logs.length - 1]}</span>}
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
