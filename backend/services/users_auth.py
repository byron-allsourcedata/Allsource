import logging
import os
import json
from datetime import datetime, timedelta
from datetime import timezone

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session
from persistence.domains import UserDomainsPersistence
from fastapi import HTTPException, status
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import SignUpStatus, LoginStatus, ResetPasswordEnum, \
    VerifyToken, UserAuthorizationStatus, SendgridTemplate, NotificationTitles, SourcePlatformEnum, OauthShopify
from models.account_notification import AccountNotification
from models.users import Users
from schemas.integrations.integrations import IntegrationCredentials
from models.users_account_notification import UserAccountNotification
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from schemas.auth_google_token import AuthGoogleData
from schemas.users import UserSignUpForm, UserLoginForm, ResetPasswordForm, UtmParams
from services.integrations.base import IntegrationService
from services.partners import PartnersService
from schemas.integrations.integrations import ShopifyOrBigcommerceCredentials
from services.payments_plans import PaymentsPlans
from . import stripe_service
from .jwt_service import get_password_hash, create_access_token, verify_password, decode_jwt_data
from .sendgrid import SendgridHandler
from .stripe_service import create_stripe_checkout_session
from .subscriptions import SubscriptionService

EMAIL_NOTIFICATIONS = 'email_notifications'
logger = logging.getLogger(__name__)


