import boto3 
import os

class AWSClient:
    def __init__(self) -> None:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=os.getenv('S3_KEY_ID'),
                aws_secret_access_key=os.getenv('S3_KEY_SECRET'),
                region_name='us-west-2'
            )

    def upload_string(self, string_data: str, object_name: str) -> None:
        self.s3_client.put_object(Bucket='maximiz-data', Key=object_name, Body=string_data)

    def download_file(self, bucket_name: str, object_name: str, file_name: str) -> None:
        self.s3_client.download_file(bucket_name, object_name, file_name)

    def list_files(self, bucket_name: str) -> list:
        response = self.s3_client.list_objects_v2(Bucket=bucket_name)
        return [item['Key'] for item in response.get('Contents', [])]