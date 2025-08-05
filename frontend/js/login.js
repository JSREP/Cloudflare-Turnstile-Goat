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
        // 等待Site Key从API加载完成
        let attempts = 0;
        const maxAttempts = 50; // 最多等待5秒

        while (!CONFIG.TURNSTILE.siteKey && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!CONFIG.TURNSTILE.siteKey) {
            throw new Error('Site Key加载超时');
        }

        console.log('配置加载完成，Site Key:', CONFIG.TURNSTILE.siteKey);
    }

    /**
     * 初始化Turnstile验证
     */
    initTurnstile() {
        const turnstileElement = document.getElementById('turnstile-widget');
        if (!turnstileElement) {
            console.error('未找到Turnstile元素');
            return;
        }

        console.log('找到Turnstile容器，准备渲染组件');
        console.log('Turnstile配置:', {
            siteKey: CONFIG.TURNSTILE.siteKey,
            theme: CONFIG.TURNSTILE.theme,
            size: CONFIG.TURNSTILE.size
        });

        // 更新配置信息显示
        this.updateConfigDisplay();

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
            const turnstileElement = document.getElementById('turnstile-widget');

            if (!turnstileElement) {
                throw new Error('Turnstile容器元素未找到');
            }

            // 检查是否已经渲染过
            if (this.turnstileWidgetId) {
                console.log('Turnstile组件已存在，跳过渲染');
                return;
            }

            // 清空容器内容，防止重复渲染
            turnstileElement.innerHTML = '';

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
        // 检查是否为测试Token
        const isTestToken = token && (token === 'XXXX.DUMMY.TOKEN.XXXX' || token.includes('DUMMY'));

        if (isTestToken) {
            console.log('Turnstile验证成功，收到测试Token:', token);
            console.log('📝 说明：这是Cloudflare测试Site Key返回的假Token，在生产环境中会返回真实Token');
        } else {
            console.log('Turnstile验证成功，Token:', token);
        }

        this.turnstileToken = token;
        this.updateTurnstileStatus('验证成功', 'success');
        this.updateVerifyTime(new Date().toISOString());
        this.updateTokenPreview(token);

        // 更新验证参数显示
        this.updateVerificationParams(token);

        // 清除Turnstile错误
        this.clearTurnstileError();

        const message = isTestToken ? '人机验证成功（测试模式）' : '人机验证成功';
        Utils.showNotification(message, 'success', 3000);
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

            // 更新Cloudflare交互信息
            if (result.debug_info) {
                this.updateCloudflareInteraction(result.debug_info);
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

            // 更新Cloudflare交互信息（如果有调试信息）
            if (error.debug_info) {
                this.updateCloudflareInteraction(error.debug_info);
            }

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
            // 显示完整Token而不是截断
            if (token && token !== '-') {
                tokenElement.textContent = token;
                tokenElement.title = token; // 完整token作为tooltip
            } else {
                tokenElement.textContent = token || '-';
                tokenElement.title = '';
            }
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
     * 更新Token安全性分析
     */
    updateTokenSecurityAnalysis(token, isTestToken) {
        const securityElement = document.getElementById('tokenSecurity');
        if (!securityElement || !token) return;

        if (isTestToken) {
            securityElement.innerHTML = `
                <div class="security-warning">
                    <span class="security-level-test">测试环境</span>
                    <div class="security-explanation">
                        ⚠️ 这是测试Token，不包含真实的安全信息<br>
                        在生产环境中，Token会包含加密签名和时间戳等安全特性
                    </div>
                </div>
            `;
        } else {
            const parts = token.split('.');
            let securityLevel = 'unknown';
            let securityDetails = [];

            if (parts.length === 3) {
                securityLevel = 'high';
                securityDetails.push('✅ JWT格式，包含Header、Payload、Signature三部分');
                securityDetails.push('✅ 使用加密签名验证Token完整性');

                // 尝试分析Payload中的时间信息
                try {
                    const payload = JSON.parse(atob(parts[1]));
                    if (payload.exp) {
                        const expDate = new Date(payload.exp * 1000);
                        securityDetails.push(`⏰ 过期时间: ${expDate.toLocaleString('zh-CN')}`);
                    }
                    if (payload.iat) {
                        const iatDate = new Date(payload.iat * 1000);
                        securityDetails.push(`📅 签发时间: ${iatDate.toLocaleString('zh-CN')}`);
                    }
                } catch (e) {
                    securityDetails.push('⚠️ Payload解析失败，可能使用了加密');
                }
            } else {
                securityLevel = 'medium';
                securityDetails.push('⚠️ 非标准JWT格式');
                securityDetails.push('🔍 需要进一步验证Token结构');
            }

            const securityClass = securityLevel === 'high' ? 'security-level-high' : 'security-level-medium';
            securityElement.innerHTML = `
                <div class="security-info">
                    <span class="${securityClass}">${securityLevel === 'high' ? '高安全性' : '中等安全性'}</span>
                    <div class="security-details">
                        ${securityDetails.map(detail => `<div>${detail}</div>`).join('')}
                    </div>
                </div>
            `;
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
        // 检查是否为测试Token
        const isTestToken = token && (token === 'XXXX.DUMMY.TOKEN.XXXX' || token.includes('DUMMY'));

        // 更新Token相关信息
        const fullTokenElement = document.getElementById('fullToken');
        if (fullTokenElement && token) {
            if (isTestToken) {
                fullTokenElement.innerHTML = `
                    <div class="test-token-warning">
                        <div class="token-value">${token}</div>
                        <div class="token-notice">⚠️ 这是测试Token（使用测试Site Key）</div>
                        <div class="token-explanation">在生产环境中，这里会显示真实的Turnstile Token</div>
                    </div>
                `;
            } else {
                fullTokenElement.textContent = token;
            }
        }

        const tokenLengthElement = document.getElementById('tokenLength');
        if (tokenLengthElement && token) {
            const lengthText = `${token.length} 字符`;
            tokenLengthElement.textContent = isTestToken ? `${lengthText} (测试Token)` : lengthText;
        }

        const tokenPrefixElement = document.getElementById('tokenPrefix');
        if (tokenPrefixElement && token) {
            const prefix = token.substring(0, 20) + '...';
            tokenPrefixElement.textContent = prefix;
        }

        // 添加Token类型分析
        const tokenTypeElement = document.getElementById('tokenType');
        if (tokenTypeElement && token) {
            if (isTestToken) {
                tokenTypeElement.innerHTML = `
                    <span class="token-type-test">测试Token</span>
                    <div class="token-type-explanation">
                        使用Cloudflare测试Site Key (1x00000000000000000000AA) 时返回的固定测试Token
                    </div>
                `;
            } else {
                // 分析真实Token的结构
                const parts = token.split('.');
                if (parts.length === 3) {
                    // 尝试解析JWT Header
                    let headerInfo = '';
                    try {
                        const header = JSON.parse(atob(parts[0]));
                        headerInfo = `<br><small>算法: ${header.alg || 'unknown'}, 类型: ${header.typ || 'unknown'}</small>`;
                    } catch (e) {
                        headerInfo = '<br><small>Header解析失败</small>';
                    }

                    tokenTypeElement.innerHTML = `
                        <span class="token-type-real">JWT格式Token</span>
                        <div class="token-type-explanation">
                            标准的JWT格式：Header.Payload.Signature (${parts[0].length}.${parts[1].length}.${parts[2].length})${headerInfo}
                        </div>
                    `;
                } else {
                    tokenTypeElement.innerHTML = `
                        <span class="token-type-unknown">未知格式Token</span>
                        <div class="token-type-explanation">
                            Token格式：${parts.length}个部分，长度：${token.length}字符
                        </div>
                    `;
                }
            }
        }

        // 添加Token安全性分析
        this.updateTokenSecurityAnalysis(token, isTestToken);

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
                        <div class="json-highlight">${Utils.highlightJSON(result.data)}</div>
                    </div>
                `;
            }

            if (result.verificationParams) {
                contentHtml += `
                    <div class="result-data">
                        <h4>🔍 验证参数详情:</h4>
                        <div class="json-highlight">${Utils.highlightJSON(result.verificationParams)}</div>
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

    /**
     * 更新Cloudflare交互信息
     */
    updateCloudflareInteraction(debugInfo) {
        if (!debugInfo) return;

        console.log('更新Cloudflare交互信息:', debugInfo);

        // 更新请求信息
        this.updateRequestInfo(debugInfo);

        // 更新响应信息
        this.updateResponseInfo(debugInfo);

        // 更新时间信息
        this.updateTimingInfo(debugInfo);

        // 初始化标签页切换
        this.initTabSwitching();
    }

    /**
     * 更新请求信息
     */
    updateRequestInfo(debugInfo) {
        // 请求URL
        const requestUrlElement = document.getElementById('requestUrl');
        if (requestUrlElement && debugInfo.request_url) {
            requestUrlElement.textContent = debugInfo.request_url;
        }

        // 请求数据
        if (debugInfo.request_data) {
            // 原始数据
            const requestDataRawElement = document.getElementById('requestDataRaw');
            if (requestDataRawElement) {
                requestDataRawElement.textContent = this.formatRequestData(debugInfo.request_data);
            }

            // 格式化数据
            const requestDataFormattedElement = document.getElementById('requestDataFormatted');
            if (requestDataFormattedElement) {
                requestDataFormattedElement.innerHTML = this.formatRequestDataFormatted(debugInfo.request_data);
            }
        }
    }

    /**
     * 更新响应信息
     */
    updateResponseInfo(debugInfo) {
        // 响应状态
        const responseStatusElement = document.getElementById('responseStatus');
        if (responseStatusElement && debugInfo.response_status) {
            responseStatusElement.textContent = debugInfo.response_status;
            responseStatusElement.setAttribute('data-status', debugInfo.response_status);
        }

        // 响应头
        if (debugInfo.response_headers) {
            // 原始响应头
            const responseHeadersRawElement = document.getElementById('responseHeadersRaw');
            if (responseHeadersRawElement) {
                responseHeadersRawElement.textContent = JSON.stringify(debugInfo.response_headers, null, 2);
            }

            // 格式化响应头
            const responseHeadersFormattedElement = document.getElementById('responseHeadersFormatted');
            if (responseHeadersFormattedElement) {
                responseHeadersFormattedElement.innerHTML = this.formatHeaders(debugInfo.response_headers);
            }
        }

        // 响应体
        if (debugInfo.response_body) {
            // 原始响应体
            const responseBodyRawElement = document.getElementById('responseBodyRaw');
            if (responseBodyRawElement) {
                responseBodyRawElement.textContent = JSON.stringify(debugInfo.response_body, null, 2);
            }

            // 格式化响应体
            const responseBodyFormattedElement = document.getElementById('responseBodyFormatted');
            if (responseBodyFormattedElement) {
                responseBodyFormattedElement.innerHTML = this.formatJSON(debugInfo.response_body);
            }
        }
    }

    /**
     * 更新时间信息
     */
    updateTimingInfo(debugInfo) {
        const now = new Date().toISOString();

        // 请求时间
        const requestTimeElement = document.getElementById('requestTime');
        if (requestTimeElement) {
            requestTimeElement.textContent = Utils.formatTimestamp(now);
        }

        // 响应时间
        const responseTimeElement = document.getElementById('responseTime');
        if (responseTimeElement) {
            responseTimeElement.textContent = Utils.formatTimestamp(now);
        }

        // 耗时（这里简化处理，实际应该记录真实的请求耗时）
        const requestDurationElement = document.getElementById('requestDuration');
        if (requestDurationElement) {
            requestDurationElement.textContent = '< 1000ms';
        }
    }

    /**
     * 格式化请求数据
     */
    formatRequestData(requestData) {
        if (typeof requestData === 'object') {
            return Object.entries(requestData)
                .map(([key, value]) => `${key}=${encodeURIComponent(this.maskSensitiveData(key, value))}`)
                .join('&');
        }
        return String(requestData);
    }

    /**
     * 格式化请求数据（带高亮）
     */
    formatRequestDataFormatted(requestData) {
        if (typeof requestData === 'object') {
            return Object.entries(requestData)
                .map(([key, value]) => {
                    const maskedValue = this.maskSensitiveData(key, value);
                    const encodedValue = encodeURIComponent(maskedValue);
                    return `<span class="json-key">${key}</span>=<span class="json-string">${encodedValue}</span>`;
                })
                .join('&<br>');
        }
        return `<span class="json-string">${String(requestData)}</span>`;
    }

    /**
     * 遮蔽敏感数据（只遮蔽发送的敏感信息，不遮蔽返回的token）
     */
    maskSensitiveData(key, value) {
        // 只遮蔽发送给服务器的敏感密钥，不遮蔽返回的token或response
        const sensitiveKeys = ['secret', 'password', 'api_key', 'private_key'];
        const keyLower = key.toLowerCase();

        // 不遮蔽这些返回的字段
        const allowedKeys = ['response', 'token', 'cf-turnstile-response'];
        if (allowedKeys.some(allowedKey => keyLower.includes(allowedKey))) {
            return value;
        }

        if (sensitiveKeys.some(sensitiveKey => keyLower.includes(sensitiveKey))) {
            if (typeof value === 'string' && value.length > 8) {
                // 显示前4位和后4位，中间用*代替
                return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
            } else if (typeof value === 'string' && value.length > 0) {
                // 短字符串全部用*代替
                return '*'.repeat(value.length);
            }
        }

        return value;
    }

    /**
     * 格式化响应头
     */
    formatHeaders(headers) {
        return Object.entries(headers)
            .map(([key, value]) => {
                return `<span class="json-key">${key}</span>: <span class="json-string">${value}</span>`;
            })
            .join('<br>');
    }

    /**
     * 格式化JSON
     */
    formatJSON(obj) {
        const json = JSON.stringify(obj, null, 2);
        return json
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
            .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/: null/g, ': <span class="json-null">null</span>');
    }

    /**
     * 初始化标签页切换
     */
    initTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                const tabGroup = button.closest('.param-value');

                // 移除所有活动状态
                tabGroup.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                tabGroup.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

                // 添加当前活动状态
                button.classList.add('active');
                const targetContent = tabGroup.querySelector(`#${tabId}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
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

// 复制Token预览到剪贴板的全局函数
window.copyTokenPreview = function() {
    const tokenElement = document.getElementById('tokenPreview');
    const copyBtn = document.getElementById('copyTokenPreviewBtn');

    if (!tokenElement || !copyBtn) {
        console.error('Token预览元素或复制按钮未找到');
        return;
    }

    // 获取token文本内容
    const tokenText = tokenElement.textContent.trim();

    // 如果token为空或是默认文本，不执行复制
    if (!tokenText || tokenText === '-' || tokenText === '未验证') {
        Utils.showNotification('暂无可复制的Token', 'warning', 3000);
        return;
    }

    // 使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(tokenText).then(() => {
            // 复制成功的视觉反馈
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            copyBtn.classList.add('copied');

            // 显示成功通知
            Utils.showNotification('Token已复制到剪贴板', 'success', 3000);

            // 恢复按钮状态
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            Utils.showNotification('复制失败，请手动选择复制', 'error', 5000);
        });
    } else {
        // 降级方案：使用传统的document.execCommand
        try {
            const textArea = document.createElement('textarea');
            textArea.value = tokenText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                // 复制成功的视觉反馈
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅';
                copyBtn.classList.add('copied');

                Utils.showNotification('Token已复制到剪贴板', 'success', 3000);

                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            } else {
                throw new Error('execCommand复制失败');
            }
        } catch (err) {
            console.error('复制失败:', err);
            Utils.showNotification('复制失败，请手动选择复制', 'error', 5000);
        }
    }
};

// 复制Token到剪贴板的全局函数
window.copyToken = function() {
    const fullTokenElement = document.getElementById('fullToken');
    const copyBtn = document.getElementById('copyTokenBtn');

    if (!fullTokenElement || !copyBtn) {
        console.error('Token元素或复制按钮未找到');
        return;
    }

    // 获取token文本内容
    let tokenText = '';

    // 检查是否是测试token的特殊HTML结构
    const testTokenDiv = fullTokenElement.querySelector('.token-value');
    if (testTokenDiv) {
        tokenText = testTokenDiv.textContent.trim();
    } else {
        tokenText = fullTokenElement.textContent.trim();
    }

    // 如果token为空或是默认文本，不执行复制
    if (!tokenText || tokenText === '等待验证...' || tokenText === '-') {
        Utils.showNotification('暂无可复制的Token', 'warning', 3000);
        return;
    }

    // 使用现代剪贴板API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(tokenText).then(() => {
            // 复制成功的视觉反馈
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ 已复制';
            copyBtn.classList.add('copied');

            // 显示成功通知
            Utils.showNotification('Token已复制到剪贴板', 'success', 3000);

            // 恢复按钮状态
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            Utils.showNotification('复制失败，请手动选择复制', 'error', 5000);
        });
    } else {
        // 降级方案：使用传统的document.execCommand
        try {
            const textArea = document.createElement('textarea');
            textArea.value = tokenText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                // 复制成功的视觉反馈
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ 已复制';
                copyBtn.classList.add('copied');

                Utils.showNotification('Token已复制到剪贴板', 'success', 3000);

                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
            } else {
                throw new Error('execCommand复制失败');
            }
        } catch (err) {
            console.error('复制失败:', err);
            Utils.showNotification('复制失败，请手动选择复制', 'error', 5000);
        }
    }
};

// 页面加载完成后初始化登录管理器
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
});
