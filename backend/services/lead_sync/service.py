import json
from typing import Any
import urllib.parse
from resolver import injectable


@injectable
class LeadSyncService:
    def __init__(self) -> None:
        pass

    def decode_partner_uid(self, partner_uid: str) -> dict[str, Any] | None:
        try:
            partner_uid_decoded = urllib.parse.unquote(str(partner_uid).lower())
            partner_uid_dict = json.loads(partner_uid_decoded)
            return partner_uid_dict
        except Exception:
            return None
