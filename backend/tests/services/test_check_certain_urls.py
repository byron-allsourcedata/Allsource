import unittest
from unittest.mock import MagicMock
import os, sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)

from utils import check_certain_urls
from services.integrations.webhook import WebhookIntegrationService

class TestCheckCertainUrls(unittest.TestCase):

    def setUp(self):
        pass
        

    def test_map_all_phone_numbers(self):
        activate_certain_urls = 'https://test-w.com/post'
        result = check_certain_urls('test-w.com/post', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'https://test-w.com/post'
        result = check_certain_urls('test-w.com/post/', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'https://test-w.com/post/'
        result = check_certain_urls('test-w.com/post', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'https://test-w.com/help'
        result = check_certain_urls('test-w.com/post', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = 'https://test-w.com/help'
        result = check_certain_urls('https://test-w.com', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = '/my.html'
        result = check_certain_urls('test-w.com/post/my.html', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'post'
        result = check_certain_urls('test-w.com/post/my.html', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'posts'
        result = check_certain_urls('test-w.com/post/my.html', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = 'https://test-w.com/post/#'
        result = check_certain_urls('https://test-w.com/post/', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = 'https://test-w.com/post/#'
        result = check_certain_urls('https://test-w.com/post/#', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'https://test-w.com/post/#/'
        result = check_certain_urls('https://test-w.com/post/#', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'https://test-w.com/post/#/?par1=val1&par2=val2'
        result = check_certain_urls('https://test-w.com/post/#/?par1=val1&par2=val2', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'https://test-w.com/post/#/?par1=val1&par2=val2'
        result = check_certain_urls('https://test-w.com/post/#/?par1=val1', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = 'https://my-web.com/leads/?par1=val1&par2=val2'
        result = check_certain_urls('https://my-web.com/leads/?par1=val1&par2=val2', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'leads/?par1=val1&par2=val2'
        result = check_certain_urls('https://my-web.com/leads/?par1=val1', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = 'leads/?par1=val1'
        result = check_certain_urls('https://my-web.com/leads/?par1=val1', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'leads/?par2=val2&par1=val1'
        result = check_certain_urls('https://my-web.com/leads/?par1=val1&par2=val2', activate_certain_urls)
        self.assertEqual(False, result)
        
        activate_certain_urls = 'http://my-web.com/leads/?par1=val1&par2=val2'
        result = check_certain_urls('https://my-web.com/leads/?par1=val1&par2=val2', activate_certain_urls)
        self.assertEqual(True, result)
        
        activate_certain_urls = 'http://my-we.com/leads/?par1=val1&par2=val2'
        result = check_certain_urls('https://my-web.com/leads/?par1=val1&par2=val2', activate_certain_urls)
        self.assertEqual(False, result)
    
if __name__ == '__main__':
    unittest.main()
