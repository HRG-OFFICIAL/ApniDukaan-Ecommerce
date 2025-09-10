# Outputs for ApniDukaan E-commerce Platform Infrastructure

output "s3_bucket_name" {
  description = "Name of the S3 bucket for product images"
  value       = aws_s3_bucket.product_images.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for product images"
  value       = aws_s3_bucket.product_images.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.product_images.bucket_domain_name
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

output "lambda_function_name" {
  description = "Name of the Lambda function for image optimization"
  value       = aws_lambda_function.image_optimizer.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function for image optimization"
  value       = aws_lambda_function.image_optimizer.arn
}
