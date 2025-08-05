# Cloudflare Turnstile Goat

一个演示Cloudflare Turnstile人机验证功能的前后端应用。

## 项目简介

本项目是一个完整的Cloudflare Turnstile验证演示应用，包含：
- 前端：纯原生HTML/CSS/JavaScript实现
- 后端：Python Flask API
- 功能：完整的Turnstile验证流程

## 功能特点

- ✅ **安全防护**: 有效防止机器人攻击和暴力破解
- ✅ **用户体验**: 无需点击图片验证，一键完成验证
- ✅ **易于集成**: 简单的API接口，几行代码即可集成
- ✅ **实时监控**: 详细的验证日志和状态监控

## 项目结构

```
Cloudflare-Turnstile-Goat/
├── backend/                 # Python Flask后端
│   ├── app.py              # 主应用文件
│   ├── config.py           # 配置文件
│   ├── requirements.txt    # Python依赖
│   ├── .env                # 环境变量配置
│   └── utils/
│       └── turnstile.py    # Turnstile验证工具
├── frontend/               # 前端静态文件
│   ├── index.html          # 主页面
│   ├── login.html          # 登录页面
│   ├── css/                # 样式文件
│   │   ├── main.css        # 主样式
│   │   ├── login.css       # 登录页面样式
│   │   └── components.css  # 组件样式
│   └── js/                 # JavaScript文件
│       ├── main.js         # 主脚本
│       └── login.js        # 登录页面脚本
└── README.md               # 项目说明
```

## 快速开始

### 1. 环境要求

- Python 3.7+
- 现代浏览器（支持ES6+）

### 2. 安装依赖

```bash
# 进入后端目录
cd backend

# 安装Python依赖
pip install -r requirements.txt
```

### 3. 配置环境变量

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置Turnstile密钥：
```env
# Cloudflare Turnstile配置
TURNSTILE_SITE_KEY=你的_SITE_KEY
TURNSTILE_SECRET_KEY=你的_SECRET_KEY
```

> **注意**: 项目默认使用Cloudflare提供的测试密钥，适用于开发和演示。生产环境请替换为真实密钥。

### 4. 启动应用

```bash
# 启动后端服务
cd backend
python app.py
```

服务启动后，访问：
- 主页: http://127.0.0.1:5000/frontend/index.html
- 登录页: http://127.0.0.1:5000/frontend/login.html

## 使用说明

### 演示账号

- 用户名: `admin`
- 密码: `password`

### 验证流程

1. 访问登录页面
2. 输入用户名和密码
3. 完成Turnstile人机验证
4. 点击登录按钮
5. 查看验证结果

## API接口

### 获取配置
```
GET /api/config
```

### 验证Turnstile Token
```
POST /api/verify
Content-Type: application/json

{
  "token": "turnstile_token"
}
```

### 用户登录
```
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "token": "turnstile_token"
}
```

## Turnstile配置

### 获取密钥

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的域名
3. 进入 "Security" > "Turnstile"
4. 创建新的站点密钥
5. 复制 Site Key 和 Secret Key

### 测试密钥

项目默认使用以下测试密钥：
- Site Key: `1x00000000000000000000AA`
- Secret Key: `1x0000000000000000000000000000000AA`

这些密钥仅用于开发和测试，会始终返回成功结果。

## 开发说明

### 前端架构

- **HTML**: 语义化结构，遵循Web标准
- **CSS**: 模块化样式，遵循UI设计四原则
- **JavaScript**: ES6+语法，模块化设计

### 后端架构

- **Flask**: 轻量级Web框架
- **模块化**: 配置、工具类分离
- **错误处理**: 完善的异常处理机制
- **日志记录**: 详细的操作日志

### UI设计原则

1. **亲密性**: 相关元素放得近，无关元素分开排
2. **对齐**: 所有元素要对齐，左中右都要整齐
3. **重复**: 同样样式重复用，颜色字体要统一
4. **对比**: 重要内容要突出，大小颜色差别大

## 安全考虑

- ✅ 服务端验证Turnstile token
- ✅ 用户IP地址验证
- ✅ 请求超时处理
- ✅ 错误信息脱敏
- ✅ CORS安全配置

## 故障排除

### 常见问题

1. **Turnstile组件不显示**
   - 检查网络连接
   - 确认Site Key配置正确
   - 查看浏览器控制台错误

2. **验证失败**
   - 检查Secret Key配置
   - 确认服务器时间正确
   - 查看后端日志

3. **CORS错误**
   - 检查CORS_ORIGINS配置
   - 确认请求域名在允许列表中

### 调试模式

启用调试模式查看详细日志：
```env
FLASK_DEBUG=true
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题，请通过GitHub Issues联系。
