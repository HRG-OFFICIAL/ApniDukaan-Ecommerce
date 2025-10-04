#!/bin/bash

# SSL Certificate Setup Script for ApniDukaan
# This script generates self-signed certificates for development
# For production, use Let's Encrypt or a trusted CA

set -e

SSL_DIR="./ssl"
DOMAIN="apnidukaan.com"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

echo "🔐 Setting up SSL certificates for ApniDukaan..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Check if certificates already exist
if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
    echo "✅ SSL certificates already exist"
    echo "📁 Certificate: $CERT_FILE"
    echo "🔑 Private Key: $KEY_FILE"
    exit 0
fi

echo "🔨 Generating self-signed SSL certificate..."

# Generate private key
openssl genrsa -out "$KEY_FILE" 2048

# Generate certificate signing request
openssl req -new -key "$KEY_FILE" -out "$SSL_DIR/cert.csr" -subj "/C=IN/ST=Delhi/L=New Delhi/O=ApniDukaan/OU=IT Department/CN=$DOMAIN"

# Generate self-signed certificate
openssl x509 -req -days 365 -in "$SSL_DIR/cert.csr" -signkey "$KEY_FILE" -out "$CERT_FILE"

# Clean up CSR file
rm "$SSL_DIR/cert.csr"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate: $CERT_FILE"
echo "🔑 Private Key: $KEY_FILE"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   For production, use Let's Encrypt or a trusted Certificate Authority."
echo ""
echo "🚀 To use with Docker Compose:"
echo "   docker-compose up nginx"
echo ""
echo "🌐 Access your site at:"
echo "   https://localhost (with self-signed certificate warning)"
echo "   http://localhost (HTTP fallback)"
