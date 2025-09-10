# Terraform configuration for ApniDukaan E-commerce Platform
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 Bucket for product images
resource "aws_s3_bucket" "product_images" {
  bucket = "${var.project_name}-product-images-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "ApniDukaan Product Images"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Random string for bucket suffix to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket CORS configuration
resource "aws_s3_bucket_cors_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# S3 Bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  rule {
    id     = "image_lifecycle"
    status = "Enabled"

    expiration {
      days = 3650 # 10 years
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "product_images" {
  name                              = "${var.project_name}-product-images-oac"
  description                       = "OAC for ApniDukaan product images"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "product_images" {
  origin {
    domain_name              = aws_s3_bucket.product_images.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.product_images.id
    origin_id                = "S3-${aws_s3_bucket.product_images.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "ApniDukaan Product Images CDN"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.product_images.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache behavior for images with longer TTL
  ordered_cache_behavior {
    path_pattern     = "images/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.product_images.bucket}"
    compress         = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 86400  # 1 day
    max_ttl     = 31536000 # 1 year
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "ApniDukaan Product Images CDN"
    Environment = var.environment
    Project     = var.project_name
  }
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.product_images.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.product_images.arn
          }
        }
      }
    ]
  })
}

# Lambda function for image optimization
resource "aws_lambda_function" "image_optimizer" {
  filename         = "image_optimizer.zip"
  function_name    = "${var.project_name}-image-optimizer"
  role            = aws_iam_role.lambda_image_optimizer.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.image_optimizer_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.product_images.bucket
      CLOUDFRONT_DOMAIN = aws_cloudfront_distribution.product_images.domain_name
    }
  }

  tags = {
    Name        = "ApniDukaan Image Optimizer"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM role for Lambda image optimizer
resource "aws_iam_role" "lambda_image_optimizer" {
  name = "${var.project_name}-lambda-image-optimizer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda image optimizer
resource "aws_iam_role_policy" "lambda_image_optimizer" {
  name = "${var.project_name}-lambda-image-optimizer-policy"
  role = aws_iam_role.lambda_image_optimizer.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.product_images.arn}/*"
      }
    ]
  })
}

# Archive file for Lambda function
data "archive_file" "image_optimizer_zip" {
  type        = "zip"
  output_path = "image_optimizer.zip"
  source {
    content = file("${path.module}/lambda/image_optimizer.js")
    filename = "index.js"
  }
}

# API Gateway for image upload
resource "aws_api_gateway_rest_api" "image_upload" {
  name        = "${var.project_name}-image-upload-api"
  description = "API for uploading and optimizing product images"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "ApniDukaan Image Upload API"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway resource for upload
resource "aws_api_gateway_resource" "upload" {
  rest_api_id = aws_api_gateway_rest_api.image_upload.id
  parent_id   = aws_api_gateway_rest_api.image_upload.root_resource_id
  path_part   = "upload"
}

# API Gateway method for POST upload
resource "aws_api_gateway_method" "upload_post" {
  rest_api_id   = aws_api_gateway_rest_api.image_upload.id
  resource_id   = aws_api_gateway_resource.upload.id
  http_method   = "POST"
  authorization = "AWS_IAM"
}

# API Gateway integration with Lambda
resource "aws_api_gateway_integration" "upload_lambda" {
  rest_api_id = aws_api_gateway_rest_api.image_upload.id
  resource_id = aws_api_gateway_resource.upload.id
  http_method = aws_api_gateway_method.upload_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.image_optimizer.invoke_arn
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_optimizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.image_upload.execution_arn}/*/*"
}

# API Gateway deployment
resource "aws_api_gateway_deployment" "image_upload" {
  depends_on = [
    aws_api_gateway_integration.upload_lambda,
  ]

  rest_api_id = aws_api_gateway_rest_api.image_upload.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for product images"
  value       = aws_s3_bucket.product_images.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for product images"
  value       = aws_s3_bucket.product_images.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.product_images.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.product_images.domain_name
}

output "cloudfront_url" {
  description = "URL of the CloudFront distribution"
  value       = "https://${aws_cloudfront_distribution.product_images.domain_name}"
}

output "api_gateway_url" {
  description = "URL of the API Gateway for image upload"
  value       = "${aws_api_gateway_deployment.image_upload.invoke_url}/upload"
}
