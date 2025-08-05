#!/bin/bash

# Git仓库安全检查脚本
# 用于检查是否有敏感信息被意外提交

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 敏感信息模式列表
SENSITIVE_PATTERNS=(
    "0x4AAAAAABodZYC2HV6mFO1w"
    "0x4AAAAAABodZQ2juDBYU1JOTK6ImxqpruI"
    "cloudflare-turnstile\.jsrei\.org"
    "107\.175\.69\.179"
    "8\.130\.35\.126"
    "ssh.*rsa"
    "BEGIN.*PRIVATE.*KEY"
    "-----BEGIN.*PRIVATE.*KEY-----"
    "password\s*=\s*['\"][^'\"]+['\"]"
    "secret\s*=\s*['\"][^'\"]+['\"]"
    "api_key\s*=\s*['\"][^'\"]+['\"]"
    "token\s*=\s*['\"][^'\"]+['\"]"
)

# 检查工作目录中的敏感信息
check_working_directory() {
    log_info "检查工作目录中的敏感信息..."
    
    local found=false
    
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if grep -r -E "$pattern" . --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=venv --exclude-dir=__pycache__ 2>/dev/null; then
            log_error "发现敏感信息模式: $pattern"
            found=true
        fi
    done
    
    if [ "$found" = false ]; then
        log_info "工作目录检查通过，未发现敏感信息"
    else
        log_error "工作目录中发现敏感信息，请清理后再提交"
        return 1
    fi
}

# 检查Git历史记录中的敏感信息
check_git_history() {
    log_info "检查Git历史记录中的敏感信息..."
    
    local found=false
    
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if git log -p --all | grep -E "$pattern" >/dev/null 2>&1; then
            log_error "Git历史记录中发现敏感信息模式: $pattern"
            found=true
        fi
    done
    
    if [ "$found" = false ]; then
        log_info "Git历史记录检查通过，未发现敏感信息"
    else
        log_error "Git历史记录中发现敏感信息，需要使用git filter-repo清理"
        return 1
    fi
}

# 检查暂存区中的敏感信息
check_staged_files() {
    log_info "检查暂存区中的敏感信息..."
    
    local found=false
    
    # 获取暂存的文件
    local staged_files=$(git diff --cached --name-only)
    
    if [ -z "$staged_files" ]; then
        log_info "暂存区为空，跳过检查"
        return 0
    fi
    
    for file in $staged_files; do
        if [ -f "$file" ]; then
            for pattern in "${SENSITIVE_PATTERNS[@]}"; do
                if grep -E "$pattern" "$file" >/dev/null 2>&1; then
                    log_error "暂存文件 $file 中发现敏感信息模式: $pattern"
                    found=true
                fi
            done
        fi
    done
    
    if [ "$found" = false ]; then
        log_info "暂存区检查通过，未发现敏感信息"
    else
        log_error "暂存区中发现敏感信息，请清理后再提交"
        return 1
    fi
}

# 主函数
main() {
    log_info "开始Git仓库安全检查..."
    
    local exit_code=0
    
    # 检查工作目录
    if ! check_working_directory; then
        exit_code=1
    fi
    
    # 检查暂存区
    if ! check_staged_files; then
        exit_code=1
    fi
    
    # 检查Git历史记录
    if ! check_git_history; then
        exit_code=1
    fi
    
    if [ $exit_code -eq 0 ]; then
        log_info "✅ 安全检查通过，未发现敏感信息"
    else
        log_error "❌ 安全检查失败，发现敏感信息"
        echo ""
        echo "建议的修复步骤："
        echo "1. 清理工作目录和暂存区中的敏感信息"
        echo "2. 如果Git历史记录中有敏感信息，使用以下命令清理："
        echo "   git filter-repo --replace-text <(echo 'sensitive-info==>safe-placeholder')"
        echo "3. 强制推送清理后的历史记录："
        echo "   git push --force origin main"
    fi
    
    exit $exit_code
}

# 执行主函数
main "$@"
