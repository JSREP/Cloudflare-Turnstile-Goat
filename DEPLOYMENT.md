# Cloudflare Turnstile Goat 部署指南

本项目支持Docker部署，通过Docker Hub进行镜像分发。

## 部署架构

```
本地开发环境 → Docker Hub → 生产服务器
     ↓              ↓           ↓
  构建镜像      →   推送镜像   →  拉取镜像运行
```

## 前置要求

### 本地环境
- Docker Desktop 已安装并运行
- Docker Hub 账号
- 项目源码

### 服务器环境
- Linux 服务器（CentOS/RHEL/Ubuntu等）
- SSH 访问权限
- 80端口可访问

## 部署步骤

### 1. 准备部署脚本

复制示例脚本并修改配置：

```bash
# 复制构建脚本
cp build-and-push.sh.example build-and-push.sh

# 复制部署脚本
cp deploy-server.sh.example deploy-server.sh
```

### 2. 修改配置

编辑 `build-and-push.sh`：
```bash
# 修改Docker Hub用户名
DOCKER_USERNAME="your-dockerhub-username"  # 改为你的用户名
```

编辑 `deploy-server.sh`：
```bash
# 修改Docker Hub用户名
DOCKER_USERNAME="your-dockerhub-username"  # 改为你的用户名

# 修改服务器信息
REMOTE_HOST="root@your-server-ip"  # 改为你的服务器IP
JUMP_HOST="root@your-jump-server-ip"  # 如果有跳板机

# 修改域名
DOMAIN="your-domain.com"  # 改为你的域名
```

### 3. 本地构建和推送

```bash
# 设置执行权限
chmod +x build-and-push.sh deploy-server.sh

# 构建并推送镜像到Docker Hub
./build-and-push.sh
```

脚本会自动：
- 检查本地环境
- 构建Docker镜像
- 本地测试镜像
- 登录Docker Hub
- 推送镜像

### 4. 服务器部署

```bash
# 部署到服务器
./deploy-server.sh
```

脚本会自动：
- 在服务器上安装Docker
- 从Docker Hub拉取镜像
- 启动容器
- 配置nginx反向代理
- 测试部署

## 手动部署

如果不使用脚本，也可以手动部署：

### 本地构建
```bash
# 构建镜像
docker build -t your-username/cloudflare-turnstile-goat:latest .

# 推送到Docker Hub
docker push your-username/cloudflare-turnstile-goat:latest
```

### 服务器部署
```bash
# 拉取镜像
docker pull your-username/cloudflare-turnstile-goat:latest

# 停止旧容器
docker stop cloudflare-turnstile-goat 2>/dev/null || true
docker rm cloudflare-turnstile-goat 2>/dev/null || true

# 启动新容器
docker run -d \
  --name cloudflare-turnstile-goat \
  --restart unless-stopped \
  -p 52669:52669 \
  -e FLASK_ENV=production \
  -e FLASK_DEBUG=false \
  -e FLASK_HOST=0.0.0.0 \
  -e FLASK_PORT=52669 \
  -e TURNSTILE_SITE_KEY=1x00000000000000000000AA \
  -e TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA \
  -e CORS_ORIGINS=https://your-domain.com,http://your-domain.com \
  your-username/cloudflare-turnstile-goat:latest
```

## 环境变量配置

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| FLASK_ENV | production | Flask环境 |
| FLASK_DEBUG | false | 调试模式 |
| FLASK_HOST | 0.0.0.0 | 监听地址 |
| FLASK_PORT | 52669 | 监听端口 |
| TURNSTILE_SITE_KEY | 测试密钥 | Cloudflare Turnstile站点密钥 |
| TURNSTILE_SECRET_KEY | 测试密钥 | Cloudflare Turnstile私钥 |
| CORS_ORIGINS | localhost | 允许的CORS源 |

## 管理命令

### 查看容器状态
```bash
docker ps
docker logs cloudflare-turnstile-goat
```

### 重启服务
```bash
docker restart cloudflare-turnstile-goat
```

### 更新部署
```bash
# 本地推送新版本
./build-and-push.sh

# 服务器更新
./deploy-server.sh
```

### 停止服务
```bash
docker stop cloudflare-turnstile-goat
docker rm cloudflare-turnstile-goat
```

## 故障排除

### 容器无法启动
```bash
# 查看容器日志
docker logs cloudflare-turnstile-goat

# 检查容器状态
docker ps -a
```

### 网络访问问题
```bash
# 检查端口监听
ss -tlnp | grep 52669

# 检查nginx状态
systemctl status nginx

# 测试本地连接
curl http://localhost:52669/api/config
```

### 权限问题
```bash
# 检查Docker权限
sudo usermod -aG docker $USER

# 重新登录或重启Docker服务
sudo systemctl restart docker
```

## 安全建议

1. **更换默认密钥**：使用真实的Cloudflare Turnstile密钥
2. **使用HTTPS**：配置SSL证书
3. **限制访问**：配置防火墙规则
4. **定期更新**：保持镜像和系统更新
5. **监控日志**：定期检查应用日志

## 生产环境优化

1. **使用多阶段构建**：减小镜像大小
2. **健康检查**：添加容器健康检查
3. **资源限制**：设置内存和CPU限制
4. **日志管理**：配置日志轮转
5. **备份策略**：定期备份配置和数据
