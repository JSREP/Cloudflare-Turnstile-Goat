# 配置说明

本项目使用统一的配置系统，支持两种配置方式：

## 配置优先级

1. **config.yml文件** (最高优先级)
2. **环境变量** (中等优先级)  
3. **默认值** (最低优先级)

## 配置方式

### 方式1：使用config.yml文件（推荐用于开发环境）

在`backend/`目录下创建`config.yml`文件：

```yaml
flask:
  secret_key: "your-secret-key-here"
  debug: true
  host: "127.0.0.1"
  port: 5000

turnstile:
  site_key: "your-site-key"
  secret_key: "your-secret-key"
  verify_url: "https://challenges.cloudflare.com/turnstile/v0/siteverify"

cors:
  origins:
    - "http://localhost:3000"
    - "http://127.0.0.1:5000"
```

### 方式2：使用环境变量（推荐用于生产环境）

```bash
# Flask配置
export SECRET_KEY="your-secret-key-here"
export FLASK_DEBUG="false"
export FLASK_HOST="0.0.0.0"
export FLASK_PORT="59623"
export FLASK_ENV="production"

# Cloudflare Turnstile配置
export TURNSTILE_SITE_KEY="your-site-key"
export TURNSTILE_SECRET_KEY="your-secret-key"

# CORS配置
export CORS_ORIGINS="https://yourdomain.com,http://yourdomain.com"
```

### Docker部署示例

```bash
docker run -d \
  --name cloudflare-turnstile-goat \
  --restart unless-stopped \
  -p 59623:59623 \
  -e FLASK_ENV=production \
  -e FLASK_DEBUG=false \
  -e FLASK_HOST=0.0.0.0 \
  -e FLASK_PORT=59623 \
  -e TURNSTILE_SITE_KEY=your-actual-site-key \
  -e TURNSTILE_SECRET_KEY=your-actual-secret-key \
  -e CORS_ORIGINS=https://yourdomain.com,http://yourdomain.com \
  jsreidockerhub/cloudflare-turnstile-goat:latest
```

## 配置项说明

### Flask配置
- `SECRET_KEY`: Flask应用密钥，用于会话加密
- `FLASK_DEBUG`: 是否启用调试模式 (true/false)
- `FLASK_HOST`: 监听地址 (默认: 127.0.0.1)
- `FLASK_PORT`: 监听端口 (默认: 59623)
- `FLASK_ENV`: 运行环境 (development/production)

### Cloudflare Turnstile配置
- `TURNSTILE_SITE_KEY`: Cloudflare Turnstile站点密钥
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile私钥
- `TURNSTILE_VERIFY_URL`: 验证API地址 (通常不需要修改)

### CORS配置
- `CORS_ORIGINS`: 允许的跨域来源，多个用逗号分隔

## 安全注意事项

1. **config.yml文件包含敏感信息，已被.gitignore排除，不会提交到版本控制**
2. **生产环境建议使用环境变量而不是config.yml文件**
3. **Docker镜像中不包含任何敏感配置信息，所有配置在运行时传递**
4. **测试密钥仅用于开发和演示，生产环境必须使用真实密钥**

## 测试密钥

开发和测试时可以使用Cloudflare官方提供的测试密钥：

### 推荐的测试密钥（总是通过验证）
- **Site Key**: `1x00000000000000000000AA`
- **Secret Key**: `1x0000000000000000000000000000000AA`

### 其他可用的测试密钥
- **总是阻止验证**:
  - Site Key: `2x00000000000000000000AB`
  - Secret Key: `2x0000000000000000000000000000000AA`
- **强制交互式挑战**:
  - Site Key: `3x00000000000000000000FF`
  - Secret Key: `3x0000000000000000000000000000000AA`

### 测试密钥特点
- 可以在任何域名使用，包括 `localhost`
- 会产生 `XXXX.DUMMY.TOKEN.XXXX` 响应令牌
- 仅用于开发和测试，生产环境必须使用真实密钥
