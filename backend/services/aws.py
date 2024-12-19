
class AWSService:

    def __init__(self, s3_client) -> None:
        self.s3_client = s3_client

    def upload_string(self, string_data: str, object_name: str) -> None:
        self.s3_client.put_object(Bucket='maximiz-data', Key=object_name, Body=string_data)
    
    def upload_stringa(self, string_data: str, object_name: str) -> None:
        self.s3_client.put_object(Bucket='maximiz-data', Key=object_name, Body=string_data, ACL='public-read', ContentType="image/jpeg")

    def file_exists(self, key)-> bool:
        try:
            self.s3_client.head_object(Bucket='maximiz-data', Key=key)
            return True
        except Exception:
            return False

    def download_file(self, bucket_name: str, object_name: str, file_name: str) -> None:
        self.s3_client.download_file(bucket_name, object_name, file_name)

    def list_files(self, bucket_name: str) -> list:
        response = self.s3_client.list_objects_v2(Bucket=bucket_name)
        return [item['Key'] for item in response.get('Contents', [])]