# Serverless-Thumbnail-Creation

See https://github.com/awslabs/serverless-image-handler instead.

## Description

Here, we have expertise in Lambda where create different image sizes after you uploaded the origin image to the AWS s3 storage.

# S3 storage

Amazon S3 stores data as objects within resources called “buckets”. You can store as many objects as you want within a bucket, and write, read, and delete objects in your bucket. Amazon S3 Storage Management features allow customers to take a data-driven approach to storage optimization, compliance, and management efficiency. 

# Lambda  

If you want to create a thumbnail for each image (.jpg and .png objects) that is uploaded to a bucket. You can create a Lambda function (Thumbnail) that Amazon S3 can invoke when objects are created.

Lambda function can read the image object from the source bucket and create a thumbnail image target bucket.

# Usage

1. Create the Lambda function

The Lambda function uses [ImageMagick][ImageMagick] for image resizing which requires
   native extensions. In order to run on Lambda, it must be run on on Amazon
   Lambda node js blue print. You can also accomplish this in one of two ways:

   - Upload the contents of the `lambda` subdirectory to an [Amazon EC2 instance
     running Amazon Linux][amazon-linux] and run `npm install`, or

   - Use the Amazon Linux Docker container image to build the package using your
     local system. This repo includes Makefile that will download Amazon Linux,
     install Node.js and developer tools, and build the extensions using Docker.
     Run `make all`.

2. Upload the code on lambda function

    - Zip the source code folder on your local.

    - Upload the zip file on AWS lambda function.

3. Test the function

    Upload an image to the S3 bucket and try to resize it via your web browser to different sizes, e.g. with an image uploaded in the bucket called image.png:

    - Open the Thumbnail and Headshot url.

4. (Optional) Restrict resize dimensions.

    - To maintain performance and good quality , you can restrict the image while uploading into an S3 bucket.


# Result

   ![S3-Thumbnail-Creation](https://github.com/sumit1khandelwal/serverless-thumbnail-creation/tree/master/v1/S3-Thumbnail-Creation.png)
