from config.util import getenv, get_int_env


class AWSConfig:
    aws_cloud_url = getenv("S3_URL")
