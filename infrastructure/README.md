# ApniDukaan E-commerce Platform - Cloud Infrastructure

This directory contains the infrastructure as code (IaC) for deploying the ApniDukaan e-commerce platform on AWS.

## 🏗️ Architecture Overview

The infrastructure includes:

- **S3 Bucket** - Secure storage for product images
- **CloudFront CDN** - Global content delivery for fast image loading
- **Lambda Function** - Image optimization and resizing
- **API Gateway** - RESTful API for image upload operations
- **IAM Roles** - Secure access control

## 📁 Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf                 # Main Terraform configuration
│   ├── variables.tf            # Variable definitions
│   ├── outputs.tf              # Output definitions
│   ├── terraform.tfvars.example # Example variables file
│   ├── env.example             # Example environment file
│   ├── deploy.sh               # Deployment script
│   └── lambda/
│       ├── image_optimizer.js  # Lambda function code
│       └── package.json        # Lambda dependencies
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** - Configured with appropriate credentials
2. **Terraform** - Version 1.0 or later
3. **Node.js** - Version 18 or later
4. **AWS Account** - With appropriate permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HRG-OFFICIAL/apnidukaan-ecommerce.git
   cd apnidukaan-ecommerce/infrastructure
   ```

2. **Configure AWS credentials**
   ```bash
   aws configure
   ```

3. **Set up Terraform variables**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

4. **Deploy the infrastructure**
   ```bash
   ./deploy.sh
   ```

## 🔧 Configuration

### Environment Variables

After deployment, update your backend services with these environment variables:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# S3 Configuration
S3_BUCKET_NAME=apnidukaan-product-images-dev-xxxxxxxx
CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# API Gateway
IMAGE_UPLOAD_API_URL=https://api-gateway-id.execute-api.us-east-1.amazonaws.com/dev/upload
```

### Terraform Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region for resources | `us-east-1` | No |
| `project_name` | Name of the project | `apnidukaan` | No |
| `environment` | Environment (dev, staging, prod) | `dev` | No |
| `domain_name` | Domain name for the application | `apnidukaan.com` | No |
| `certificate_arn` | ARN of the SSL certificate | `""` | No |
| `allowed_origins` | List of allowed origins for CORS | `["http://localhost:3000", "http://localhost:5000"]` | No |

## 🖼️ Image Upload Flow

1. **Frontend** sends image data to backend API
2. **Backend** validates and forwards to Lambda function
3. **Lambda** optimizes and resizes images
4. **S3** stores optimized images
5. **CloudFront** serves images globally
6. **Database** stores image URLs

## 📊 Features

### Image Optimization
- **Automatic resizing** - Multiple sizes (thumbnail, small, medium, large, original)
- **Format conversion** - JPEG optimization with quality control
- **Compression** - Reduces file size while maintaining quality
- **Metadata** - Preserves original filename and product information

### Security
- **Private S3 bucket** - No public access
- **CloudFront OAC** - Secure access control
- **IAM roles** - Least privilege access
- **CORS configuration** - Controlled cross-origin access

### Performance
- **Global CDN** - CloudFront distribution
- **Caching** - Long-term caching for images
- **Compression** - Gzip compression enabled
- **HTTP/2** - Modern protocol support

## 🔍 Monitoring

### CloudWatch Logs
- Lambda function logs
- API Gateway logs
- S3 access logs

### CloudWatch Metrics
- Lambda invocations and errors
- API Gateway request count and latency
- CloudFront cache hit ratio

## 🛠️ Maintenance

### Updating Lambda Function
```bash
cd lambda
npm install
zip -r ../image_optimizer.zip .
cd ..
terraform apply
```

### Scaling
- **S3** - Automatically scales
- **CloudFront** - Global edge locations
- **Lambda** - Auto-scaling based on demand
- **API Gateway** - Managed scaling

## 🚨 Troubleshooting

### Common Issues

1. **Lambda deployment fails**
   - Check Node.js version (18+)
   - Verify package.json dependencies
   - Check IAM permissions

2. **S3 upload fails**
   - Verify bucket policy
   - Check CORS configuration
   - Validate IAM permissions

3. **CloudFront not serving images**
   - Check origin access control
   - Verify S3 bucket policy
   - Check cache invalidation

### Debug Commands

```bash
# Check Terraform state
terraform show

# Check AWS resources
aws s3 ls s3://your-bucket-name
aws cloudfront list-distributions
aws lambda list-functions

# Check logs
aws logs describe-log-groups
aws logs get-log-events --log-group-name /aws/lambda/your-function-name
```

## 📚 Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the infrastructure
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
