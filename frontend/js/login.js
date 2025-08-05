/**
 * 登录页面JavaScript - Turnstile验证和登录功能
 */

class LoginManager {
    constructor() {
        this.turnstileToken = null;
        this.turnstileWidgetId = null;
        this.isSubmitting = false;
        
        this.init();
    }

    /**
     * 初始化登录管理器
     */
    async init() {
        console.log('登录管理器初始化开始');
        
        try {
            // 等待配置加载
            await this.waitForConfig();
            
            // 初始化Turnstile
            this.initTurnstile();
            
            // 初始化表单事件
            this.initFormEvents();
            
            // 初始化模态框事件
            this.initModalEvents();
            
            console.log('登录管理器初始化完成');
        } catch (error) {
            console.error('登录管理器初始化失败:', error);
            Utils.showNotification('页面初始化失败，请刷新重试', 'error');
        }
    }

    /**
     * 等待配置加载完成
     */
    async waitForConfig() {
        let attempts = 0;
        const maxAttempts = 50; // 5秒超时
        
        while (!CONFIG.TURNSTILE.siteKey && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!CONFIG.TURNSTILE.siteKey) {
            throw new Error('配置加载超时');
        }
    }

    /**
     * 初始化Turnstile验证
     */
    initTurnstile() {
        const turnstileElement = document.querySelector('.cf-turnstile');
        if (!turnstileElement) {
            console.error('未找到Turnstile元素');
            return;
        }

        // 设置site key
        turnstileElement.setAttribute('data-sitekey', CONFIG.TURNSTILE.siteKey);
        
        console.log('Turnstile配置:', {
            siteKey: CONFIG.TURNSTILE.siteKey,
            theme: CONFIG.TURNSTILE.theme,
            size: CONFIG.TURNSTILE.size
        });

        // 等待Turnstile脚本加载
        this.waitForTurnstileScript().then(() => {
            this.renderTurnstile();
        });
    }

    /**
     * 等待Turnstile脚本加载
     */
    async waitForTurnstileScript() {
        let attempts = 0;
        const maxAttempts = 100; // 10秒超时
        
        while (typeof window.turnstile === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.turnstile === 'undefined') {
            throw new Error('Turnstile脚本加载失败');
        }
    }

    /**
     * 渲染Turnstile组件
     */
    renderTurnstile() {
        try {
            const turnstileElement = document.querySelector('.cf-turnstile');
            
            this.turnstileWidgetId = window.turnstile.render(turnstileElement, {
                sitekey: CONFIG.TURNSTILE.siteKey,
                theme: CONFIG.TURNSTILE.theme,
                size: CONFIG.TURNSTILE.size,
                callback: (token) => this.onTurnstileSuccess(token),
                'error-callback': (error) => this.onTurnstileError(error),
                'expired-callback': () => this.onTurnstileExpired()
            });
            
            console.log('Turnstile组件渲染成功，Widget ID:', this.turnstileWidgetId);
            this.updateTurnstileStatus('已加载', 'pending');

            // 更新配置信息显示
            this.updateConfigDisplay();

        } catch (error) {
            console.error('Turnstile渲染失败:', error);
            this.updateTurnstileStatus('加载失败', 'error');
            Utils.showNotification('验证组件加载失败，请刷新页面重试', 'error');
        }
    }

    /**
     * Turnstile验证成功回调
     */
    onTurnstileSuccess(token) {
        console.log('Turnstile验证成功，Token:', token);

        this.turnstileToken = token;
        this.updateTurnstileStatus('验证成功', 'success');
        this.updateVerifyTime(new Date().toISOString());
        this.updateTokenPreview(token);

        // 更新验证参数显示
        this.updateVerificationParams(token);

        // 清除Turnstile错误
        this.clearTurnstileError();

        Utils.showNotification('人机验证成功', 'success', 3000);
    }

    /**
     * Turnstile验证错误回调
     */
    onTurnstileError(error) {
        console.error('Turnstile验证错误:', error);
        
        this.turnstileToken = null;
        this.updateTurnstileStatus('验证失败', 'error');
        this.showTurnstileError('验证失败，请重试');
        
        Utils.showNotification('人机验证失败，请重试', 'error');
    }

    /**
     * Turnstile验证过期回调
     */
    onTurnstileExpired() {
        console.log('Turnstile验证已过期');
        
        this.turnstileToken = null;
        this.updateTurnstileStatus('验证过期', 'error');
        this.showTurnstileError('验证已过期，请重新验证');
        
        Utils.showNotification('验证已过期，请重新验证', 'warning');
    }

