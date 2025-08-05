#!/usr/bin/env python3
"""
HTTP/HTTPS代理服务器，将域名请求转发到本地服务
支持自签名SSL证书来模拟HTTPS
"""
import http.server
import socketserver
import urllib.request
import urllib.parse
from urllib.error import URLError
import ssl
import socket
import os
import subprocess
import sys

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.proxy_request()

    def do_POST(self):
        self.proxy_request()

    def proxy_request(self):
        # 目标服务器
        target_host = "127.0.0.1"
        target_port = 52669

        # 构建目标URL
        target_url = f"http://{target_host}:{target_port}{self.path}"

        try:
            # 创建请求
            req = urllib.request.Request(target_url)

            # 复制请求头（除了Host）
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'connection']:
                    req.add_header(header, value)

            # 如果是POST请求，读取请求体
            if self.command == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    req.data = post_data

            # 发送请求
            with urllib.request.urlopen(req) as response:
                # 设置响应状态码
                self.send_response(response.getcode())

                # 复制响应头
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                self.end_headers()

                # 复制响应体
                self.wfile.write(response.read())

        except URLError as e:
            self.send_error(502, f"Bad Gateway: {str(e)}")
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")

def create_self_signed_cert():
    """创建自签名SSL证书"""
    cert_file = "server.crt"
    key_file = "server.key"

    if os.path.exists(cert_file) and os.path.exists(key_file):
        return cert_file, key_file

    print("创建自签名SSL证书...")
    try:
        # 使用openssl创建自签名证书
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:4096", "-keyout", key_file,
            "-out", cert_file, "-days", "365", "-nodes", "-subj",
            "/C=US/ST=State/L=City/O=Organization/CN=cloudflare-turnstile.jsrei.org"
        ], check=True, capture_output=True)
        print(f"SSL证书已创建: {cert_file}, {key_file}")
        return cert_file, key_file
    except subprocess.CalledProcessError as e:
        print(f"创建SSL证书失败: {e}")
        return None, None
    except FileNotFoundError:
        print("openssl命令未找到，无法创建SSL证书")
        return None, None

def run_proxy(port=8080, use_ssl=False):
    with socketserver.TCPServer(("", port), ProxyHandler) as httpd:
        if use_ssl:
            cert_file, key_file = create_self_signed_cert()
            if cert_file and key_file:
                context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
                context.load_cert_chain(cert_file, key_file)
                httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
                protocol = "HTTPS"
            else:
                print("SSL证书创建失败，使用HTTP模式")
                protocol = "HTTP"
                use_ssl = False
        else:
            protocol = "HTTP"

        print(f"{protocol}代理服务器启动在端口 {port}")
        print(f"请访问: {'https' if use_ssl else 'http'}://127.0.0.1:{port}/login.html")
        print("或者修改hosts文件:")
        print(f"echo '127.0.0.1 cloudflare-turnstile.jsrei.org' | sudo tee -a /etc/hosts")
        print("然后访问: https://cloudflare-turnstile.jsrei.org:8443/login.html" if use_ssl else "http://cloudflare-turnstile.jsrei.org:8080/login.html")
        print("按 Ctrl+C 停止服务器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='代理服务器')
    parser.add_argument('--port', type=int, default=8080, help='监听端口')
    parser.add_argument('--ssl', action='store_true', help='启用HTTPS')
    parser.add_argument('--ssl-port', type=int, default=8443, help='HTTPS端口')

    args = parser.parse_args()

    if args.ssl:
        run_proxy(args.ssl_port, use_ssl=True)
    else:
        run_proxy(args.port, use_ssl=False)
