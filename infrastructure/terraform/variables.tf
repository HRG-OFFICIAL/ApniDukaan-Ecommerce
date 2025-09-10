# Variables for ApniDukaan E-commerce Platform Infrastructure

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "apnidukaan"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "allowed_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://apnidukaan.com",
    "https://www.apnidukaan.com"
  ]
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "apnidukaan.com"
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for CloudFront"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {
    Project     = "ApniDukaan"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
