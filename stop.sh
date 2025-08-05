#!/bin/bash

# Cloudflare Turnstile Goat - 停止脚本
# 功能：停止所有相关的前端和后端服务

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
PID_FILE=".app.pid"
LOG_FILE="app.log"
DEFAULT_PORT=52669  # 默认端口，会从配置文件中读取实际端口

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

# 读取配置文件中的端口
read_port_from_config() {
    if [ -f "$CONFIG_FILE" ] && command -v python3 &> /dev/null; then
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
            DEFAULT_PORT=$ACTUAL_PORT
        fi
    fi
}

# 停止进程的函数
stop_processes() {
    local stopped_any=false
    
    log_info "正在停止 $PROJECT_NAME 服务..."
    
    # 方法1: 通过PID文件停止
    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if ps -p "$OLD_PID" > /dev/null 2>&1; then
            log_info "通过PID文件停止进程 (PID: $OLD_PID)..."
            kill "$OLD_PID" 2>/dev/null || true
            sleep 2
            
            # 如果进程仍在运行，强制杀死
            if ps -p "$OLD_PID" > /dev/null 2>&1; then
                log_warning "强制杀死进程 (PID: $OLD_PID)"
                kill -9 "$OLD_PID" 2>/dev/null || true
            fi
            log_success "进程已停止 (PID: $OLD_PID)"
            stopped_any=true
        else
            log_warning "PID文件中的进程已不存在 (PID: $OLD_PID)"
        fi
        rm -f "$PID_FILE"
        log_info "已删除PID文件"
    fi
    
    # 方法2: 通过端口查找并停止进程
    PORT_PID=$(lsof -ti:$DEFAULT_PORT 2>/dev/null || true)
    if [ -n "$PORT_PID" ]; then
        log_info "停止占用端口 $DEFAULT_PORT 的进程 (PID: $PORT_PID)..."
        kill "$PORT_PID" 2>/dev/null || true
        sleep 2
        
        # 检查是否还在运行
        if lsof -ti:$DEFAULT_PORT > /dev/null 2>&1; then
            log_warning "强制杀死占用端口的进程"
            kill -9 "$PORT_PID" 2>/dev/null || true
        fi
        log_success "端口 $DEFAULT_PORT 已释放"
        stopped_any=true
    fi
    
    # 方法3: 通过进程名查找并停止
    PYTHON_PIDS=$(pgrep -f "$BACKEND_SCRIPT" 2>/dev/null || true)
    if [ -n "$PYTHON_PIDS" ]; then
        log_info "停止相关Python进程..."
        echo "$PYTHON_PIDS" | while read -r pid; do
            if ps -p "$pid" > /dev/null 2>&1; then
                log_info "停止进程 (PID: $pid)"
                kill "$pid" 2>/dev/null || true
            fi
        done
        sleep 2
        
        # 强制杀死仍在运行的进程
        REMAINING_PIDS=$(pgrep -f "$BACKEND_SCRIPT" 2>/dev/null || true)
        if [ -n "$REMAINING_PIDS" ]; then
            log_warning "强制杀死剩余进程"
            echo "$REMAINING_PIDS" | xargs kill -9 2>/dev/null || true
        fi
        log_success "相关进程已清理"
        stopped_any=true
    fi
    
    if [ "$stopped_any" = "true" ]; then
        log_success "所有 $PROJECT_NAME 服务已停止"
    else
        log_info "没有发现运行中的 $PROJECT_NAME 服务"
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -f, --force    强制停止所有相关进程"
    echo "  -c, --clean    停止后清理日志文件"
    echo ""
    echo "示例:"
    echo "  $0              # 正常停止"
    echo "  $0 -f           # 强制停止"
    echo "  $0 -c           # 停止并清理日志"
    echo ""
}

# 清理日志文件
clean_logs() {
    if [ -f "$LOG_FILE" ]; then
        log_info "清理日志文件: $LOG_FILE"
        rm -f "$LOG_FILE"
        log_success "日志文件已清理"
    fi
}

# 解析命令行参数
parse_args() {
    FORCE=false
    CLEAN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -c|--clean)
                CLEAN=true
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
    
    echo ""
    log_info "开始停止 $PROJECT_NAME..."
    echo ""
    
    # 读取配置文件中的端口
    read_port_from_config
    
    # 停止进程
    stop_processes
    
    # 清理日志（如果指定）
    if [ "$CLEAN" = "true" ]; then
        clean_logs
    fi
    
    echo ""
    log_success "$PROJECT_NAME 已完全停止"
    echo ""
    
    # 显示重新启动的提示
    echo "💡 重新启动服务："
    echo "   ./start.sh"
    echo ""
}

# 脚本入口
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
