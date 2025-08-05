from flask import Flask, request, jsonify, render_template_string, send_from_directory
from flask_cors import CORS
import os
import logging
from config import config
from utils.turnstile import TurnstileVerifier

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(config_name=None):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 加载配置
    config_name = config_name or os.environ.get('FLASK_ENV', 'default')
    config_obj = config[config_name]()  # 实例化配置对象
    app.config.from_object(config_obj)
    
    # 启用CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    # 初始化Turnstile验证器
    turnstile_verifier = TurnstileVerifier(
        secret_key=app.config['TURNSTILE_SECRET_KEY'],
        verify_url=app.config['TURNSTILE_VERIFY_URL']
    )
    
    @app.route('/')
    def index():
        """主页"""
        return jsonify({
            'message': 'Cloudflare Turnstile Goat API',
            'version': '1.0.0',
            'endpoints': {
                'login': '/api/login',
                'verify': '/api/verify',
                'config': '/api/config'
            }
        })
    
    @app.route('/api/config')
    def get_config():
        """获取前端配置"""
        return jsonify({
            'turnstile_site_key': app.config['TURNSTILE_SITE_KEY'],
            'debug': app.config['DEBUG']
        })
    
    @app.route('/api/verify', methods=['POST'])
    def verify_turnstile():
        """验证Turnstile token"""
        try:
            # 获取请求数据
            data = request.get_json()
            if not data:
                return jsonify({
                    'success': False,
                    'error': '请求数据格式错误'
                }), 400
            
            # 获取token
            token = data.get('token') or data.get('cf-turnstile-response')
            if not token:
                return jsonify({
                    'success': False,
                    'error': 'Turnstile token缺失'
                }), 400
            
            # 获取用户IP
            remote_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            if remote_ip and ',' in remote_ip:
                remote_ip = remote_ip.split(',')[0].strip()
            
            logger.info(f"收到验证请求，IP: {remote_ip}, Token: {token[:20]}...")
            
            # 验证token
            result = turnstile_verifier.verify_token(token, remote_ip)
            
            if result['success']:
                logger.info("Turnstile验证成功")
                return jsonify({
                    'success': True,
                    'message': '验证成功',
                    'data': {
                        'challenge_ts': result.get('challenge_ts'),
                        'hostname': result.get('hostname'),
                        'action': result.get('action')
                    }
                })
            else:
                logger.warning(f"Turnstile验证失败: {result['error']}")
                return jsonify({
                    'success': False,
                    'error': result['error'],
                    'error_codes': result.get('error_codes', [])
                }), 403
                
        except Exception as e:
            logger.error(f"验证过程发生异常: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'服务器内部错误: {str(e)}'
            }), 500
    
    @app.route('/api/login', methods=['POST'])
    def login():
        """登录接口（包含Turnstile验证）"""
        try:
            # 获取表单数据或JSON数据
            if request.content_type == 'application/json':
                data = request.get_json()
                username = data.get('username')
                password = data.get('password')
                token = data.get('token') or data.get('cf-turnstile-response')
            else:
                username = request.form.get('username')
                password = request.form.get('password')
                token = request.form.get('cf-turnstile-response')
            
            # 验证必填字段
            if not username or not password:
                return jsonify({
                    'success': False,
                    'error': '用户名和密码不能为空'
                }), 400
            
            if not token:
                return jsonify({
                    'success': False,
                    'error': 'Turnstile验证token缺失'
                }), 400
            
            # 获取用户IP
            remote_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            if remote_ip and ',' in remote_ip:
                remote_ip = remote_ip.split(',')[0].strip()
            
            logger.info(f"收到登录请求，用户: {username}, IP: {remote_ip}")
            
            # 首先验证Turnstile
            result = turnstile_verifier.verify_token(token, remote_ip)
            
            if not result['success']:
                logger.warning(f"登录失败，Turnstile验证不通过: {result['error']}")
                return jsonify({
                    'success': False,
                    'error': f'人机验证失败: {result["error"]}',
                    'error_codes': result.get('error_codes', [])
                }), 403
            
            # Turnstile验证通过，进行业务逻辑验证
            # 这里是演示用的简单验证逻辑
            if username == 'admin' and password == 'password':
                logger.info(f"用户 {username} 登录成功")
                return jsonify({
                    'success': True,
                    'message': '登录成功',
                    'data': {
                        'username': username,
                        'login_time': result.get('challenge_ts'),
                        'session_id': 'demo-session-' + token[:10]
                    }
                })
            else:
                logger.warning(f"用户 {username} 登录失败，用户名或密码错误")
                return jsonify({
                    'success': False,
                    'error': '用户名或密码错误'
                }), 401
                
        except Exception as e:
            logger.error(f"登录过程发生异常: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'服务器内部错误: {str(e)}'
            }), 500
    
    @app.route('/frontend/<path:filename>')
    def serve_frontend(filename):
        """提供前端静态文件"""
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')
        return send_from_directory(frontend_dir, filename)
    
    @app.errorhandler(404)
    def not_found(error):
        """404错误处理"""
        return jsonify({
            'success': False,
            'error': '接口不存在'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """500错误处理"""
        logger.error(f"服务器内部错误: {str(error)}")
        return jsonify({
            'success': False,
            'error': '服务器内部错误'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    # 从配置获取主机和端口
    host = app.config['HOST']
    port = app.config['PORT']
    debug = app.config['DEBUG']
    
    logger.info(f"启动Flask应用，地址: http://{host}:{port}")
    logger.info(f"调试模式: {debug}")
    logger.info(f"Turnstile Site Key: {app.config['TURNSTILE_SITE_KEY']}")
    
    app.run(host=host, port=port, debug=debug)
