import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Drawer, Empty, Input, Layout, Progress, Select, Space, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { subscribeTasks } from './api/client';
import { useAppStore } from './store/useAppStore';

const { Header, Content, Footer, Sider } = Layout;

export default function App() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const { searchParams, results, loading, error, downloadTasks, setSearchParams, runSearch, playSong, enqueueDownload, upsertTask, playbackUrl } = useAppStore();

  useEffect(() => {
    const sse = subscribeTasks(upsertTask);
    return () => sse.close();
  }, [upsertTask]);

  const columns = useMemo(() => [
    { title: '歌曲名', dataIndex: 'title' },
    { title: '歌手', dataIndex: 'artist' },
    { title: '时长', dataIndex: 'duration' },
    { title: '来源', dataIndex: 'source' },
    { title: '音质', dataIndex: 'quality' },
    {
      title: '操作',
      render: (_: unknown, row: any) => (
        <Space>
          <Button size="small" onClick={() => playSong(row)}>播放</Button>
          <Button size="small" onClick={() => enqueueDownload(row)}>下载</Button>
        </Space>
      ),
    },
  ], [enqueueDownload, playSong]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={320} theme="light">
        <div className="queue-wrap">
          <Typography.Title level={5}>{t('downloadQueue')}</Typography.Title>
          {downloadTasks.map((task) => (
            <div key={task.id} className="task-item">
              <div>{task.title}</div>
              <Tag color={task.status === 'failed' ? 'error' : 'processing'}>{task.status}</Tag>
              <Progress percent={task.progress} size="small" />
              {task.status === 'failed' && <Button size="small">{t('retry')}</Button>}
            </div>
          ))}
        </div>
      </Sider>
      <Layout>
        <Header className="header">
          <Space>
            <Typography.Title level={4} style={{ margin: 0 }}>{t('title')}</Typography.Title>
            <Select value={i18n.language} style={{ width: 100 }} onChange={(lng) => i18n.changeLanguage(lng)} options={[{ value: 'zh', label: '中文' }, { value: 'en', label: 'EN' }]} />
            <Input placeholder={t('searchPlaceholder')} value={searchParams.keyword} onChange={(e) => setSearchParams({ keyword: e.target.value })} style={{ width: 320 }} />
            <Select mode="multiple" value={searchParams.sources} style={{ width: 220 }} onChange={(sources) => setSearchParams({ sources })} options={[{ value: 'netease' }, { value: 'qq' }, { value: 'spotify' }, { value: 'youtube' }]} />
            <Button type="primary" onClick={() => void runSearch()} loading={loading}>{t('search')}</Button>
            <Button onClick={() => setOpen(true)}>{t('advanced')}</Button>
          </Space>
        </Header>
        <Content style={{ padding: 16 }}>
          {error && <Alert type="error" message={error} description={t('sourceUnavailable')} showIcon />}
          <Table rowKey="id" columns={columns} dataSource={results} locale={{ emptyText: <Empty description={t('noResult')} /> }} pagination={{ pageSize: 10 }} />
        </Content>
        <Footer>
          <audio controls src={playbackUrl} style={{ width: '100%' }} />
        </Footer>
      </Layout>
      <Drawer title={t('advanced')} open={open} onClose={() => setOpen(false)}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select value={searchParams.quality} onChange={(quality) => setSearchParams({ quality })} placeholder="quality" options={[{ value: 'standard' }, { value: 'high' }, { value: 'lossless' }]} />
          <Input type="number" value={searchParams.limit} onChange={(e) => setSearchParams({ limit: Number(e.target.value) })} placeholder="limit" />
        </Space>
      </Drawer>
    </Layout>
  );
}
