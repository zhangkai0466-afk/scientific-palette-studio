# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend-build

WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MPLBACKEND=Agg \
    MPLCONFIGDIR=/tmp/matplotlib

WORKDIR /app

# Matplotlib needs fonts and its runtime image libraries to render previews.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libfreetype6 libpng16-16 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY src ./src
COPY data ./data
COPY --from=frontend-build /build/frontend/dist ./frontend/dist

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir . \
    && useradd --create-home --uid 10001 --shell /usr/sbin/nologin studio \
    && mkdir -p /app/generated /tmp/matplotlib \
    && chown -R studio:studio /app/generated /tmp/matplotlib

USER studio
EXPOSE 8770

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:8770/api/health', timeout=3).read()" || exit 1

CMD ["uvicorn", "scientific_palette_studio.api:app", "--host", "0.0.0.0", "--port", "8770", "--proxy-headers", "--forwarded-allow-ips=*"]
