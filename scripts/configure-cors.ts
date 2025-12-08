
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3"
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error("Missing R2 credentials in .env.local")
    process.exit(1)
}

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
})

async function configureCors() {
    console.log(`Configuring CORS for bucket: ${bucketName}...`)

    const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
            CORSRules: [
                {
                    AllowedHeaders: ["*"],
                    AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
                    AllowedOrigins: ["*"], // Allow all origins (localhost, vercel, etc.)
                    ExposeHeaders: ["ETag"],
                    MaxAgeSeconds: 3000,
                },
            ],
        },
    })

    try {
        await r2.send(command)
        console.log("Successfully configured CORS!")
    } catch (err) {
        console.error("Error configuring CORS:", err)
    }
}

configureCors()
