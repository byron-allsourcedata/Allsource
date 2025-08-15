import hashlib
import os
from config.domains import Domains
from config.util import getenv
from resolver import injectable
from services.domains import UserDomainsService


@injectable
class ManualPixelService:
    def __init__(self, domains: UserDomainsService):
        self.domains = domains

    def get_manual_pixel_code(self, client_id: str) -> str:
        pixel_script_domain = Domains.PIXEL_SCRIPT_DOMAIN
        script = (
            f'<script src="https://{pixel_script_domain}/pixel.js?dpid={client_id}"></script>'
            "\n"
            '<script type="text/javascript">'
            "\n"
            "    (function(s, p, i, c, e) {"
            "\n"
            "    s[e] = s[e] || function() { (s[e].a = s[e].a || []).push(arguments); };"
            "\n"
            "    s[e].l = 1 * new Date();"
            "\n"
            '    var k = c.createElement("script"), a = c.getElementsByTagName("script")[0];'
            "\n"
            "    k.async = 1, k.src = p, a.parentNode.insertBefore(k, a);"
            "\n"
            "    s.pixelClientId = i;"
            "\n"
            f'    }})(window, "https://allsource-data.s3.us-east-2.amazonaws.com/allsource_pixel.js", "{client_id}", document, "script");'
            "\n"
            "</script>"
        )

        return script
