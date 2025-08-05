import os
import yaml

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
        """初始化配置，优先使用环境变量，然后是YAML配置，最后是默认值"""
        self._load_config()

    def _load_config(self):
        """加载配置的内部方法"""
        # Flask配置 - 环境变量优先级最高
        # 获取YAML配置作为回退值
        flask_config = yaml_config.get('flask', {}) if yaml_config else {}

        # 环境变量 > YAML配置 > 默认值
        self.SECRET_KEY = os.environ.get('SECRET_KEY') or flask_config.get('secret_key') or 'dev-secret-key-change-in-production'

        # DEBUG配置特殊处理
        env_debug = os.environ.get('FLASK_DEBUG')
        if env_debug is not None:
            self.DEBUG = env_debug.lower() == 'true'
        elif flask_config.get('debug') is not None:
            self.DEBUG = flask_config.get('debug')
        else:
            self.DEBUG = False

        self.HOST = os.environ.get('FLASK_HOST') or flask_config.get('host') or '127.0.0.1'

        # PORT配置特殊处理（需要转换为整数）
        env_port = os.environ.get('FLASK_PORT')
        if env_port:
            self.PORT = int(env_port)
        elif flask_config.get('port'):
            self.PORT = int(flask_config.get('port'))
        else:
            self.PORT = 59623

        # Cloudflare Turnstile配置 - 环境变量优先级最高
        # 获取YAML配置作为回退值
        turnstile_config = yaml_config.get('turnstile', {}) if yaml_config else {}

        # 环境变量 > YAML配置 > 默认值
        self.TURNSTILE_SITE_KEY = os.environ.get('TURNSTILE_SITE_KEY') or turnstile_config.get('site_key') or '1x00000000000000000000AA'
        self.TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY') or turnstile_config.get('secret_key') or '1x0000000000000000000000000000000AA'
        self.TURNSTILE_VERIFY_URL = os.environ.get('TURNSTILE_VERIFY_URL') or turnstile_config.get('verify_url') or 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

        # CORS配置 - 环境变量优先级最高
        # 获取YAML配置作为回退值
        cors_config = yaml_config.get('cors', {}) if yaml_config else {}

        # 环境变量 > YAML配置 > 默认值
        env_cors_origins = os.environ.get('CORS_ORIGINS')
        if env_cors_origins:
            self.CORS_ORIGINS = env_cors_origins.split(',') if env_cors_origins != '*' else ['*']
        elif cors_config.get('origins'):
            self.CORS_ORIGINS = cors_config.get('origins')
        else:
            self.CORS_ORIGINS = ['*']

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
