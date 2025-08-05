# 配置说明

本项目使用统一的配置系统，支持两种配置方式：

## 快速开始

### 开发环境
1. **复制配置文件**：
   ```bash
   cp backend/config.yml.example backend/config.yml
   ```

2. **直接使用**：
   - 配置文件已包含Cloudflare官方测试密钥
   - 可以直接启动应用进行开发和测试
   - 测试密钥在任何域名（包括localhost）都有效

### 生产环境
1. **获取真实密钥**：
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 创建Turnstile站点并获取真实密钥

2. **配置方式**（推荐使用环境变量）：
   - **方式一**：使用环境变量（推荐，Docker部署必需）
   - **方式二**：修改`backend/config.yml`文件中的密钥

## 配置优先级

1. **环境变量** (最高优先级) - Docker部署时使用
2. **config.yml文件** (中等优先级) - 本地开发时使用
3. **默认值** (最低优先级) - 系统回退值

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

## Docker部署配置

Docker部署时，环境变量会自动覆盖config.yml中的配置：

```bash
# 基本Docker运行（使用镜像内置的config.yml配置）
docker run -p 59623:59623 jsreidockerhub/cloudflare-turnstile-goat:latest

# 使用环境变量覆盖配置（推荐）
docker run -p 59623:59623 \
  -e TURNSTILE_SITE_KEY=your-real-site-key \
  -e TURNSTILE_SECRET_KEY=your-real-secret-key \
  -e CORS_ORIGINS=https://yourdomain.com \
  jsreidockerhub/cloudflare-turnstile-goat:latest
```

### 配置覆盖机制
- **环境变量优先级最高**：Docker运行时的-e参数会覆盖config.yml中的对应配置
- **config.yml作为回退**：镜像内置config.yml提供默认配置
- **灵活部署**：可以只覆盖需要的配置项，其他使用默认值

## 安全注意事项

1. **config.yml文件包含敏感信息，已被.gitignore排除，不会提交到版本控制**
2. **Docker部署强烈建议使用环境变量传递真实密钥**
3. **Docker镜像内置的config.yml只包含测试密钥，生产环境必须通过环境变量覆盖**
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
