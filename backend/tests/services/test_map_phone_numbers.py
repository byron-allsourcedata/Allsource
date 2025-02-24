import unittest
from unittest.mock import MagicMock
import os, sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)

from services.integrations.webhook import WebhookIntegrationService

class TestMapPhoneNumbers(unittest.TestCase):

    def setUp(self):
        self.five_x_five_user = MagicMock()
        self.five_x_five_user.direct_number = None
        self.five_x_five_user.personal_phone = None
        self.five_x_five_user.mobile_phone = None

        self.mapped_fields = ["business_phone", "personal_phone"]

    def test_map_all_phone_numbers(self):
        self.five_x_five_user.direct_number = "+17639728380, +17634774917"
        self.five_x_five_user.personal_phone = "+17639728380, +17634774917"
        self.five_x_five_user.mobile_phone = "+17633558737, +17634775926"
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        self.assertEqual(properties["business_phone"], "+17639728380, +17634774917")
        self.assertEqual(properties["personal_phone"], "+17639728380, +17634774917, +17633558737, +17634775926")

    def test_only_business_phone(self):
        self.five_x_five_user.direct_number = "1234567890"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["business_phone"], "+1234567890")
        self.assertIsNone(properties["personal_phone"])
    
    def test_not_business_phone_and_personal_phone(self):
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertIsNone(properties["business_phone"])
        self.assertIsNone(properties["personal_phone"])
        
    def test_only_direct_number_and_personal_phone(self):
        self.five_x_five_user.direct_number = "+12183871358, +13103181059, +13104060034, +14243042431"
        self.five_x_five_user.personal_phone = "+16152219061, +13036808205"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["business_phone"], "+12183871358, +13103181059, +13104060034, +14243042431")
        self.assertEqual(properties["personal_phone"], "+16152219061, +13036808205")

    def test_only_direct_number_and_mobile_phone(self):
        self.five_x_five_user.direct_number = "+12183871358, +13103181059, +13104060034, +14243042431"
        self.five_x_five_user.mobile_phone = "+16152219061, +13036808205"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["business_phone"], "+12183871358, +13103181059, +13104060034, +14243042431")
        self.assertEqual(properties["personal_phone"], "+16152219061, +13036808205")
        
    def test_only_personal_phone_and_mobile_phone(self):
        self.five_x_five_user.personal_phone = "+15179204504"
        self.five_x_five_user.mobile_phone = "+12056023006, +12052854708, +12056020397, +12054820189"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["business_phone"], "+12056023006, +12052854708, +12056020397, +12054820189")
        self.assertEqual(properties["personal_phone"], "+15179204504")
    
    def test_only_mobile_phone(self):
        self.five_x_five_user.mobile_phone = "+12056023006, +12052854708, +12056020397, +12054820189"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["business_phone"], "+12056023006, +12052854708, +12056020397, +12054820189")
        self.assertEqual(properties["personal_phone"], "+12056023006, +12052854708, +12056020397, +12054820189")
    
    def test_only_personal_phone(self):
        self.five_x_five_user.personal_phone = "1234567890"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["personal_phone"], "+1234567890")
        self.assertIsNone(properties["business_phone"])
        
    def test_business_phone_not_in_properties(self):
        self.mapped_fields.remove("business_phone")
        self.five_x_five_user.direct_number = "+17639728380, +17634774917"
        self.five_x_five_user.personal_phone = "+17639728380, +17634774917"
        self.five_x_five_user.mobile_phone = "+17633558737, +17634775926"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertEqual(properties["personal_phone"], "+17639728380, +17634774917, +17633558737, +17634775926")
    def test_business_phone_not_in_properties_only_direct_number(self):
        self.mapped_fields.remove("business_phone")
        self.five_x_five_user.direct_number = "+17639728380, +17634774917"
        
        properties = WebhookIntegrationService.map_phone_numbers(self.five_x_five_user, self.mapped_fields)
        
        self.assertIsNone(properties["personal_phone"])
    
if __name__ == '__main__':
    unittest.main()
