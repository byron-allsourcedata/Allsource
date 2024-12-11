import pytest
from unittest.mock import MagicMock
from urllib.parse import urlparse
import os, sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
parent_parent_dir = os.path.abspath(os.path.join(parent_dir, os.pardir))
sys.path.append(parent_parent_dir)

from services.partners_assets import PartnersAssetService 
from models.partners_asset import PartnersAsset 


@pytest.fixture
def mock_persistence():
    return MagicMock()


@pytest.fixture
def service(mock_persistence):
    return PartnersAssetService(partners_asset_persistence=mock_persistence)


def test_get_assets(service, mock_persistence):
    mock_assets = [
        PartnersAsset(
            id=1,
            title="Asset 1",
            type="Image",
            preview_url="http://example.com/preview1.png",
            file_url="http://example.com/file1.png"
        ),
        PartnersAsset(
            id=2,
            title="Asset 2",
            type="Video",
            preview_url="http://example.com/preview2.png",
            file_url="http://example.com/file2.mp4"
        ),
    ]
    mock_persistence.get_assets.return_value = mock_assets

    service.get_file_size = MagicMock(return_value="1.23 MB")
    service.get_file_extension = MagicMock(return_value="Png")

    assets = service.get_assets()

    assert len(assets) == 2
    assert assets[0]["id"] == 1
    assert assets[0]["file_extension"] == "Png"
    assert assets[0]["file_size"] == "1.23 MB"
    mock_persistence.get_assets.assert_called_once()


def test_get_file_size_success(mocker, service):
    mock_response = mocker.patch("requests.head")
    mock_response.return_value.status_code = 200
    mock_response.return_value.headers = {"Content-Length": "912261"}

    file_url = "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg"
    file_size = service.get_file_size(file_url)
    
    assert file_size == "0.87 MB"
    mock_response.assert_called_once_with(file_url, allow_redirects=True, timeout=5) 


def test_get_file_size_failure(mocker, service):
    mock_response = mocker.patch("requests.head")
    mock_response.side_effect = Exception("Network error")

    file_url = "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg"
    file_size = service.get_file_size(file_url)

    assert file_size == "0.00 MB"
    mock_response.assert_called_once_with(file_url, allow_redirects=True, timeout=5)


def test_get_file_extension_valid(service):
    file_url = "http://example.com/file.png"
    extension = service.get_file_extension(file_url)
    assert extension == "Png"


def test_get_file_extension_no_extension(service):
    file_url = "http://example.com/file"
    extension = service.get_file_extension(file_url)
    assert extension == "Unknown"


def test_domain_mapped_with_unknown_extension_and_size(service):
    mock_asset = PartnersAsset(
        id=1,
        title="Asset 1",
        type="Image",
        preview_url="http://example.com/preview.png",
        file_url="http://example.com/file"
    )

    mapped_asset = service.domain_mapped(mock_asset)

    assert mapped_asset["file_extension"] == "Unknown"
    assert mapped_asset["file_size"] == "0.00 MB"

    
