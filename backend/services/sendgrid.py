import base64
import json
import logging
import os
import re
import ssl
from typing import List, Optional

import requests
from sendgrid import Content, From, ReplyTo, SendGridAPIClient, Subject
from sendgrid.helpers.mail import Attachment, Cc, Disposition, FileContent, FileName, From, Mail, Subject
from sqlalchemy import inspect


from ..config.sql import session_scope
logger = logging.getLogger(__name__)


def preinstall():
    raise NotImplementedError


def install():
    raise NotImplementedError


def uninstall():
    raise NotImplementedError


def analytics():
    raise NotImplementedError


class SendGridHandler:
    SENDGRID_API_KEY = os.getenv("SMI_EMAIL")
    SENDGRID_API_KEY_V2 = os.getenv("SMI_EMAIL_v2")

    @classmethod
    def send_mail(
        cls,
        reply_to: str,
        subject: str,
        to_emails: List[str],
        attachedfile: Optional[any] = None,
        cc_emails: List[str] = None,
        plain_text_content: str = None,
        html_content: str = None,
        from_user: str = "outreach@lolly.com",
    ) -> dict:
        # UNSAFE: opt out of ssl check
        tempfunc = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context

        sg = SendGridAPIClient(cls.SENDGRID_API_KEY)
        message = Mail()
        message.from_email = From(from_user)
        message.add_to(to_email=to_emails)
        # message.to_email = To(to_emails)
        message.subject = Subject(subject)
        message.content = Content("text/html", html_content)
        message.reply_to = ReplyTo(reply_to)
        message.is_multiple = True
        if attachedfile is not None:
            message.attachment = attachedfile

        logger.error(message)

        if cc_emails:
            message.add_cc([Cc(cc) for cc in cc_emails])

        response = sg.send(message)

        # Restore ssl check after task is done
        ssl._create_default_https_context = tempfunc

        return {
            "status_code": response.status_code,
            "body": json.loads(response.body) if response.body else None,
            "x_message_id": response.headers.get("X-Message-Id"),
        }

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
            from_user: str = "noreply@lolly.com",
    ) -> dict:
        # UNSAFE: opt out of ssl check
        tempfunc = ssl._create_default_https_context
        ssl._create_default_https_context = ssl._create_unverified_context

        sg = SendGridAPIClient(cls.SENDGRID_API_KEY_V2)
        message = Mail()
        message.from_email = From(from_user)
        message.add_to(to_email=to_emails)
        message.subject = Subject(subject)
        message.template_id = template_id
        if template_placeholder.get("AdminName") is not None:
            message.dynamic_template_data = {
                "FirstName": template_placeholder.get("FirstName"),
                "Link": template_placeholder.get("Link"),
                "AdminName": template_placeholder.get("AdminName"),
            }
        elif template_placeholder.get("Amount") is not None:
            message.dynamic_template_data = {
                "FirstName": template_placeholder.get("FirstName"),
                "Link": template_placeholder.get("Link"),
                "Amount": template_placeholder.get("Amount"),
            }
        elif template_placeholder.get("InviteeName") is not None:
            message.dynamic_template_data = {
                "FirstName": template_placeholder.get("FirstName"),
                "InviteeName": template_placeholder.get("InviteeName"),
                "Link": template_placeholder.get("Link"),
            }
        else:
            message.dynamic_template_data = {
                "FirstName": template_placeholder.get("FirstName"),
                "Link": template_placeholder.get("Link"),
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


