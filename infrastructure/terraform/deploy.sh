#!/bin/bash

# ApniDukaan E-commerce Platform - AWS Infrastructure Deployment Script
# This script deploys the S3 + CloudFront infrastructure for image storage and CDN

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform first."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS credentials are configured"
}

# Initialize Terraform
init_terraform() {
    print_status "Initializing Terraform..."
    
    cd "$(dirname "$0")"
    terraform init
    
    print_success "Terraform initialized"
}

# Build Lambda function
build_lambda() {
    print_status "Building Lambda function..."
    
    cd lambda
    npm install --production
    zip -r ../image_optimizer.zip .
    cd ..
    
    print_success "Lambda function built"
}

# Plan Terraform deployment
plan_terraform() {
    print_status "Planning Terraform deployment..."
    
    terraform plan -out=tfplan
    
    print_success "Terraform plan created"
}

# Apply Terraform deployment
apply_terraform() {
    print_status "Applying Terraform deployment..."
    
    terraform apply tfplan
    
    print_success "Terraform deployment completed"
}

# Get outputs
get_outputs() {
    print_status "Getting deployment outputs..."
    
    echo ""
    echo "=== DEPLOYMENT OUTPUTS ==="
    echo ""
    
    S3_BUCKET_NAME=$(terraform output -raw s3_bucket_name)
    CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name)
    CLOUDFRONT_URL=$(terraform output -raw cloudfront_url)
    API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
    
    echo "S3 Bucket Name: $S3_BUCKET_NAME"
    echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
    echo "CloudFront URL: $CLOUDFRONT_URL"
    echo "API Gateway URL: $API_GATEWAY_URL"
    echo ""
    
    # Create environment file
    cat > ../.env << EOF
# AWS Configuration
AWS_REGION=$(terraform output -raw aws_region)
S3_BUCKET_NAME=$S3_BUCKET_NAME
CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
CLOUDFRONT_URL=$CLOUDFRONT_URL
IMAGE_UPLOAD_API_URL=$API_GATEWAY_URL
EOF
    
    print_success "Environment file created at ../.env"
}

# Main deployment function
main() {
    echo "🚀 ApniDukaan E-commerce Platform - AWS Infrastructure Deployment"
    echo "=================================================================="
    echo ""
    
    check_dependencies
    check_aws_credentials
    init_terraform
    build_lambda
    plan_terraform
    
    echo ""
    print_warning "Review the Terraform plan above. Do you want to proceed with deployment? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        apply_terraform
        get_outputs
        
        echo ""
        print_success "🎉 Deployment completed successfully!"
        echo ""
        print_status "Next steps:"
        echo "1. Update your backend services with the new environment variables"
        echo "2. Test the image upload functionality"
        echo "3. Configure your domain name with CloudFront"
        echo ""
    else
        print_warning "Deployment cancelled"
        exit 0
    fi
}

# Run main function
main "$@"
