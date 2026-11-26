# local test server that sends the same security headers as netlify.toml
import http.server,re,os,sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t=open(ROOT+'/netlify.toml').read().split('[[headers]]')[1]
H=dict(re.findall(r'^\s*([A-Za-z-]+) = "(.*)"$',t,re.M)); H.pop('Strict-Transport-Security',None)
class S(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT+'/site',**k)
    def end_headers(s):
        for k,v in H.items(): s.send_header(k,v)
        super().end_headers()
    def log_message(s,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',8765),S).serve_forever()
