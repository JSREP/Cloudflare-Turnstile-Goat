/**
 * 主JavaScript文件 - 通用功能和工具函数
 */

// 全局配置
const CONFIG = {
    API_BASE_URL: window.location.origin,
    ENDPOINTS: {
        CONFIG: '/api/config',
        LOGIN: '/api/login',
        VERIFY: '/api/verify'
    },
    TURNSTILE: {
        siteKey: null, // 将从API动态获取
        theme: 'light',
        size: 'normal'
    }
};

// 工具函数类
class Utils {
    /**
     * 发送HTTP请求
     * @param {string} url - 请求URL
     * @param {Object} options - 请求选项
     * @returns {Promise<Object>} 响应数据
     */
    static async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        try {
            console.log(`发送请求: ${config.method} ${url}`, config.body ? JSON.parse(config.body) : '');
            
            const response = await fetch(url, config);
            const data = await response.json();

            console.log(`响应状态: ${response.status}`, data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('请求失败:', error);
            throw error;
        }
    }

    /**
     * GET请求
     * @param {string} url - 请求URL
     * @returns {Promise<Object>} 响应数据
     */
    static async get(url) {
        return this.request(url);
    }

    /**
     * POST请求
     * @param {string} url - 请求URL
     * @param {Object} data - 请求数据
     * @returns {Promise<Object>} 响应数据
     */
    static async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * 显示通知消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, warning, info)
     * @param {number} duration - 显示时长(毫秒)
     */
    static showNotification(message, type = 'info', duration = 5000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // 添加样式
        this.addNotificationStyles();

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => notification.classList.add('show'), 100);

        // 自动隐藏
        const hideNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        // 点击关闭
        notification.querySelector('.notification-close').addEventListener('click', hideNotification);

        // 自动隐藏
        if (duration > 0) {
            setTimeout(hideNotification, duration);
        }
    }

    /**
     * 获取通知图标
     * @param {string} type - 通知类型
     * @returns {string} 图标
     */
    static getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * 添加通知样式
     */
    static addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease-in-out;
                border-left: 4px solid #3b82f6;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success {
                border-left-color: #10b981;
            }
            .notification-error {
                border-left-color: #ef4444;
            }
            .notification-warning {
                border-left-color: #f59e0b;
            }
            .notification-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }
            .notification-icon {
                font-size: 18px;
                flex-shrink: 0;
            }
            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: #374151;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            .notification-close:hover {
                background-color: #f3f4f6;
                color: #6b7280;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 格式化时间戳
     * @param {string} timestamp - ISO时间戳
     * @returns {string} 格式化的时间
     */
    static formatTimestamp(timestamp) {
        if (!timestamp) return '-';
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('时间格式化失败:', error);
            return timestamp;
        }
    }

    /**
     * 截断文本
     * @param {string} text - 原始文本
     * @param {number} maxLength - 最大长度
     * @returns {string} 截断后的文本
     */
    static truncateText(text, maxLength = 20) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * 验证表单字段
     * @param {HTMLFormElement} form - 表单元素
     * @returns {Object} 验证结果
     */
    static validateForm(form) {
        const errors = {};
        const formData = new FormData(form);
        
        // 验证必填字段
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            const value = formData.get(field.name);
            if (!value || value.trim() === '') {
                errors[field.name] = '此字段为必填项';
            }
        });

        // 验证邮箱格式
        const emailFields = form.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            const value = formData.get(field.name);
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[field.name] = '请输入有效的邮箱地址';
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * 显示表单错误
     * @param {Object} errors - 错误对象
     */
    static showFormErrors(errors) {
        // 清除之前的错误
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });

        // 显示新错误
        Object.keys(errors).forEach(fieldName => {
            const errorElement = document.getElementById(`${fieldName}Error`);
            if (errorElement) {
                errorElement.textContent = errors[fieldName];
            }
        });
    }

    /**
     * 清除表单错误
     */
    static clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });
    }

    /**
     * 格式化JSON字符串
     */
    static formatJSON(obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (error) {
            console.error('JSON格式化失败:', error);
            return String(obj);
        }
    }

    /**
     * JSON语法高亮
     */
    static highlightJSON(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }

        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            })
            .replace(/([{}])/g, '<span class="json-brace">$1</span>')
            .replace(/([[\]])/g, '<span class="json-brace">$1</span>')
            .replace(/([:,])/g, '<span class="json-punctuation">$1</span>');
    }
}

// 应用初始化类
class App {
    constructor() {
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        console.log('应用初始化开始');
        
        try {
            // 加载配置
            await this.loadConfig();
            
            // 初始化事件监听
            this.initEventListeners();

            // 初始化动画
            this.initAnimations();

            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            Utils.showNotification('应用初始化失败，请刷新页面重试', 'error');
        }
    }

    /**
     * 加载应用配置
     */
    async loadConfig() {
        try {
            console.log('正在从API加载配置...');
            const response = await Utils.get(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CONFIG}`);

            if (response.success && response.data && response.data.turnstile) {
                // 更新Turnstile配置
                CONFIG.TURNSTILE.siteKey = response.data.turnstile.site_key;
                CONFIG.TURNSTILE.theme = response.data.turnstile.theme || CONFIG.TURNSTILE.theme;
                CONFIG.TURNSTILE.size = response.data.turnstile.size || CONFIG.TURNSTILE.size;

                console.log('配置加载成功:', {
                    siteKey: CONFIG.TURNSTILE.siteKey,
                    theme: CONFIG.TURNSTILE.theme,
                    size: CONFIG.TURNSTILE.size
                });
            } else {
                throw new Error('配置响应格式错误');
            }
        } catch (error) {
            console.error('配置加载失败:', error);
            // 使用默认的测试配置作为回退
            CONFIG.TURNSTILE.siteKey = '1x00000000000000000000AA';
            console.warn('使用默认测试配置作为回退');
        }
    }

    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // 导航高亮
        this.updateActiveNavigation();
        
        console.log('事件监听初始化完成');
    }

    /**
     * 更新导航高亮
     */
    updateActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath ||
                (currentPath === '/' && href === 'index.html') ||
                (currentPath.includes('login') && href === 'login.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * 初始化动画
     */
    initAnimations() {
        // 初始化滚动观察器
        this.initScrollObserver();

        // 初始化Feature卡片动画
        this.initFeatureCardsAnimation();

        console.log('动画系统初始化完成');
    }

    /**
     * 初始化滚动观察器
     */
    initScrollObserver() {
        // 检查浏览器是否支持Intersection Observer
        if (!('IntersectionObserver' in window)) {
            // 如果不支持，直接显示所有元素
            document.querySelectorAll('.scroll-animate').forEach(el => {
                el.classList.add('animate-in');
            });
            return;
        }

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    // 一次性动画，观察后即可停止观察
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // 观察所有需要滚动动画的元素
        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * 初始化Feature卡片动画
     */
    initFeatureCardsAnimation() {
        const featureCards = document.querySelectorAll('.feature-card');

        if (featureCards.length === 0) return;

        // 检查浏览器是否支持Intersection Observer
        if (!('IntersectionObserver' in window)) {
            // 如果不支持，直接显示所有卡片
            featureCards.forEach(card => {
                card.classList.add('animate-in');
            });
            return;
        }

        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -30px 0px'
        };

        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    cardObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // 观察所有Feature卡片
        featureCards.forEach(card => {
            cardObserver.observe(card);
        });
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// 导出工具类供其他模块使用
window.Utils = Utils;
window.CONFIG = CONFIG;
