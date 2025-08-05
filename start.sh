#!/bin/bash

# Cloudflare Turnstile Goat - 一键启动脚本
# 功能：启动前端和后端服务，确保单实例运行

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="Cloudflare-Turnstile-Goat"
BACKEND_DIR="backend"
BACKEND_SCRIPT="app.py"
CONFIG_FILE="$BACKEND_DIR/config.yml"
CONFIG_EXAMPLE="$BACKEND_DIR/config.yml.example"
REQUIREMENTS_FILE="$BACKEND_DIR/requirements.txt"
VENV_DIR="$BACKEND_DIR/venv"
PID_FILE=".app.pid"
LOG_FILE="app.log"
DEFAULT_PORT=59623  # 默认端口，会从配置文件中读取实际端口

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "命令 '$1' 未找到，请先安装"
        return 1
    fi
    return 0
}

# 检查Python环境和虚拟环境
check_python() {
    log_info "检查Python环境..."

    # 检查虚拟环境
    if [ -d "$VENV_DIR" ]; then
        log_success "找到虚拟环境: $VENV_DIR"
        # 激活虚拟环境
        source "$VENV_DIR/bin/activate"
        PYTHON_CMD="python"
        PIP_CMD="pip"
    else
        log_info "虚拟环境不存在，检查系统Python..."
        if check_command python3; then
            PYTHON_CMD="python3"
            PIP_CMD="python3 -m pip"
        elif check_command python; then
            PYTHON_CMD="python"
            PIP_CMD="python -m pip"
        else
            log_error "Python未安装，请先安装Python 3.7+"
            exit 1
        fi
    fi

    # 检查Python版本
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
    log_success "使用Python: $PYTHON_VERSION"
}

