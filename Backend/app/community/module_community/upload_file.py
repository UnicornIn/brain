from botocore.exceptions import NoCredentialsError
import uuid
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
BUCKET_NAME = "imgbrain"
REGION = "us-east-1"

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=REGION
)

async def upload_image_to_s3(file, folder="communities"):
    try:
        filename = f"{folder}/{uuid.uuid4()}.jpg"
        
        s3.upload_fileobj(
            file.file,
            BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": file.content_type}  # Muy importante
        )

        file_url = f"https://{BUCKET_NAME}.s3.{REGION}.amazonaws.com/{filename}"
        return file_url

    except NoCredentialsError:
        raise Exception("S3 credentials not configured properly")

    
async def delete_image_from_s3(file_key: str):
    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=file_key)
    except Exception as e:
        raise Exception(f"Failed to delete image from S3: {e}")