class UsersAuth:
    def __init__(self, db: Session, payments_service: PaymentsPlans, user_persistence_service: UserPersistence,
                 send_grid_persistence_service: SendgridPersistence, subscription_service: SubscriptionService,
                 plans_persistence: PlansPersistence, integration_service: IntegrationService, partners_service: PartnersService,
                 domain_persistence: UserDomainsPersistence
                 ):
        self.db = db
        self.payments_service = payments_service
        self.user_persistence_service = user_persistence_service
        self.send_grid_persistence_service = send_grid_persistence_service
        self.subscription_service = subscription_service
        self.plan_persistence = plans_persistence
        self.integration_service = integration_service
        self.partners_service = partners_service
        self.domain_persistence = domain_persistence
        self.UNLIMITED = -1

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def get_user_authorization_status_without_pixel(self, user):
        if user.get('is_with_card'):
            if user.get('company_name'):
                subscription_plan_is_active = self.subscription_service.is_user_has_active_subscription(user.get('id'))
                if subscription_plan_is_active:
                    return UserAuthorizationStatus.SUCCESS
                if user.get('stripe_payment_url'):
                    return UserAuthorizationStatus.PAYMENT_NEEDED
                return UserAuthorizationStatus.NEED_CHOOSE_PLAN
            return UserAuthorizationStatus.FILL_COMPANY_DETAILS
        if user.get('is_email_confirmed'):
            if user.get('company_name'):
                if user.get('is_book_call_passed'):
                    subscription_plan_is_active = self.subscription_service.is_user_has_active_subscription(
                        user.get('id'))
                    if subscription_plan_is_active:
                        return UserAuthorizationStatus.SUCCESS
                    if user.get('stripe_payment_url'):
                        return UserAuthorizationStatus.PAYMENT_NEEDED
                    return UserAuthorizationStatus.NEED_CHOOSE_PLAN
                return UserAuthorizationStatus.NEED_BOOK_CALL
            return UserAuthorizationStatus.FILL_COMPANY_DETAILS
        return UserAuthorizationStatus.NEED_CONFIRM_EMAIL

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    async def send_member_notification(self, user_id, title, notification_id):
        account_notification = self.db.query(AccountNotification).filter(AccountNotification.title == title).first()
        queue_name = f'sse_events_{str(user_id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': account_notification.text, 'notification_id': notification_id}
            )
        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()


    def save_account_notification(self, user_id, title, params=None):
        account_notification = self.db.query(AccountNotification).filter(AccountNotification.title == title).first()
        account_notification = UserAccountNotification(
            user_id=user_id,
            notification_id=account_notification.id,
            params=str(params),

        )
        self.db.add(account_notification)
        self.db.commit()
        return account_notification.id

    def add_user(self, is_with_card: bool, customer_id: str, user_form: dict, spi: str, awin_awc: str, access_token: str, shop_id: str, 
                 shop_data, coupon: str, utm_params: UtmParams):
        stripe_payment_url = None
        shop_domain = None
        if spi:
            plan = self.plan_persistence.get_plan_by_price_id(spi)
            if not plan:
                raise HTTPException(status.HTTP_404_NOT_FOUND, detail={'error': 'spi with this value does not exist'})
            
            trial_period = plan.trial_days
            stripe_payment_url = create_stripe_checkout_session(
                customer_id=customer_id,
                line_items=[{"price": spi, "quantity": 1}],
                mode="subscription",
                trial_period=trial_period,
                coupon=coupon
            )
            stripe_payment_url = stripe_payment_url.get('link')
        
        if shop_data and shop_data.shop:
            shop_domain = shop_data.shop
            
        utm_params_dict = utm_params.model_dump() if utm_params else {}
        utm_params_cleaned = {key: value for key, value in utm_params_dict.items() if value is not None}
        utm_params_json = json.dumps(utm_params_cleaned) if utm_params_cleaned else None

        source_platform = utm_params_cleaned.get('utm_source')
        if awin_awc:
            source_platform = SourcePlatformEnum.AWIN.value
        
        user_object = Users(
            email=user_form.get('email'),
            is_email_confirmed=user_form.get('is_email_confirmed', False),
            password=user_form.get('password'),
            is_company_details_filled=False,
            full_name=user_form.get('full_name'),
            created_at=self.get_utc_aware_date_for_mssql(),
            last_login=self.get_utc_aware_date_for_mssql(),
            customer_id=customer_id,
            last_signed_in=datetime.now(),
            added_on=datetime.now(),
            stripe_payment_url=stripe_payment_url,
            awin_awc = awin_awc,
            source_platform = source_platform,
            shop_id=shop_id,
            shopify_token=access_token,
            shop_domain=shop_domain,
            is_with_card=is_with_card,
            utm_params=utm_params_json
        )
        self.db.add(user_object)
        self.db.commit()
        return user_object

    def create_account_google(self, auth_google_data: AuthGoogleData):
        teams_token = auth_google_data.teams_token
        referral_token = auth_google_data.referral_token
        owner_id = None
        status = SignUpStatus.NEED_CHOOSE_PLAN
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        shopify_data = auth_google_data.shopify_data
        shopify_access_token = None
        shop_id = None
        coupon = auth_google_data.coupon
        ift = auth_google_data.ift
        awc = auth_google_data.awc if auth_google_data.awc else auth_google_data.utm_params.awc
        ftd = auth_google_data.ftd
        
        if shopify_data:
            try:
                with self.integration_service as service:
                    shopify_access_token = service.shopify.get_shopify_token(shopify_data=shopify_data)
                    shop_id = service.shopify.get_shopify_shop_id(
                        shopify_data=shopify_data, 
                        shopify_access_token=shopify_access_token
                    )
                
                if not shopify_access_token or not shop_id:
                    logger.error("Invalid Shopify access token or shop ID.")
                    return {
                        'status': OauthShopify.ERROR_SHOPIFY_TOKEN.value
                    }
            except Exception as e:
                logger.exception("An error occurred while processing Shopify data.")
                return {
                    'status': OauthShopify.ERROR_SHOPIFY_TOKEN.value
                }
        
        google_request = google_requests.Request()
        is_with_card = auth_google_data.is_with_card
        idinfo = id_token.verify_oauth2_token(str(auth_google_data.token), google_request, client_id)
        if idinfo:
            if teams_token:
                status = SignUpStatus.SUCCESS
                status_result = self.user_persistence_service.check_status_invitations(teams_token=teams_token,
                                                                                       user_mail=idinfo.get("email"))
                if status_result['success'] is False:
                    return {
                        'is_success': True,
                        'status': status_result['error']
                    }
                owner_id = status_result['team_owner_id']
            full_name = idinfo.get('given_name')
            family_name = idinfo.get('family_name')
            if family_name and family_name != 'None':
                full_name = ' '.join(filter(None, [full_name, family_name]))
            google_payload = {
                "email": idinfo.get("email"),
                "full_name": full_name,
                "password": None,
                "is_email_confirmed": True,
            }
            email = idinfo.get("email")
        else:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }

        check_user_object = self.user_persistence_service.get_user_by_email(email)
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {email}")
            return {
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }

        customer_id = stripe_service.create_customer_google(google_payload)
        user_object = self.add_user(is_with_card=is_with_card, customer_id=customer_id, user_form=google_payload,
                                    spi=auth_google_data.spi, awin_awc=awc, access_token=shopify_access_token, shop_id=shop_id, shop_data=shopify_data, 
                                    coupon=coupon, utm_params=auth_google_data.utm_params)
        
        if teams_token:
            notification_id = self.save_account_notification(user_object.id, NotificationTitles.TEAM_MEMBER_ADDED.value)
            self.send_member_notification(user_id=owner_id, title=NotificationTitles.TEAM_MEMBER_ADDED.value, notification_id=notification_id)
            self.user_persistence_service.update_teams_owner_id(user_id=user_object.id, teams_token=teams_token,
                                                                owner_id=owner_id)
            token_info = {
                "id": owner_id,
                "team_member_id": user_object.id
            }
        else:
            token_info = {
                "id": user_object.id,
            }
        token = create_access_token(token_info)
        logger.info("Token created")

        if shopify_data:
            self._process_shopify_integration(user_object, shopify_data, shopify_access_token, shop_id)

        self.user_persistence_service.email_confirmed(user_object.id)

        if referral_token is not None:
            self.user_persistence_service.book_call_confirmed(user_object.id)
            self.user_persistence_service.set_partner_role(user_object.id)
            self.subscription_service.create_subscription_from_free_trial(user_id=user_object.id, ftd=ftd)
            self.partners_service.setUser(user_object.email, user_object.id, "signup", datetime.datetime.now())
        
        if (ift and ift == 'arwt') or user_object.source_platform in (SourcePlatformEnum.BIG_COMMERCE.value, SourcePlatformEnum.SHOPIFY.value):
            self.user_persistence_service.book_call_confirmed(user_object.id)
            self.subscription_service.create_subscription_from_free_trial(user_id=user_object.id, ftd=ftd)
            
        if not user_object.is_with_card:
            return {
                'status': SignUpStatus.FILL_COMPANY_DETAILS,
                'token': token,
            }
        logger.info("Token created")
        return {
            'status': status,
            'token': token,
        }

    def get_user_authorization_information(self, user: Users):
        if user.is_with_card:
            if user.company_name:
                subscription_plan_is_active = self.subscription_service.is_user_has_active_subscription(user.id)
                if subscription_plan_is_active:
                    return {'status': LoginStatus.SUCCESS}
                else:
                    if user.stripe_payment_url:
                        return {
                            'status': LoginStatus.PAYMENT_NEEDED,
                            'stripe_payment_url': user.stripe_payment_url
                        }
                    else:
                        return {'status': LoginStatus.NEED_CHOOSE_PLAN}
            else:
                return {'status': LoginStatus.FILL_COMPANY_DETAILS}
        else:
            if user.is_email_confirmed:
                if user.company_name:
                    if user.is_book_call_passed:
                        subscription_plan_is_active = self.subscription_service.is_user_has_active_subscription(user.id)
                        if subscription_plan_is_active:
                            if user.is_pixel_installed:
                                return {'status': LoginStatus.SUCCESS}
                            else:
                                return {'status': LoginStatus.PIXEL_INSTALLATION_NEEDED}
                        else:
                            if user.stripe_payment_url:
                                return {
                                    'status': LoginStatus.PAYMENT_NEEDED,
                                    'stripe_payment_url': user.stripe_payment_url
                                }
                            else:
                                return {'status': LoginStatus.NEED_CHOOSE_PLAN}
                    else:
                        return {'status': LoginStatus.NEED_BOOK_CALL}
                else:
                    return {'status': LoginStatus.FILL_COMPANY_DETAILS}
        return {'status': LoginStatus.NEED_CONFIRM_EMAIL}

    def login_google(self, auth_google_data: AuthGoogleData):
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        idinfo = id_token.verify_oauth2_token(auth_google_data.token, google_request, client_id)
        if idinfo:
            email = idinfo.get("email")
        else:
            return {
                'status': LoginStatus.NOT_VALID_EMAIL
            }
        user_object = self.user_persistence_service.get_user_by_email(email)
        if user_object is None:
            return {
                'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
            }
            
        shopify_data = auth_google_data.shopify_data
        shopify_access_token = None
        shop_id = None
        shopify_status = None
        
        if shopify_data:
            try:
                with self.integration_service as service:
                    shopify_access_token = service.shopify.get_shopify_token(shopify_data=shopify_data)
                    shop_id = service.shopify.get_shopify_shop_id(
                        shopify_data=shopify_data, 
                        shopify_access_token=shopify_access_token
                    )
                if not shopify_access_token or not shop_id:
                    logger.error("Invalid Shopify access token or shop ID.")
                    shopify_status = OauthShopify.ERROR_SHOPIFY_TOKEN
            except Exception as e:
                logger.exception("An error occurred while processing Shopify data.")
                shopify_status = OauthShopify.ERROR_SHOPIFY_TOKEN
                
        if not user_object.is_email_confirmed:
            self.user_persistence_service.email_confirmed(user_object.id)
        if user_object:
            self.user_persistence_service.set_last_signed_in(user_id=user_object.id)
            if user_object.team_owner_id:
                token_info = {
                    "id": user_object.team_owner_id,
                    "team_member_id": user_object.id
                }
                user_object = self.user_persistence_service.get_user_by_id(user_object.team_owner_id, True)
            else:
                token_info = {
                    "id": user_object.id,
                }
            token = create_access_token(token_info)
            if shopify_data and shopify_status is None:
                if user_object.source_platform == SourcePlatformEnum.SHOPIFY.value:
                    user_subscription = self.subscription_service.get_user_subscription(user_object.id)
                    if user_subscription.domains_limit != self.UNLIMITED and \
                    self.domain_persistence.count_domain(user_object.id) >= user_subscription.domains_limit:
                        shopify_status = OauthShopify.NEED_UPGRADE_PLAN   
                else:
                    shopify_status = OauthShopify.NON_SHOPIFY_ACCOUNT

                if shopify_status is None:
                    self._process_shopify_integration(user_object, shopify_data, shopify_access_token, shop_id)
            
            authorization_data = self.get_user_authorization_information(user_object)
            if authorization_data['status'] == LoginStatus.PAYMENT_NEEDED:
                return {
                    'status': authorization_data['status'].value,
                    'token': token,
                    'stripe_payment_url': authorization_data.get('stripe_payment_url')
                }
            if authorization_data['status'] != UserAuthorizationStatus.SUCCESS:
                return {
                    'status': authorization_data['status'].value,
                    'token': token
                }
            return {
                'status': LoginStatus.SUCCESS,
                'token': token
            }
        else:
            logger.info("Password Verification Failed")
            return {
                'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
            }

    def create_account(self, user_form: UserSignUpForm):
        if not user_form.password or ' ' in user_form.password:
            logger.debug("Invalid password provided.")
            return {
                'is_success': True,
                'status': SignUpStatus.PASSWORD_NOT_VALID
            }
        user_form.password = get_password_hash(user_form.password.strip())
        
        if self.user_persistence_service.get_user_by_email(user_form.email):
            logger.info(f"User already exists with email: {user_form.email}")
            return {
                'is_success': True,
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }
        
        status = SignUpStatus.NEED_CHOOSE_PLAN
        owner_id = None
        shopify_data = user_form.shopify_data
        teams_token = user_form.teams_token
        referral_token = user_form.referral_token
        coupon = user_form.coupon
        shopify_access_token = None
        shop_id = None
        awc = user_form.awc if user_form.awc else user_form.utm_params.awc
        ift = user_form.ift
        ftd = user_form.ftd
        if shopify_data:
            try:
                with self.integration_service as service:
                    shopify_access_token = service.shopify.get_shopify_token(shopify_data=shopify_data)
                    shop_id = service.shopify.get_shopify_shop_id(
                        shopify_data=shopify_data, 
                        shopify_access_token=shopify_access_token
                    )
                if not shopify_access_token or not shop_id:
                    logger.error("Invalid Shopify access token or shop ID.")
                    return {
                        'status': OauthShopify.ERROR_SHOPIFY_TOKEN.value
                    }
            except Exception as e:
                logger.exception("An error occurred while processing Shopify data.")
                return {
                    'status': OauthShopify.ERROR_SHOPIFY_TOKEN.value
                }
            
        if teams_token:
            status = SignUpStatus.SUCCESS
            status_result = self.user_persistence_service.check_status_invitations(teams_token=teams_token,
                                                                                   user_mail=user_form.email)
            if status_result['success'] is False:
                return {
                    'is_success': True,
                    'status': status_result['error']
                }
            owner_id = status_result['team_owner_id']
            
        check_user_object = self.user_persistence_service.get_user_by_email(user_form.email)
        is_with_card = user_form.is_with_card
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {user_form.email}")
            return {
                'is_success': True,
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }
        customer_id = stripe_service.create_customer(user_form)
        user_data = {
            "email": user_form.email,
            "full_name": user_form.full_name,
            "password": user_form.password,
        }
        
        if user_form.spi:
            status = SignUpStatus.SUCCESS
            
        user_object = self.add_user(is_with_card=is_with_card, customer_id=customer_id, user_form=user_data,
                                    spi=user_form.spi, awin_awc=awc, access_token=shopify_access_token, shop_id=shop_id, shop_data=shopify_data,
                                    coupon=coupon, utm_params=user_form.utm_params)
        
        if teams_token:
            notification_id = self.save_account_notification(user_object.id, NotificationTitles.TEAM_MEMBER_ADDED.value)
            self.send_member_notification(user_id=owner_id, title=NotificationTitles.TEAM_MEMBER_ADDED.value, notification_id=notification_id)
            self.user_persistence_service.update_teams_owner_id(user_id=user_object.id, teams_token=teams_token,
                                                                owner_id=owner_id)
            token_info = {
                "id": owner_id,
                "team_member_id": user_object.id
            }
        else:
            token_info = {
                "id": user_object.id
            }
        token = create_access_token(token_info)
        logger.info("Token created")
        
        if shopify_data:
            self._process_shopify_integration(user_object, shopify_data, shopify_access_token, shop_id)
            self.user_persistence_service.email_confirmed(user_object.id)
            
        if (ift and ift == 'arwt') or user_object.source_platform in (SourcePlatformEnum.BIG_COMMERCE.value, SourcePlatformEnum.SHOPIFY.value):
            self.user_persistence_service.book_call_confirmed(user_object.id)
            self.subscription_service.create_subscription_from_free_trial(user_id=user_object.id, ftd=ftd)
            
        if is_with_card is False and teams_token is None and referral_token is None and shopify_data is None:
            return self._send_email_verification(user_object, token)
        
        if referral_token is not None:
            self.user_persistence_service.book_call_confirmed(user_object.id)
            self.user_persistence_service.email_confirmed(user_object.id)
            self.user_persistence_service.set_partner_role(user_object.id)
            self.subscription_service.create_subscription_from_free_trial(user_id=user_object.id, ftd=ftd)
            partner = self.partners_service.setUser(user_object.email, user_object.id, "signup", datetime.now())
            if not partner.get("status"):
                error = partner.get("error", {}) or {}
                return {
                    'is_success': True,
                    'status': error.get("message", "Unknown error occurred")
                }
            
        if teams_token is None:
            return {
                'is_success': True,
                'status': SignUpStatus.FILL_COMPANY_DETAILS,
                'token': token
            }

        return {
            'is_success': True,
            'status': status,
            'token': token
        }
    
    def _process_shopify_integration(self, user_object, shopify_data, shopify_access_token, shop_id):
        domain = self.user_persistence_service.save_user_domain(user_object.id, shopify_data.shop)
        credentials = IntegrationCredentials(
                            shopify=ShopifyOrBigcommerceCredentials(shop_domain=shopify_data.shop, access_token=shopify_access_token)
                        )
        with self.integration_service as service:
            service.shopify.add_integration(credentials, domain, user_object.__dict__, shop_id)
            service.shopify.create_webhooks_for_store(shopify_data=shopify_data, shopify_access_token=shopify_access_token)
        
        if not user_object.shop_id:
            user_object.shop_id = shop_id
            user_object.shopify_token = shopify_access_token
            user_object.shop_domain = shopify_data.shop
            self.partners_service.setUser(user_object.email, user_object.id, "active")
        user_object.source_platform = SourcePlatformEnum.SHOPIFY.value
        self.db.commit()
       
    def _send_email_verification(self, user_object, token):
        template_id = self.send_grid_persistence_service.get_template_by_alias(SendgridTemplate.EMAIL_VERIFICATION_TEMPLATE.value)
        if not template_id:
            return {'is_success': False, 'error': 'email template not found'}
        
        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}"
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=user_object.email,
            template_id=template_id,
            template_placeholder={"full_name": user_object.full_name, "link": confirm_email_url}
        )
        self.user_persistence_service.set_verified_email_sent_now(user_object.id)
        logger.info("Confirmation Email Sent")
        return {
            'is_success': True,
            'status': SignUpStatus.NEED_CONFIRM_EMAIL,
            'token': token
        }

    def login_account(self, login_form: UserLoginForm):
        email = login_form.email
        user_object = self.user_persistence_service.get_user_by_email(email)
        if not user_object:
            return {'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL}
        if not user_object.password:
            return {'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL}
        
        password = login_form.password
        shopify_data = login_form.shopify_data
        shopify_access_token = None
        shop_id = None
        shopify_status = None
        
        check_password = verify_password(password, user_object.password)
        if not check_password:
            logger.info("Password Verification Failed")
            return {
                'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
            }
        
        if shopify_data:
            try:
                with self.integration_service as service:
                    shopify_access_token = service.shopify.get_shopify_token(shopify_data=shopify_data)
                    shop_id = service.shopify.get_shopify_shop_id(
                        shopify_data=shopify_data, 
                        shopify_access_token=shopify_access_token
                    )
                if not shopify_access_token or not shop_id:
                    logger.error("Invalid Shopify access token or shop ID.")
                    shopify_status = OauthShopify.ERROR_SHOPIFY_TOKEN
            except Exception as e:
                logger.exception("An error occurred while processing Shopify data.")
                shopify_status = OauthShopify.ERROR_SHOPIFY_TOKEN
                
        logger.debug("Password verification passed")
        self.user_persistence_service.set_last_signed_in(user_id=user_object.id)
        if user_object.team_owner_id:
            token_info = {
                "id": user_object.team_owner_id,
                "team_member_id": user_object.id
            }
            user_object = self.user_persistence_service.get_user_by_id(user_object.team_owner_id, True)
        else:
            token_info = {
                "id": user_object.id,
            }
        token = create_access_token(token_info)
        
        if shopify_data and shopify_status is None:
            if user_object.source_platform == SourcePlatformEnum.SHOPIFY.value:
                user_subscription = self.subscription_service.get_user_subscription(user_object.id)
                if user_subscription.domains_limit != self.UNLIMITED and \
                self.domain_persistence.count_domain(user_object.id) >= user_subscription.domains_limit:
                    shopify_status = OauthShopify.NEED_UPGRADE_PLAN   
            else:
                shopify_status = OauthShopify.NON_SHOPIFY_ACCOUNT

            if shopify_status is None:
                self._process_shopify_integration(user_object, shopify_data, shopify_access_token, shop_id)
            
        authorization_data = self.get_user_authorization_information(user_object)
        
        if authorization_data['status'] == LoginStatus.PAYMENT_NEEDED:
            return {
                'status': authorization_data['status'].value,
                'token': token,
                'stripe_payment_url': authorization_data.get('stripe_payment_url')
            }
        if authorization_data['status'] != LoginStatus.SUCCESS:
            return {
                'status': authorization_data['status'].value,
                'token': token
            }
        return {
            'status': shopify_status if shopify_status else LoginStatus.SUCCESS,
            'token': token
        }

    def verify_token(self, token):
        try:
            data = decode_jwt_data(token)
        except:
            return {'status': VerifyToken.INCORRECT_TOKEN}
        check_user_object = self.user_persistence_service.get_user_by_id(data.get('id'))
        if check_user_object:
            if check_user_object.get('is_email_confirmed'):
                if check_user_object.get('team_owner_id'):
                    token_info = {
                        "id": check_user_object.get('team_owner_id'),
                        "team_member_id": check_user_object.get('id')
                    }
                else:
                    token_info = {
                        "id": check_user_object.get('id'),
                    }
                user_token = create_access_token(token_info)
                return {
                    'status': VerifyToken.EMAIL_ALREADY_VERIFIED,
                    'user_token': user_token
                }
            self.user_persistence_service.email_confirmed(check_user_object.get('id'))
            if check_user_object.get('team_owner_id'):
                token_info = {
                    "id": check_user_object.get('team_owner_id'),
                    "team_member_id": check_user_object.get('id')
                }
            else:
                token_info = {
                    "id": check_user_object.get('id'),
                }
            user_token = create_access_token(token_info)
            return {
                'status': VerifyToken.SUCCESS,
                'user_token': user_token
            }
        return {'status': VerifyToken.INCORRECT_TOKEN}

    def reset_password(self, reset_password_form: ResetPasswordForm):
        if reset_password_form:
            db_user = self.user_persistence_service.get_user_by_email(reset_password_form.email)
            if db_user is None:
                return ResetPasswordEnum.SUCCESS
            message_expiration_time = db_user.reset_password_sent_at
            time_now = datetime.now()
            if message_expiration_time is not None:
                if (message_expiration_time + timedelta(minutes=1)) > time_now:
                    return ResetPasswordEnum.RESEND_TOO_SOON
            if db_user.team_owner_id:
                token_info = {
                    "id": db_user.team_owner_id,
                    "team_member_id": db_user.id
                }
            else:
                token_info = {
                    "id": db_user.id,
                }

            token = create_access_token(token_info)
            template_id = self.send_grid_persistence_service.get_template_by_alias(
                SendgridTemplate.FORGOT_PASSWORD_TEMPLATE.value)
            if db_user:
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/forgot-password?token={token}"
                mail_object = SendgridHandler()
                mail_object.send_sign_up_mail(
                    to_emails=db_user.email,
                    template_id=template_id,
                    template_placeholder={"full_name": db_user.full_name, "link": confirm_email_url,
                                          "email": db_user.email},
                )
                self.user_persistence_service.set_reset_password_sent_now(db_user.id)
                logger.info("Confirmation Email Sent")
                return ResetPasswordEnum.SUCCESS
        return ResetPasswordEnum.NOT_VALID_EMAIL