# 检查并创建配置文件
check_config() {
    log_info "检查配置文件..."

    if [ ! -f "$CONFIG_FILE" ]; then
        if [ -f "$CONFIG_EXAMPLE" ]; then
            log_warning "配置文件不存在，从示例文件创建..."
            cp "$CONFIG_EXAMPLE" "$CONFIG_FILE"
            log_success "配置文件已创建: $CONFIG_FILE"
        else
            log_error "配置文件和示例文件都不存在: $CONFIG_FILE"
            exit 1
        fi
    else
        log_success "配置文件已存在: $CONFIG_FILE"
    fi

    # 读取配置文件中的端口
    if command -v python3 &> /dev/null || command -v python &> /dev/null; then
        ACTUAL_PORT=$(python3 -c "
import yaml
try:
    with open('$CONFIG_FILE', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
        print(config.get('flask', {}).get('port', $DEFAULT_PORT))
except:
    print($DEFAULT_PORT)
" 2>/dev/null || echo $DEFAULT_PORT)

        if [ "$ACTUAL_PORT" != "$DEFAULT_PORT" ]; then
            log_info "从配置文件读取到端口: $ACTUAL_PORT"
            DEFAULT_PORT=$ACTUAL_PORT
        fi
    fi
}

# 安装Python依赖
install_dependencies() {
    log_info "检查Python依赖..."

    if [ -f "$REQUIREMENTS_FILE" ]; then
        log_info "安装Python依赖..."
        if [ -d "$VENV_DIR" ]; then
            # 在虚拟环境中安装
            $PIP_CMD install -r "$REQUIREMENTS_FILE" --quiet
        else
            # 系统环境中安装，使用--user标志
            $PIP_CMD install -r "$REQUIREMENTS_FILE" --user --quiet
        fi
        log_success "Python依赖安装完成"
    else
        log_warning "requirements.txt文件不存在，跳过依赖安装"
    fi
}

# 查找并杀死已运行的进程
kill_existing_processes() {
    log_info "检查已运行的进程..."
    
    # 方法1: 通过PID文件
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log_warning "发现已运行的进程 (PID: $OLD_PID)，正在停止..."
            kill "$OLD_PID" 2>/dev/null || true
            sleep 2
            
            # 如果进程仍在运行，强制杀死
            if ps -p "$OLD_PID" > /dev/null 2>&1; then
                log_warning "强制杀死进程 (PID: $OLD_PID)"
                kill -9 "$OLD_PID" 2>/dev/null || true
            fi
            log_success "旧进程已停止"
        fi
        rm -f "$PID_FILE"
    fi
    
    # 方法2: 通过端口查找进程
    PORT_PID=$(lsof -ti:$DEFAULT_PORT 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        log_warning "发现占用端口 $DEFAULT_PORT 的进程 (PID: $PORT_PID)，正在停止..."
        kill "$PORT_PID" 2>/dev/null || true
        sleep 2
        
        # 检查是否还在运行
        if lsof -ti:$DEFAULT_PORT > /dev/null 2>&1; then
            log_warning "强制杀死占用端口的进程"
            kill -9 "$PORT_PID" 2>/dev/null || true
        fi
        log_success "端口 $DEFAULT_PORT 已释放"
    fi
    
    # 方法3: 通过进程名查找
    PYTHON_PIDS=$(pgrep -f "$BACKEND_SCRIPT" 2>/dev/null || true)
    if [ -n "$PYTHON_PIDS" ]; then
        log_warning "发现相关Python进程，正在停止..."
        echo "$PYTHON_PIDS" | xargs kill 2>/dev/null || true
        sleep 2
        
        # 强制杀死仍在运行的进程
        REMAINING_PIDS=$(pgrep -f "$BACKEND_SCRIPT" 2>/dev/null || true)
        if [ -n "$REMAINING_PIDS" ]; then
            log_warning "强制杀死剩余进程"
            echo "$REMAINING_PIDS" | xargs kill -9 2>/dev/null || true
        fi
        log_success "相关进程已清理"
    fi
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    cd "$BACKEND_DIR"
    
    # 启动Flask应用
    nohup $PYTHON_CMD "$BACKEND_SCRIPT" > "../$LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    
    cd ..
    
    # 保存PID
    echo "$BACKEND_PID" > "$PID_FILE"
    log_success "后端服务已启动 (PID: $BACKEND_PID)"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 3
    
    # 验证服务是否正常启动
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        log_success "后端服务运行正常"
    else
        log_error "后端服务启动失败，请检查日志: $LOG_FILE"
        exit 1
    fi
}

# 验证服务状态
verify_service() {
    log_info "验证服务状态..."
    
    # 等待服务完全启动
    sleep 2
    
    # 检查端口是否监听
    if lsof -ti:$DEFAULT_PORT > /dev/null 2>&1; then
        log_success "服务正在监听端口 $DEFAULT_PORT"
    else
        log_error "服务未能正常监听端口 $DEFAULT_PORT"
        log_error "请检查日志文件: $LOG_FILE"
        exit 1
    fi
    
    # 尝试HTTP请求验证
    if command -v curl &> /dev/null; then
        if curl -s "http://127.0.0.1:$DEFAULT_PORT/" > /dev/null; then
            log_success "HTTP服务响应正常"
        else
            log_warning "HTTP服务可能未完全启动，请稍后访问"
        fi
    fi
}

# 显示启动信息
show_info() {
    echo ""
    echo "======================================"
    log_success "$PROJECT_NAME 启动成功！"
    echo "======================================"
    echo ""
    echo "🌐 访问地址："
    echo "   主页:     http://127.0.0.1:$DEFAULT_PORT/"
    echo "   登录页:   http://127.0.0.1:$DEFAULT_PORT/login.html"
    echo ""
    echo "📊 服务信息："
    echo "   PID文件:  $PID_FILE"
    echo "   日志文件: $LOG_FILE"
    echo "   配置文件: $CONFIG_FILE"
    echo ""
    echo "🛠️  管理命令："
    echo "   查看日志: tail -f $LOG_FILE"
    echo "   停止服务: ./stop.sh (如果存在) 或 kill \$(cat $PID_FILE)"
    echo ""
    echo "💡 演示账号："
    echo "   用户名: admin"
    echo "   密码:   password"
    echo ""
    echo "======================================"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -v, --verbose  详细输出模式"
    echo "  -q, --quiet    静默模式（仅显示错误）"
    echo "  --no-deps      跳过依赖安装"
    echo "  --force        强制重启（即使没有检测到旧进程）"
    echo ""
    echo "示例:"
    echo "  $0              # 正常启动"
    echo "  $0 -v           # 详细模式启动"
    echo "  $0 --no-deps    # 跳过依赖安装"
    echo ""
}

# 解析命令行参数
parse_args() {
    VERBOSE=false
    QUIET=false
    NO_DEPS=false
    FORCE=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            --no-deps)
                NO_DEPS=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 主函数
main() {
    # 解析命令行参数
    parse_args "$@"

    if [ "$QUIET" != "true" ]; then
        echo ""
        log_info "开始启动 $PROJECT_NAME..."
        echo ""
    fi

    # 检查运行环境
    check_python

    # 检查配置文件
    check_config

    # 安装依赖
    if [ "$NO_DEPS" != "true" ]; then
        install_dependencies
    else
        log_info "跳过依赖安装 (--no-deps)"
    fi

    # 清理旧进程
    kill_existing_processes

    # 启动后端服务
    start_backend

    # 验证服务
    verify_service

    # 显示启动信息
    if [ "$QUIET" != "true" ]; then
        show_info
    else
        echo "服务已启动: http://127.0.0.1:$DEFAULT_PORT/"
    fi
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
