import boto3 
import os

def get_s3_client():
    return boto3.client(
                's3',
                aws_access_key_id=os.getenv('S3_KEY_ID'),
                aws_secret_access_key=os.getenv('S3_KEY_SECRET'),
                region_name='us-east-2'
            )
