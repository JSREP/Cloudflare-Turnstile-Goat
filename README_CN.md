# 🔐 Cloudflare Turnstile Goat

[![在线演示](https://img.shields.io/badge/🌐_在线演示-https://cloudflare--turnstile.jsrei.org/-blue?style=for-the-badge)](https://cloudflare-turnstile.jsrei.org/)
[![Docker Hub](https://img.shields.io/badge/🐳_Docker_Hub-jsreidockerhub/cloudflare--turnstile--goat-blue?style=for-the-badge)](https://hub.docker.com/r/jsreidockerhub/cloudflare-turnstile-goat)
[![许可证](https://img.shields.io/badge/📄_许可证-MIT-green?style=for-the-badge)](LICENSE)

> **🚀 [体验在线演示](https://cloudflare-turnstile.jsrei.org/)** - 亲身体验 Cloudflare Turnstile CAPTCHA 集成效果！

一个演示 **Cloudflare Turnstile CAPTCHA** 集成的完整 Web 应用程序。

## 🌟 项目概述

本项目是一个完整的 Cloudflare Turnstile 验证演示应用，包含：
- **前端**：纯原生 HTML/CSS/JavaScript 实现
- **后端**：Python Flask API 与强大的验证功能
- **功能**：完整的 Turnstile 验证工作流程和交互式调试界面

## ✨ 核心特性

- 🛡️ **安全防护**：有效防止机器人攻击和暴力破解
- 🎯 **用户体验**：无需点击图片验证，一键完成验证
- 🔧 **易于集成**：简单的 API 接口，几行代码即可集成
- 📊 **实时监控**：详细的验证日志和状态监控
- 🐳 **Docker 就绪**：容器化应用，便于部署
- 🌍 **多架构支持**：支持 AMD64、ARM64 等多种平台

## 🏗️ 项目结构

```
Cloudflare-Turnstile-Goat/
├── backend/                 # Python Flask 后端
│   ├── app.py              # 主应用文件
│   ├── config.py           # 配置文件
│   ├── requirements.txt    # Python 依赖
│   ├── .env                # 环境变量
│   └── utils/
│       └── turnstile.py    # Turnstile 验证工具
├── frontend/               # 前端静态文件
│   ├── index.html          # 主页面
│   ├── login.html          # 登录页面
│   ├── css/                # 样式表
│   │   ├── main.css        # 主样式
│   │   ├── login.css       # 登录页面样式
│   │   └── components.css  # 组件样式
│   └── js/                 # JavaScript 文件
│       ├── main.js         # 主脚本
│       └── login.js        # 登录页面脚本
├── Dockerfile              # Docker 配置
├── docker-compose.yml      # Docker Compose 设置
└── README.md               # 项目文档
```

## 🚀 快速开始

### 方式一：Docker（推荐）

```bash
# 拉取并运行容器
docker run -p 59623:59623 jsreidockerhub/cloudflare-turnstile-goat:latest

# 或使用自定义环境变量
docker run -p 59623:59623 \
  -e TURNSTILE_SITE_KEY=你的站点密钥 \
  -e TURNSTILE_SECRET_KEY=你的秘密密钥 \
  jsreidockerhub/cloudflare-turnstile-goat:latest
```

### 方式二：本地开发

#### 1. 环境要求

- Python 3.11+
- 现代浏览器（支持 ES6+）

#### 2. 安装依赖

```bash
# 进入后端目录
cd backend

# 安装 Python 依赖
pip install -r requirements.txt
```

#### 3. 配置环境变量

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置 Turnstile 密钥：
```env
# Cloudflare Turnstile 配置
TURNSTILE_SITE_KEY=你的站点密钥
TURNSTILE_SECRET_KEY=你的秘密密钥
```

> **注意**：项目默认使用 Cloudflare 提供的测试密钥，适用于开发和演示。生产环境请替换为真实密钥。

#### 4. 启动应用

```bash
# 启动后端服务
cd backend
python app.py
```

启动后访问：
- **主页面**：http://127.0.0.1:59623/
- **登录页面**：http://127.0.0.1:59623/login.html

## 📖 使用指南

### 演示账号

- **用户名**：`admin`
- **密码**：`password`

### 验证流程

1. 访问登录页面
2. 输入用户名和密码
3. 完成 Turnstile CAPTCHA 验证
4. 点击登录按钮
5. 查看验证结果和调试信息

## 🔌 API 接口

### 获取配置
```http
GET /api/config
```
返回 Turnstile 站点密钥和配置信息。

### 验证 Turnstile Token
```http
POST /api/verify
Content-Type: application/json

{
  "token": "turnstile_token"
}
```

### 用户登录
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "token": "turnstile_token"
}
```

## ⚙️ Turnstile 配置

### 获取密钥

1. 访问 [Cloudflare 控制台](https://dash.cloudflare.com/)
2. 选择你的域名
3. 进入 "Security" > "Turnstile"
4. 创建新的站点密钥
5. 复制站点密钥和秘密密钥

### 测试密钥

项目默认使用以下测试密钥：
- **站点密钥**：`1x00000000000000000000AA`
- **秘密密钥**：`1x0000000000000000000000000000000AA`

这些密钥仅用于开发和测试，会始终返回成功结果。

## 🛠️ 开发指南

### 前端架构

- **HTML**：语义化结构，遵循 Web 标准
- **CSS**：模块化样式，遵循 UI 设计四原则
- **JavaScript**：ES6+ 语法，模块化设计

### 后端架构

- **Flask**：轻量级 Web 框架
- **模块化设计**：配置和工具类分离
- **错误处理**：完善的异常处理机制
- **日志记录**：详细的操作日志

### UI 设计原则

1. **亲密性**：相关元素放得近，无关元素分开排
2. **对齐**：所有元素要对齐，左中右都要整齐
3. **重复**：同样样式重复用，颜色字体要统一
4. **对比**：重要内容要突出，大小颜色差别大

## 🔒 安全考虑

- ✅ 服务端验证 Turnstile token
- ✅ 用户 IP 地址验证
- ✅ 请求超时处理
- ✅ 错误信息脱敏
- ✅ CORS 安全配置

## 🐛 故障排除

### 常见问题

1. **Turnstile 组件不显示**
   - 检查网络连接
   - 确认站点密钥配置正确
   - 查看浏览器控制台错误

2. **验证失败**
   - 检查秘密密钥配置
   - 确认服务器时间正确
   - 查看后端日志

3. **CORS 错误**
   - 检查 CORS_ORIGINS 配置
   - 确认请求域名在允许列表中

### 调试模式

启用调试模式查看详细日志：
```env
FLASK_DEBUG=true
```

## 🏗️ 支持的架构

Docker 镜像支持多种架构：
- `linux/amd64`（Intel/AMD 64位）
- `linux/arm64`（ARM 64位 - Apple M1/M2、AWS Graviton 等）
- `linux/arm/v7`（ARM 32位 - 树莓派4等）
- `linux/arm/v6`（ARM 32位 - 树莓派Zero等）
- `linux/ppc64le`（PowerPC 64位小端 - IBM Power 系统）
- `linux/s390x`（IBM Z - IBM 大型机架构）

## 📚 学习内容

- 如何集成 Cloudflare Turnstile CAPTCHA
- 后端 API 验证技术
- 前端 CAPTCHA 处理
- CAPTCHA 实现的安全最佳实践
- Web 应用的 Docker 容器化

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献

欢迎贡献！请随时提交 Issues 和 Pull Requests。

## 📞 联系方式

如有问题，请通过 GitHub Issues 联系我们。

---

**[🌐 体验在线演示](https://cloudflare-turnstile.jsrei.org/)** | **[📖 English Documentation](README.md)**
