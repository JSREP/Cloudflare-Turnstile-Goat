# 🔐 Cloudflare Turnstile Goat

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-https://cloudflare--turnstile.jsrei.org/-blue?style=for-the-badge)](https://cloudflare-turnstile.jsrei.org/)
[![Docker Hub](https://img.shields.io/badge/🐳_Docker_Hub-jsreidockerhub/cloudflare--turnstile--goat-blue?style=for-the-badge)](https://hub.docker.com/r/jsreidockerhub/cloudflare-turnstile-goat)
[![License](https://img.shields.io/badge/📄_License-MIT-green?style=for-the-badge)](LICENSE)

> **🚀 [Try the Live Demo](https://cloudflare-turnstile.jsrei.org/)** - Experience Cloudflare Turnstile CAPTCHA integration in action!

A comprehensive demonstration application showcasing **Cloudflare Turnstile CAPTCHA** integration with a complete web stack.

## 🌟 Project Overview

This project is a complete Cloudflare Turnstile verification demonstration application featuring:
- **Frontend**: Pure vanilla HTML/CSS/JavaScript implementation
- **Backend**: Python Flask API with robust validation
- **Features**: Complete Turnstile verification workflow with interactive debug interface

## ✨ Key Features

- 🛡️ **Security Protection**: Effectively prevents bot attacks and brute force attempts
- 🎯 **User Experience**: No image clicking required - one-click verification completion
- 🔧 **Easy Integration**: Simple API interface, integrate with just a few lines of code
- 📊 **Real-time Monitoring**: Detailed verification logs and status monitoring
- 🐳 **Docker Ready**: Containerized application for easy deployment
- 🌍 **Multi-Architecture**: Supports AMD64, ARM64, and more platforms

## 🏗️ Project Structure

```
Cloudflare-Turnstile-Goat/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main application file
│   ├── config.py           # Configuration file
│   ├── requirements.txt    # Python dependencies
│   ├── .env                # Environment variables
│   └── utils/
│       └── turnstile.py    # Turnstile verification utilities
├── frontend/               # Frontend static files
│   ├── index.html          # Main page
│   ├── login.html          # Login page
│   ├── css/                # Stylesheets
│   │   ├── main.css        # Main styles
│   │   ├── login.css       # Login page styles
│   │   └── components.css  # Component styles
│   └── js/                 # JavaScript files
│       ├── main.js         # Main script
│       └── login.js        # Login page script
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
└── README.md               # Project documentation
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull and run the container
docker run -p 59623:59623 jsreidockerhub/cloudflare-turnstile-goat:latest

# Or with custom environment variables
docker run -p 59623:59623 \
  -e TURNSTILE_SITE_KEY=your_site_key \
  -e TURNSTILE_SECRET_KEY=your_secret_key \
  jsreidockerhub/cloudflare-turnstile-goat:latest
```

### Option 2: Local Development

#### 1. Prerequisites

- Python 3.11+
- Modern browser (ES6+ support)

#### 2. Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt
```

#### 3. Configure Environment Variables

Copy the environment template:
```bash
cp .env.example .env
```

Edit the `.env` file with your Turnstile keys:
```env
# Cloudflare Turnstile Configuration
TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

> **Note**: The project uses Cloudflare's test keys by default, suitable for development and demonstration. Replace with real keys for production.

#### 4. Start the Application

```bash
# Start the backend service
cd backend
python app.py
```

After startup, visit:
- **Main Page**: http://127.0.0.1:59623/
- **Login Page**: http://127.0.0.1:59623/login.html

## 📖 Usage Guide

### Demo Credentials

- **Username**: `admin`
- **Password**: `password`

### Verification Workflow

1. Visit the login page
2. Enter username and password
3. Complete Turnstile CAPTCHA verification
4. Click the login button
5. View verification results and debug information

## 🔌 API Endpoints

### Get Configuration
```http
GET /api/config
```
Returns the Turnstile site key and configuration.

### Verify Turnstile Token
```http
POST /api/verify
Content-Type: application/json

{
  "token": "turnstile_token"
}
```

### User Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password",
  "token": "turnstile_token"
}
```

## ⚙️ Turnstile Configuration

### Getting Your Keys

1. Visit the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain
3. Navigate to "Security" > "Turnstile"
4. Create a new site key
5. Copy the Site Key and Secret Key

### Test Keys

The project uses the following test keys by default:
- **Site Key**: `1x00000000000000000000AA`
- **Secret Key**: `1x0000000000000000000000000000000AA`

These keys are for development and testing only and will always return successful results.

## 🛠️ Development Guide

### Frontend Architecture

- **HTML**: Semantic structure following web standards
- **CSS**: Modular styles following the four UI design principles
- **JavaScript**: ES6+ syntax with modular design

### Backend Architecture

- **Flask**: Lightweight web framework
- **Modular Design**: Separated configuration and utility classes
- **Error Handling**: Comprehensive exception handling mechanisms
- **Logging**: Detailed operation logs

### UI Design Principles

1. **Proximity**: Related elements close together, unrelated elements separated
2. **Alignment**: All elements properly aligned, left, center, or right
3. **Repetition**: Consistent styles, unified colors and fonts
4. **Contrast**: Important content stands out with size and color differences

## 🔒 Security Considerations

- ✅ Server-side Turnstile token verification
- ✅ User IP address validation
- ✅ Request timeout handling
- ✅ Error message sanitization
- ✅ CORS security configuration

## 🐛 Troubleshooting

### Common Issues

1. **Turnstile Widget Not Displaying**
   - Check network connection
   - Verify Site Key configuration
   - Check browser console for errors

2. **Verification Failures**
   - Check Secret Key configuration
   - Ensure server time is correct
   - Review backend logs

3. **CORS Errors**
   - Check CORS_ORIGINS configuration
   - Ensure request domain is in the allowlist

### Debug Mode

Enable debug mode for detailed logs:
```env
FLASK_DEBUG=true
```

## 🏗️ Supported Architectures

The Docker image supports multiple architectures:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit - Apple M1/M2, AWS Graviton, etc.)
- `linux/arm/v7` (ARM 32-bit - Raspberry Pi 4, etc.)
- `linux/arm/v6` (ARM 32-bit - Raspberry Pi Zero, etc.)
- `linux/ppc64le` (PowerPC 64-bit Little Endian - IBM Power systems)
- `linux/s390x` (IBM Z - IBM mainframe architecture)

## 📚 What You'll Learn

- How to integrate Cloudflare Turnstile CAPTCHA
- Backend API validation techniques
- Frontend CAPTCHA handling
- Security best practices for CAPTCHA implementation
- Docker containerization for web applications

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit Issues and Pull Requests.

## 📞 Contact

If you have any questions, please contact us through GitHub Issues.

---

**[🌐 Try the Live Demo](https://cloudflare-turnstile.jsrei.org/)** | **[📖 中文文档](README_CN.md)**
