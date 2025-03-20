import sys
import webbrowser
from time import gmtime, strftime
from suds import WebFault

from bingads.service_client import ServiceClient
from bingads.authorization import *
from bingads.v13 import *

DEVELOPER_TOKEN='1451H5GIKV096293'
ENVIRONMENT='sandbox' # If you use 'production' then you must also update the DEVELOPER_TOKEN value.
CLIENT_ID='a9a7ed83-a423-4713-9d34-232646858381'
CLIENT_STATE='ClientStateGoesHere'
REFRESH_TOKEN="1.AQwAoMOu-2xxzUSHxit-r-dIM4Ptp6kjpBNHnTQjJkaFg4HdAFQMAA.AgABAwEAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P8MrYbEzuK3jwX_Lg0H4EbnZ21CQ1mcmFFD_-DGqNFSt9GavqevMZL_-ErmxRXDr5nFzp4yrHbyOYQpxInLOVZCE-j72Bt5DDTcmhOxDXFCFELzUbQ06tp-JsMVJJhVhgRsD2j6dgstYPTPZtYRVdZErw0Fo0AZ18zn6W-D7ZJLmGRdiE8n3fo1uTtn7SNsFOdV7e86n3YXbtdEXGjTipj9ZJNx5kG_Fb73-ifq4AzFkD6zICN59nebcGL6nlnGZ1Bt1HsVugjolmrLxv9Tmggjrx4sj5HxnWpiBOI-T4_TX9ST0O7UuDgcIH1uRePW8girxXNaD6WnqxsIV17TTYc0P5zoHvigNCMwRU7iWEIBlNi50C1cCejiVK90Q9sgPSg8V4bXMYoZXa8sjGUbJPK2TePHNK5kpmCYWlMS2OlsM2yLbGBWDrA9A2uM9LF4xNq9-H8DekLREMNJdzekBL12l7mgA3mH-eVUQIdfptMDulFYXOUbd4wFsS8C_CdaCUbe-TsD7YhydxbUIAT_c8iBsBl5h15oewy_z0iVMFAmgc7_m75tdMvgIdb0JZjnXqfKTjT5G2hy4CEjGhIgJZ_CtfY06s1bLhayECIiYgiAtU3PegHxurxIGEgsOKh34t1O3mqzlMqL2Yz9kZ_U_oDedA1hI_ShOOcpJDa2Ia2CYwwRanVc-xANaAjb5-vZ57bb8aMirGg7-nvhHEXGDGqNbSu5sJk"

def authenticate(authorization_data):
    customer_service=ServiceClient(
        service='CustomerManagementService', 
        version=13,
        authorization_data=authorization_data, 
        environment=ENVIRONMENT,
    )

    # You should authenticate for Bing Ads services with a Microsoft Account.
    authenticate_with_oauth(authorization_data)
        
    # Set to an empty user identifier to get the current authenticated Bing Ads user,
    # and then search for all accounts the user can access.
    user=customer_service.GetUser(
        UserId=None
    ).User
    accounts=search_accounts_by_user_id(customer_service, user.Id)
    
    # For this example we'll use the first account.
    authorization_data.account_id=accounts['AdvertiserAccount'][0].Id
    authorization_data.customer_id=accounts['AdvertiserAccount'][0].ParentCustomerId
 
def authenticate_with_oauth(authorization_data):
    
    authentication=OAuthDesktopMobileAuthCodeGrant(
        client_id=CLIENT_ID,
        env=ENVIRONMENT
    )
    authentication.state=CLIENT_STATE
    authorization_data.authentication=authentication
    refresh_token=REFRESH_TOKEN
    
    try:
        if refresh_token is not None:
            authorization_data.authentication.request_oauth_tokens_by_refresh_token(refresh_token)
        else:
            request_user_consent(authorization_data)
    except OAuthTokenRequestException as e:
        print(e)
        # The user could not be authenticated or the grant is expired. 
        # The user must first sign in and if needed grant the client application access to the requested scope.
        request_user_consent(authorization_data)
            
