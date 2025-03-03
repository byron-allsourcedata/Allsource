import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { fileType } = await req.json();

    const currentTime = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `audience_sources/${currentTime}`;

    const s3Client = new S3Client({
      region: "us-east-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const params = {
      Bucket: "maximiz-data",
      Key: fileName,
      ContentType: fileType,
    };

    const command = new PutObjectCommand(params);

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ url: presignedUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
