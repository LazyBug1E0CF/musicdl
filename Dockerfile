# Stage 1: Build web UI
FROM node:24-alpine AS ui-build
WORKDIR /app
COPY webui/package.json webui/package-lock.json ./
RUN npm ci
COPY webui/ ./
RUN npm run build

# Stage 2: Python runtime with UI served by API
FROM python:3.12-slim
WORKDIR /app

# Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN pip install --no-cache-dir -e . && pip install --no-cache-dir -r webapi/requirements.txt

# Pre-built UI static files
COPY --from=ui-build /app/dist ui/dist

EXPOSE 8000
CMD ["uvicorn", "webapi.app:app", "--host", "0.0.0.0", "--port", "8000"]
