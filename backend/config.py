import os
import yaml
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

def load_yaml_config():
    """加载YAML配置文件"""
    config_path = os.path.join(os.path.dirname(__file__), 'config.yml')
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"警告：无法加载config.yml文件: {e}")
            return None
    return None

# 尝试加载YAML配置
yaml_config = load_yaml_config()

class Config:
    """应用配置类"""

    def __init__(self):
        """初始化配置，优先使用YAML配置，然后是环境变量，最后是默认值"""
        self._load_config()

    def _load_config(self):
        """加载配置的内部方法"""
        # Flask配置
        if yaml_config and 'flask' in yaml_config:
            flask_config = yaml_config['flask']
            self.SECRET_KEY = flask_config.get('secret_key') or os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
            self.DEBUG = flask_config.get('debug', False) if flask_config.get('debug') is not None else (os.environ.get('FLASK_DEBUG', 'False').lower() == 'true')
            self.HOST = flask_config.get('host') or os.environ.get('FLASK_HOST', '127.0.0.1')
            self.PORT = int(flask_config.get('port') or os.environ.get('FLASK_PORT', 5000))
        else:
            # 回退到环境变量
            self.SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
            self.DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
            self.HOST = os.environ.get('FLASK_HOST', '127.0.0.1')
            self.PORT = int(os.environ.get('FLASK_PORT', 5000))

        # Cloudflare Turnstile配置
        if yaml_config and 'turnstile' in yaml_config:
            turnstile_config = yaml_config['turnstile']
            self.TURNSTILE_SITE_KEY = turnstile_config.get('site_key') or os.environ.get('TURNSTILE_SITE_KEY') or '1x00000000000000000000AA'
            self.TURNSTILE_SECRET_KEY = turnstile_config.get('secret_key') or os.environ.get('TURNSTILE_SECRET_KEY') or '1x0000000000000000000000000000000AA'
            self.TURNSTILE_VERIFY_URL = turnstile_config.get('verify_url') or 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
        else:
            # 回退到环境变量
            self.TURNSTILE_SITE_KEY = os.environ.get('TURNSTILE_SITE_KEY') or '1x00000000000000000000AA'
            self.TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY') or '1x0000000000000000000000000000000AA'
            self.TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

        # CORS配置
        if yaml_config and 'cors' in yaml_config and 'origins' in yaml_config['cors']:
            self.CORS_ORIGINS = yaml_config['cors']['origins']
        else:
            # 回退到环境变量
            cors_origins = os.environ.get('CORS_ORIGINS', '*')
            self.CORS_ORIGINS = cors_origins.split(',') if cors_origins != '*' else ['*']

class DevelopmentConfig(Config):
    """开发环境配置"""
    def __init__(self):
        super().__init__()
        self.DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    def __init__(self):
        super().__init__()
        self.DEBUG = False

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
