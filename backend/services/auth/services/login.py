from enums import LoginStatus, OauthShopify
from resolver import injectable
from ..schemas import SuccessfulLoginResult


@injectable
class LoginService:
    def __init__(self):
        pass

    def get_successful_result(
        self,
        roles: list[str] | None,
        token: str,
        is_partner: bool | None,
        shopify_status: OauthShopify | None = None,
    ) -> SuccessfulLoginResult:
        if roles is not None and "admin" in roles:
            status = LoginStatus.SUCCESS_ADMIN
        else:
            status = LoginStatus.SUCCESS

        is_partner = bool(is_partner)

        return SuccessfulLoginResult(
            status=status,
            token=token,
            is_partner=is_partner,
            shopify_status=shopify_status,
        )
