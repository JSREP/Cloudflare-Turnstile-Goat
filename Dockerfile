# Cloudflare Turnstile Goat Docker镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt并安装Python依赖
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码（排除敏感文件）
COPY backend/*.py /app/backend/
COPY backend/utils/ /app/backend/utils/
COPY backend/config.yml.example /app/backend/
COPY frontend/ /app/frontend/

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 59623

# 设置默认环境变量（可通过docker run -e覆盖）
ENV FLASK_ENV=production
ENV FLASK_DEBUG=false
ENV FLASK_HOST=0.0.0.0
ENV FLASK_PORT=59623
# 注意：TURNSTILE_SITE_KEY 和 TURNSTILE_SECRET_KEY 需要在运行时通过 -e 参数传递

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:59623/api/config || exit 1

# 启动命令
CMD ["python", "backend/app.py"]
