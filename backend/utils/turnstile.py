import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class TurnstileVerifier:
    """Cloudflare Turnstile验证器"""
    
    def __init__(self, secret_key: str, verify_url: str):
        """
        初始化Turnstile验证器
        
        Args:
            secret_key: Cloudflare Turnstile Secret Key
            verify_url: Cloudflare验证API URL
        """
        self.secret_key = secret_key
        self.verify_url = verify_url
    
    def verify_token(self, token: str, remote_ip: Optional[str] = None) -> Dict[str, Any]:
        """
        验证Turnstile token
        
        Args:
            token: 前端提交的cf-turnstile-response token
            remote_ip: 用户IP地址（可选）
            
        Returns:
            验证结果字典，包含success状态和错误信息
        """
        if not token:
            return {
                'success': False,
                'error': 'Token不能为空',
                'error_codes': ['missing-input-response']
            }
        
        # 构建验证请求数据
        data = {
            'secret': self.secret_key,
            'response': token
        }
        
        # 添加用户IP（可选但推荐）
        if remote_ip:
            data['remoteip'] = remote_ip
        
        try:
            # 发送验证请求
            logger.info(f"正在验证Turnstile token: {token[:20]}...")
            response = requests.post(
                self.verify_url,
                data=data,
                timeout=10,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            # 检查HTTP状态码
            if response.status_code != 200:
                logger.error(f"Turnstile API返回错误状态码: {response.status_code}")
                return {
                    'success': False,
                    'error': f'API请求失败，状态码: {response.status_code}',
                    'error_codes': ['api-error']
                }
            
            # 解析响应
            result = response.json()
            logger.info(f"Turnstile验证结果: {result}")
            
            # 检查验证结果
            if result.get('success'):
                return {
                    'success': True,
                    'challenge_ts': result.get('challenge_ts'),
                    'hostname': result.get('hostname'),
                    'action': result.get('action'),
                    'cdata': result.get('cdata')
                }
            else:
                error_codes = result.get('error-codes', [])
                error_message = self._get_error_message(error_codes)
                
                return {
                    'success': False,
                    'error': error_message,
                    'error_codes': error_codes
                }
                
        except requests.exceptions.Timeout:
            logger.error("Turnstile验证请求超时")
            return {
                'success': False,
                'error': '验证请求超时，请重试',
                'error_codes': ['timeout-error']
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Turnstile验证请求异常: {str(e)}")
            return {
                'success': False,
                'error': f'网络请求失败: {str(e)}',
                'error_codes': ['network-error']
            }
        except ValueError as e:
            logger.error(f"Turnstile响应解析失败: {str(e)}")
            return {
                'success': False,
                'error': '响应格式错误',
                'error_codes': ['invalid-response']
            }
        except Exception as e:
            logger.error(f"Turnstile验证未知错误: {str(e)}")
            return {
                'success': False,
                'error': f'验证过程发生错误: {str(e)}',
                'error_codes': ['unknown-error']
            }
    
    def _get_error_message(self, error_codes: list) -> str:
        """
        根据错误代码获取友好的错误消息
        
        Args:
            error_codes: Cloudflare返回的错误代码列表
            
        Returns:
            友好的错误消息
        """
        error_messages = {
            'missing-input-secret': 'Secret key缺失',
            'invalid-input-secret': 'Secret key无效',
            'missing-input-response': '验证响应缺失',
            'invalid-input-response': '验证响应无效',
            'bad-request': '请求格式错误',
            'timeout-or-duplicate': '验证超时或重复提交',
            'internal-error': 'Cloudflare内部错误'
        }
        
        if not error_codes:
            return '验证失败，未知错误'
        
        # 获取第一个错误的友好消息
        first_error = error_codes[0]
        message = error_messages.get(first_error, f'验证失败: {first_error}')
        
        # 如果有多个错误，添加错误代码信息
        if len(error_codes) > 1:
            message += f' (错误代码: {", ".join(error_codes)})'
        
        return message
