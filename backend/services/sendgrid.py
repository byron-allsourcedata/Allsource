import json
import logging
import os
import ssl
from typing import List, Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Cc, From, Mail, Subject

logger = logging.getLogger(__name__)


def preinstall():
    raise NotImplementedError


def install():
    raise NotImplementedError


def uninstall():
    raise NotImplementedError


def analytics():
    raise NotImplementedError


class SendgridHandler:
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

    @classmethod
    def send_sign_up_mail(
            cls,
            subject: str,
            template_id: str,
            template_placeholder: dict,
            to_emails: List[str],
            attachedfile: Optional[any] = None,
            cc_emails: List[str] = None,
            html_content: str = None,
            from_user: str = "noreply@maximiz.ai",
    ) -> dict:
        # UNSAFE: opt out of ssl check
        tempfunc = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context

        sg = SendGridAPIClient(cls.SENDGRID_API_KEY)
        message = Mail()
        message.from_email = From(from_user)
        message.add_to(to_email=to_emails)
        message.subject = Subject(subject)
        message.template_id = template_id
        message.dynamic_template_data = {
            "Full_name": template_placeholder.get("full_name"),
            "Link": template_placeholder.get("link"),
            "Email": template_placeholder.get("email")
        }
        message.is_multiple = True
        if attachedfile is not None:
            message.attachment = attachedfile

        if cc_emails:
            message.add_cc([Cc(cc) for cc in cc_emails])

        response = sg.send(message)

        ssl._create_default_https_context = tempfunc

        return {
            "status_code": response.status_code,
            "body": json.loads(response.body) if response.body else None,
            "x_message_id": response.headers.get("X-Message-Id"),
        }