def request_user_consent(authorization_data):
    webbrowser.open(authorization_data.authentication.get_authorization_endpoint(), new=1)
    # For Python 3.x use 'input' instead of 'raw_input'
    if(sys.version_info.major >= 3):
        response_uri=input(
            "You need to provide consent for the application to access your Bing Ads accounts. " \
            "After you have granted consent in the web browser for the application to access your Bing Ads accounts, " \
            "please enter the response URI that includes the authorization 'code' parameter: \n"
        )
    else:
        response_uri=input(
            "You need to provide consent for the application to access your Bing Ads accounts. " \
            "After you have granted consent in the web browser for the application to access your Bing Ads accounts, " \
            "please enter the response URI that includes the authorization 'code' parameter: \n"
        )

    if authorization_data.authentication.state != CLIENT_STATE:
       raise Exception("The OAuth response state does not match the client request state.")

    # Request access and refresh tokens using the URI that you provided manually during program execution.
    authorization_data.authentication.request_oauth_tokens_by_response_uri(response_uri=response_uri) 

def save_refresh_token(oauth_tokens):
    ''' 
    Stores a refresh token locally. Be sure to save your refresh token securely.
    '''
    print(oauth_tokens)
    with open(REFRESH_TOKEN,"w+") as file:
        file.write(oauth_tokens.refresh_token)
        file.close()
    return None

def search_accounts_by_user_id(customer_service, user_id):
    ''' 
    Search for account details by UserId.
    
    :param user_id: The Bing Ads user identifier.
    :type user_id: long
    :return: List of accounts that the user can manage.
    :rtype: Dictionary of AdvertiserAccount
    '''

    predicates={
        'Predicate': [
            {
                'Field': 'UserId',
                'Operator': 'Equals',
                'Value': user_id,
            },
        ]
    }

    accounts=[]

    page_index = 0
    PAGE_SIZE=100
    found_last_page = False

    while (not found_last_page):
        paging=set_elements_to_none(customer_service.factory.create('ns5:Paging'))
        paging.Index=page_index
        paging.Size=PAGE_SIZE
        search_accounts_response = customer_service.SearchAccounts(
            PageInfo=paging,
            Predicates=predicates
        )
        
        if search_accounts_response is not None and hasattr(search_accounts_response, 'AdvertiserAccount'):
            accounts.extend(search_accounts_response['AdvertiserAccount'])
            found_last_page = PAGE_SIZE > len(search_accounts_response['AdvertiserAccount'])
            page_index += 1
        else:
            found_last_page=True
    
    return {
        'AdvertiserAccount': accounts
    }

def set_elements_to_none(suds_object):
    # Bing Ads Campaign Management service operations require that if you specify a non-primitive, 
    # it must be one of the values defined by the service i.e. it cannot be a nil element. 
    # Since SUDS requires non-primitives and Bing Ads won't accept nil elements in place of an enum value, 
    # you must either set the non-primitives or they must be set to None. Also in case new properties are added 
    # in a future service release, it is a good practice to set each element of the SUDS object to None as a baseline. 

    for (element) in suds_object:
        suds_object.__setitem__(element[0], None)
    return suds_object

# Set the read-only properties of a campaign to null. This operation can be useful between calls to
# GetCampaignsByIds and UpdateCampaigns. The update operation would fail if you send certain read-only
# fields.
def set_read_only_campaign_elements_to_none(campaign):
    if campaign is not None:
        campaign.CampaignType=None
        campaign.Settings=None
        campaign.Status=None

# Set the read-only properties of an ad extension to null. This operation can be useful between calls to
# GetAdExtensionsByIds and UpdateAdExtensions. The update operation would fail if you send certain read-only
# fields.
def set_read_only_ad_extension_elements_to_none(extension):
    if extension is None or extension.Id is None:
        return extension
    else:
        # Set to None for all extension types.
        extension.Version = None
    
        if extension.Type == 'LocationAdExtension':
            extension.GeoCodeStatus = None
        
        return extension



authorization_data = AuthorizationData(
        developer_token=DEVELOPER_TOKEN,
        authentication=None,
        customer_id=None,
        account_id=None,
    )

authenticate(authorization_data)