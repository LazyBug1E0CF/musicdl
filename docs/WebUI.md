# WebUI 部署指南

## 一键启动（Docker Compose）
```bash
docker compose up -d --build
```

访问：
- UI: `http://localhost:8080`
- API: `http://localhost:8000`
- 健康检查: `GET /healthz`
- 就绪检查: `GET /readyz`

## 本地开发

### API
```bash
pip install -r requirements.txt -r webapi/requirements.txt
uvicorn webapi.app:app --reload --port 8000
```

### UI
当前示例使用静态构建产物 `ui/dist`，可替换为你自己的前端构建结果。

## 生产部署

### 方案 A：单体部署（FastAPI 托管前端）
将前端构建产物放到 `ui/dist/`，FastAPI 会通过 `StaticFiles` 在根路径自动托管。

### 方案 B：分离部署（Nginx + API）
参考 `deploy/nginx/default.conf`：
- `/` 提供静态前端
- `/api/*` 反向代理至 `api:8000`
- `/healthz` 和 `/readyz` 透传到 API

## 安全配置说明
- CORS 白名单：`CORS_ALLOW_ORIGINS`
- 速率限制：`RATE_LIMIT_REQUESTS` + `RATE_LIMIT_WINDOW_SECONDS`
- 请求体限制：`MAX_BODY_BYTES`
- 请求超时：`APP_TIMEOUT_SECONDS`
- 下载目录白名单：限制到 `DOWNLOAD_ROOT`
- 文件名清洗：仅保留 `[a-zA-Z0-9._-]`

## 常见故障排查
1. **429 Too Many Requests**
   - 提升 `RATE_LIMIT_REQUESTS` 或延长窗口。
2. **413 Request Entity Too Large**
   - 调大 `MAX_BODY_BYTES`。
3. **504 request timeout**
   - 调大 `APP_TIMEOUT_SECONDS`。
4. **readyz 非 ready**
   - 检查 `DOWNLOAD_ROOT` 挂载和写权限。
5. **路径错误/穿越拦截**
   - 避免使用 `../`，并确认文件名不含非法字符。