    /**
     * 初始化表单事件
     */
    initFormEvents() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 输入框事件
        const inputs = loginForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.clearFieldError(input.name);
            });
        });
    }

    /**
     * 处理登录
     */
    async handleLogin() {
        if (this.isSubmitting) return;

        console.log('开始登录流程');
        
        try {
            // 验证表单
            const form = document.getElementById('loginForm');
            const validation = Utils.validateForm(form);
            
            if (!validation.isValid) {
                Utils.showFormErrors(validation.errors);
                Utils.showNotification('请填写完整的登录信息', 'warning');
                return;
            }

            // 验证Turnstile
            if (!this.turnstileToken) {
                this.showTurnstileError('请完成人机验证');
                Utils.showNotification('请完成人机验证', 'warning');
                return;
            }

            // 清除错误
            Utils.clearFormErrors();
            this.clearTurnstileError();

            // 设置提交状态
            this.setSubmitState(true);

            // 获取表单数据
            const formData = new FormData(form);
            const loginData = {
                username: formData.get('username'),
                password: formData.get('password'),
                token: this.turnstileToken
            };

            console.log('提交登录数据:', { ...loginData, token: Utils.truncateText(loginData.token) });

            // 发送登录请求
            const result = await Utils.post(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, loginData);
            
            console.log('登录成功:', result);

            // 更新验证参数显示（如果有验证数据）
            if (result.data && result.data.challenge_ts) {
                this.updateVerificationParams(this.turnstileToken, result.data);
            }

            // 显示成功结果
            this.showResult({
                success: true,
                title: '登录成功',
                message: result.message,
                data: result.data,
                verificationParams: {
                    token: this.turnstileToken,
                    siteKey: CONFIG.TURNSTILE.siteKey,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            });

            Utils.showNotification('登录成功！', 'success');

        } catch (error) {
            console.error('登录失败:', error);
            
            // 显示错误结果
            this.showResult({
                success: false,
                title: '登录失败',
                message: error.message,
                error: error
            });

            Utils.showNotification(`登录失败: ${error.message}`, 'error');
            
            // 重置Turnstile
            this.resetTurnstile();
            
        } finally {
            this.setSubmitState(false);
        }
    }

    /**
     * 设置提交状态
     */
    setSubmitState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        
        const button = document.getElementById('loginButton');
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (isSubmitting) {
            button.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            button.disabled = false;
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }

    /**
     * 重置Turnstile
     */
    resetTurnstile() {
        if (this.turnstileWidgetId !== null && window.turnstile) {
            try {
                window.turnstile.reset(this.turnstileWidgetId);
                this.turnstileToken = null;
                this.updateTurnstileStatus('未验证', 'pending');
                this.updateVerifyTime('-');
                this.updateTokenPreview('-');
                console.log('Turnstile已重置');
            } catch (error) {
                console.error('Turnstile重置失败:', error);
            }
        }
    }

    /**
     * 更新Turnstile状态显示
     */
    updateTurnstileStatus(status, type) {
        const statusElement = document.getElementById('turnstileStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status-value ${type}`;
        }
    }

    /**
     * 更新验证时间显示
     */
    updateVerifyTime(timestamp) {
        const timeElement = document.getElementById('verifyTime');
        if (timeElement) {
            timeElement.textContent = Utils.formatTimestamp(timestamp);
        }
    }

    /**
     * 更新Token预览
     */
    updateTokenPreview(token) {
        const tokenElement = document.getElementById('tokenPreview');
        if (tokenElement) {
            tokenElement.textContent = Utils.truncateText(token, 30);
            tokenElement.title = token; // 完整token作为tooltip
        }
    }

    /**
     * 显示Turnstile错误
     */
    showTurnstileError(message) {
        const errorElement = document.getElementById('turnstileError');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    /**
     * 清除Turnstile错误
     */
    clearTurnstileError() {
        const errorElement = document.getElementById('turnstileError');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * 清除字段错误
     */
    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * 更新配置信息显示
     */
    updateConfigDisplay() {
        // 更新Site Key显示
        const siteKeyElement = document.getElementById('siteKeyDisplay');
        if (siteKeyElement) {
            siteKeyElement.textContent = CONFIG.TURNSTILE.siteKey;
        }

        // 更新主题和大小
        const themeModeElement = document.getElementById('themeMode');
        if (themeModeElement) {
            themeModeElement.textContent = CONFIG.TURNSTILE.theme;
        }

        const widgetSizeElement = document.getElementById('widgetSize');
        if (widgetSizeElement) {
            widgetSizeElement.textContent = CONFIG.TURNSTILE.size;
        }

        // 更新用户代理
        const userAgentElement = document.getElementById('userAgent');
        if (userAgentElement) {
            userAgentElement.textContent = navigator.userAgent;
        }

        // 获取用户IP（通过后端API）
        this.updateUserIP();
    }

    /**
     * 更新用户IP显示
     */
    async updateUserIP() {
        try {
            // 可以通过一个简单的API获取用户IP，这里先显示本地信息
            const userIPElement = document.getElementById('userIP');
            if (userIPElement) {
                userIPElement.textContent = '127.0.0.1 (本地测试)';
            }
        } catch (error) {
            console.error('获取用户IP失败:', error);
        }
    }

    /**
     * 更新验证参数显示
     */
    updateVerificationParams(token, verificationData = null) {
        // 更新Token相关信息
        const fullTokenElement = document.getElementById('fullToken');
        if (fullTokenElement && token) {
            fullTokenElement.textContent = token;
        }

        const tokenLengthElement = document.getElementById('tokenLength');
        if (tokenLengthElement && token) {
            tokenLengthElement.textContent = `${token.length} 字符`;
        }

        const tokenPrefixElement = document.getElementById('tokenPrefix');
        if (tokenPrefixElement && token) {
            const prefix = token.substring(0, 20) + '...';
            tokenPrefixElement.textContent = prefix;
        }

        // 如果有验证响应数据，更新相关字段
        if (verificationData) {
            const challengeTimestampElement = document.getElementById('challengeTimestamp');
            if (challengeTimestampElement && verificationData.challenge_ts) {
                const timestamp = new Date(verificationData.challenge_ts);
                challengeTimestampElement.textContent = timestamp.toLocaleString('zh-CN');
            }

            const verifyHostnameElement = document.getElementById('verifyHostname');
            if (verifyHostnameElement && verificationData.hostname) {
                verifyHostnameElement.textContent = verificationData.hostname;
            }

            const verifyActionElement = document.getElementById('verifyAction');
            if (verifyActionElement && verificationData.action) {
                verifyActionElement.textContent = verificationData.action;
            }

            const customDataElement = document.getElementById('customData');
            if (customDataElement && verificationData.cdata) {
                customDataElement.textContent = verificationData.cdata;
            }
        }
    }

    /**
     * 显示结果模态框
     */
    showResult(result) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('modalTitle');
        const content = document.getElementById('resultContent');
        
        if (!modal || !title || !content) return;

        // 设置标题
        title.textContent = result.title;

        // 设置内容
        let contentHtml = '';
        
        if (result.success) {
            contentHtml = `
                <div class="result-success">
                    <strong>✅ ${result.message}</strong>
                </div>
            `;
            
            if (result.data) {
                contentHtml += `
                    <div class="result-data">
                        <h4>🎯 登录响应数据:</h4>
                        ${JSON.stringify(result.data, null, 2)}
                    </div>
                `;
            }

            if (result.verificationParams) {
                contentHtml += `
                    <div class="result-data">
                        <h4>🔍 验证参数详情:</h4>
                        ${JSON.stringify(result.verificationParams, null, 2)}
                    </div>
                `;
            }
        } else {
            contentHtml = `
                <div class="result-error">
                    <strong>❌ ${result.message}</strong>
                </div>
            `;
            
            if (result.error && result.error.error_codes) {
                contentHtml += `
                    <div class="result-data">
                        错误代码: ${result.error.error_codes.join(', ')}
                    </div>
                `;
            }
        }
        
        content.innerHTML = contentHtml;

        // 显示模态框
        modal.classList.add('show');
    }

    /**
     * 初始化模态框事件
     */
    initModalEvents() {
        const modal = document.getElementById('resultModal');
        const closeBtn = document.getElementById('modalClose');
        const okBtn = document.getElementById('modalOk');
        
        if (!modal) return;

        // 关闭按钮事件
        [closeBtn, okBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.classList.remove('show');
                });
            }
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                modal.classList.remove('show');
            }
        });
    }
}

// 全局Turnstile回调函数
window.onTurnstileSuccess = function(token) {
    if (window.loginManager) {
        window.loginManager.onTurnstileSuccess(token);
    }
};

window.onTurnstileError = function(error) {
    if (window.loginManager) {
        window.loginManager.onTurnstileError(error);
    }
};

window.onTurnstileExpired = function() {
    if (window.loginManager) {
        window.loginManager.onTurnstileExpired();
    }
};

// 页面加载完成后初始化登录管理器
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
});
