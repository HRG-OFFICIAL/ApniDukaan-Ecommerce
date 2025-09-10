import axios, { AxiosInstance } from 'axios';
// import Decimal from 'decimal.js'; // Not used currently
import {
  ShippingMethod,
  ShippingStatus,
  IOrder,
  IOrderItem,
  IShippingAddress,
  // IShipping, // Not used currently
  IShippingUpdate,
  IShippingCalculation,
  IShippingUpdateRequest
} from '../types/order.types';

// Carrier configuration interfaces
interface ICarrierConfig {
  enabled: boolean;
  apiKey: string;
  apiSecret?: string;
  sandbox: boolean;
  baseUrl: string;
  timeout: number;
}

interface IShippingConfig {
  carriers: {
    ups: ICarrierConfig;
    fedex: ICarrierConfig;
    usps: ICarrierConfig;
    dhl: ICarrierConfig;
  };
  defaultCarrier: string;
  freeShippingThreshold: number;
  maxWeight: number;
  maxDimensions: {
    length: number;
    width: number;
    height: number;
  };
  insuranceThreshold: number;
  signatureRequiredThreshold: number;
}

// Shipping rate interfaces
interface IShippingRate {
  carrier: string;
  service: string;
  method: ShippingMethod;
  cost: number;
  estimatedDelivery: Date;
  transitTime: string;
  currency: string;
}

interface ITrackingInfo {
  trackingNumber: string;
  status: ShippingStatus;
  location?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  updates: IShippingUpdate[];
  carrier: string;
  service: string;
}

interface IShipmentLabel {
  labelUrl: string;
  trackingNumber: string;
  cost: number;
  carrier: string;
  service: string;
}

// Address validation interface
interface IAddressValidation {
  isValid: boolean;
  correctedAddress?: IShippingAddress;
  suggestions?: IShippingAddress[];
  errors: string[];
}

class ShippingService {
  private config: IShippingConfig;
  private carrierClients: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.config = {
      carriers: {
        ups: {
          enabled: process.env.UPS_ENABLED === 'true',
          apiKey: process.env.UPS_API_KEY || '',
          apiSecret: process.env.UPS_API_SECRET || '',
          sandbox: process.env.UPS_SANDBOX === 'true',
          baseUrl: process.env.UPS_SANDBOX === 'true' 
            ? 'https://wwwcie.ups.com/rest' 
            : 'https://onlinetools.ups.com/rest',
          timeout: 30000
        },
        fedex: {
          enabled: process.env.FEDEX_ENABLED === 'true',
          apiKey: process.env.FEDEX_API_KEY || '',
          apiSecret: process.env.FEDEX_API_SECRET || '',
          sandbox: process.env.FEDEX_SANDBOX === 'true',
          baseUrl: process.env.FEDEX_SANDBOX === 'true'
            ? 'https://wsbeta.fedex.com:443/web-services'
            : 'https://ws.fedex.com:443/web-services',
          timeout: 30000
        },
        usps: {
          enabled: process.env.USPS_ENABLED === 'true',
          apiKey: process.env.USPS_API_KEY || '',
          sandbox: process.env.USPS_SANDBOX === 'true',
          baseUrl: process.env.USPS_SANDBOX === 'true'
            ? 'https://secure.shippingapis.com/ShippingAPITest.dll'
            : 'https://secure.shippingapis.com/ShippingAPI.dll',
          timeout: 30000
        },
        dhl: {
          enabled: process.env.DHL_ENABLED === 'true',
          apiKey: process.env.DHL_API_KEY || '',
          apiSecret: process.env.DHL_API_SECRET || '',
          sandbox: process.env.DHL_SANDBOX === 'true',
          baseUrl: process.env.DHL_SANDBOX === 'true'
            ? 'https://express.api.dhl.com/mydhlapi/test'
            : 'https://express.api.dhl.com/mydhlapi',
          timeout: 30000
        }
      },
      defaultCarrier: 'ups',
      freeShippingThreshold: 75.00,
      maxWeight: 150, // pounds
      maxDimensions: {
        length: 108, // inches
        width: 108,
        height: 108
      },
      insuranceThreshold: 100.00,
      signatureRequiredThreshold: 500.00
    };

    this.initializeCarrierClients();
  }

  private initializeCarrierClients(): void {
    // Initialize HTTP clients for each carrier
    Object.entries(this.config.carriers).forEach(([carrier, config]) => {
      if (config.enabled && config.apiKey) {
        const client = axios.create({
          baseURL: config.baseUrl,
          timeout: config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          }
        });

        // Add request/response interceptors for logging
        client.interceptors.request.use(
          (config) => {
            console.log(`${carrier.toUpperCase()} API Request:`, config.method?.toUpperCase(), config.url);
            return config;
          },
          (error) => {
            console.error(`${carrier.toUpperCase()} API Request Error:`, error.message);
            return Promise.reject(error);
          }
        );

        client.interceptors.response.use(
          (response) => {
            console.log(`${carrier.toUpperCase()} API Response:`, response.status, response.statusText);
            return response;
          },
          (error) => {
            console.error(`${carrier.toUpperCase()} API Response Error:`, error.response?.status, error.message);
            return Promise.reject(error);
          }
        );

        this.carrierClients.set(carrier, client);
        console.log(`${carrier.toUpperCase()} shipping carrier initialized`);
      }
    });
  }

  // ==================== SHIPPING RATE CALCULATION ====================

  /**
   * Calculate shipping rates for multiple carriers
   */
  async calculateShippingRates(
    items: IOrderItem[],
    fromAddress: IShippingAddress,
    toAddress: IShippingAddress,
    options: {
      includeFree?: boolean;
      includeInsurance?: boolean;
      includeSignature?: boolean;
    } = {}
  ): Promise<IShippingRate[]> {
    try {
      // Calculate package dimensions and weight
      const packageInfo = this.calculatePackageInfo(items);
      
      // Validate addresses
      const addressValidation = await this.validateAddress(toAddress);
      if (!addressValidation.isValid) {
        throw new Error(`Invalid shipping address: ${addressValidation.errors.join(', ')}`);
      }

      // Get rates from all enabled carriers
      const ratePromises = Array.from(this.carrierClients.keys()).map(carrier =>
        this.getCarrierRates(carrier, packageInfo, fromAddress, toAddress, options)
      );

      const allRates = await Promise.allSettled(ratePromises);
      const validRates: IShippingRate[] = [];

      allRates.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          validRates.push(...result.value);
        } else {
          const carrier = Array.from(this.carrierClients.keys())[index];
          console.error(`Failed to get rates from ${carrier}:`, result.reason);
        }
      });

      // Add free shipping option if applicable
      if (options.includeFree) {
        const orderTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        if (orderTotal >= this.config.freeShippingThreshold) {
          validRates.push({
            carrier: 'free',
            service: 'Free Standard Shipping',
            method: ShippingMethod.FREE,
            cost: 0,
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            transitTime: '5-7 business days',
            currency: 'USD'
          });
        }
      }

      // Sort by cost (ascending)
      return validRates.sort((a, b) => a.cost - b.cost);

    } catch (error) {
      console.error('Error calculating shipping rates:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates for a specific method
   */
  async calculateShipping(
    items: IOrderItem[],
    address: IShippingAddress,
    method: ShippingMethod
  ): Promise<IShippingCalculation> {
    try {
      // Mock warehouse address (in production, this would be dynamic)
      const fromAddress: IShippingAddress = {
        firstName: 'ShopSphere',
        lastName: 'Warehouse',
        company: 'ShopSphere Inc',
        addressLine1: '123 Warehouse Blvd',
        city: 'Commerce',
        state: 'CA',
        postalCode: '90040',
        country: 'US'
      };

      const rates = await this.calculateShippingRates(items, fromAddress, address, {
        includeFree: method === ShippingMethod.FREE
      });

      // Find rate for requested method
      const selectedRate = rates.find(rate => rate.method === method);
      
      if (!selectedRate) {
        // Fallback to default rate
        const fallbackRate = rates[0] || {
          carrier: this.config.defaultCarrier,
          service: 'Standard',
          method: ShippingMethod.STANDARD,
          cost: 9.99,
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          transitTime: '3-5 business days',
          currency: 'USD'
        };

        return {
          method: fallbackRate.method,
          carrier: fallbackRate.carrier,
          service: fallbackRate.service,
          cost: fallbackRate.cost,
          estimatedDelivery: fallbackRate.estimatedDelivery,
          transitTime: fallbackRate.transitTime
        };
      }

      return {
        method: selectedRate.method,
        carrier: selectedRate.carrier,
        service: selectedRate.service,
        cost: selectedRate.cost,
        estimatedDelivery: selectedRate.estimatedDelivery,
        transitTime: selectedRate.transitTime
      };

    } catch (error) {
      console.error('Error calculating shipping:', error);
      
      // Return default shipping calculation as fallback
      return {
        method: ShippingMethod.STANDARD,
        carrier: this.config.defaultCarrier,
        service: 'Standard',
        cost: 9.99,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        transitTime: '3-5 business days'
      };
    }
  }

  // ==================== SHIPMENT CREATION ====================

  /**
   * Create shipment and generate shipping label
   */
  async createShipment(order: IOrder): Promise<IShipmentLabel> {
    try {
      const carrier = order.shipping.carrier || this.config.defaultCarrier;
      const client = this.carrierClients.get(carrier);
      
      if (!client) {
        throw new Error(`Carrier ${carrier} not configured`);
      }

      // Calculate package info
      const packageInfo = this.calculatePackageInfo(order.items);

      // Create shipment based on carrier
      switch (carrier) {
        case 'ups':
          return await this.createUPSShipment(order, packageInfo);
        case 'fedex':
          return await this.createFedExShipment(order, packageInfo);
        case 'usps':
          return await this.createUSPSShipment(order, packageInfo);
        case 'dhl':
          return await this.createDHLShipment(order, packageInfo);
        default:
          throw new Error(`Unsupported carrier: ${carrier}`);
      }

    } catch (error) {
      console.error('Error creating shipment:', error);
      
      // Return mock label for development
      return {
        labelUrl: 'https://example.com/shipping-label.pdf',
        trackingNumber: `${order.shipping.carrier?.toUpperCase() || 'MOCK'}${Date.now()}`,
        cost: order.shipping.cost,
        carrier: order.shipping.carrier || this.config.defaultCarrier,
        service: order.shipping.service || 'Standard'
      };
    }
  }

  // ==================== TRACKING ====================

  /**
   * Track shipment by tracking number
   */
  async trackShipment(trackingNumber: string, carrier?: string): Promise<ITrackingInfo> {
    try {
      // Determine carrier if not provided
      if (!carrier) {
        carrier = this.identifyCarrier(trackingNumber);
      }

      const client = this.carrierClients.get(carrier);
      if (!client) {
        throw new Error(`Carrier ${carrier} not configured`);
      }

      // Track shipment based on carrier
      switch (carrier) {
        case 'ups':
          return await this.trackUPSShipment(trackingNumber);
        case 'fedex':
          return await this.trackFedExShipment(trackingNumber);
        case 'usps':
          return await this.trackUSPSShipment(trackingNumber);
        case 'dhl':
          return await this.trackDHLShipment(trackingNumber);
        default:
          throw new Error(`Tracking not supported for carrier: ${carrier}`);
      }

    } catch (error) {
      console.error('Error tracking shipment:', error);
      
      // Return mock tracking info for development
      return {
        trackingNumber,
        status: ShippingStatus.IN_TRANSIT,
        location: 'In Transit',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        updates: [
          {
            status: ShippingStatus.SHIPPED,
            message: 'Package shipped from warehouse',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            carrier: carrier || 'unknown'
          },
          {
            status: ShippingStatus.IN_TRANSIT,
            message: 'Package in transit',
            location: 'Distribution Center',
            timestamp: new Date(),
            carrier: carrier || 'unknown'
          }
        ],
        carrier: carrier || 'unknown',
        service: 'Standard'
      };
    }
  }

  /**
   * Update shipping status for an order
   */
  async updateShippingStatus(updateRequest: IShippingUpdateRequest): Promise<{ success: boolean; error?: string }> {
    try {
      // This would typically update the order in the database
      console.log(`Shipping status updated for order ${updateRequest.orderId}:`, {
        status: updateRequest.status,
        trackingNumber: updateRequest.trackingNumber,
        message: updateRequest.message,
        location: updateRequest.location
      });

      return { success: true };

    } catch (error) {
      console.error('Error updating shipping status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== ADDRESS VALIDATION ====================

  /**
   * Validate shipping address
   */
  async validateAddress(address: IShippingAddress): Promise<IAddressValidation> {
    try {
      // Basic validation
      const errors: string[] = [];

      if (!address.firstName) errors.push('First name is required');
      if (!address.lastName) errors.push('Last name is required');
      if (!address.addressLine1) errors.push('Address line 1 is required');
      if (!address.city) errors.push('City is required');
      if (!address.state) errors.push('State is required');
      if (!address.postalCode) errors.push('Postal code is required');
      if (!address.country) errors.push('Country is required');

      // Postal code validation (basic)
      if (address.country === 'US' && address.postalCode) {
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(address.postalCode)) {
          errors.push('Invalid US postal code format');
        }
      }

      // In production, you would call carrier APIs for address validation
      // For now, return basic validation
      return {
        isValid: errors.length === 0,
        errors,
        correctedAddress: errors.length === 0 ? address : address
      };

    } catch (error) {
      console.error('Error validating address:', error);
      return {
        isValid: false,
        errors: ['Address validation failed']
      };
    }
  }

  // ==================== CARRIER-SPECIFIC IMPLEMENTATIONS ====================

  /**
   * Get rates from specific carrier
   */
  private async getCarrierRates(
    carrier: string,
    _packageInfo: any,
    _fromAddress: IShippingAddress,
    _toAddress: IShippingAddress,
    _options: any
  ): Promise<IShippingRate[]> {
    // Mock rates for development
    const baseRates = {
      ups: [
        {
          service: 'Ground',
          method: ShippingMethod.STANDARD,
          cost: 8.99,
          transitTime: '3-5 business days'
        },
        {
          service: 'Next Day Air',
          method: ShippingMethod.OVERNIGHT,
          cost: 24.99,
          transitTime: '1 business day'
        }
      ],
      fedex: [
        {
          service: 'Ground',
          method: ShippingMethod.STANDARD,
          cost: 9.49,
          transitTime: '3-5 business days'
        },
        {
          service: 'Express',
          method: ShippingMethod.EXPRESS,
          cost: 18.99,
          transitTime: '2 business days'
        }
      ],
      usps: [
        {
          service: 'Ground Advantage',
          method: ShippingMethod.STANDARD,
          cost: 7.99,
          transitTime: '3-5 business days'
        },
        {
          service: 'Priority',
          method: ShippingMethod.EXPRESS,
          cost: 15.99,
          transitTime: '1-3 business days'
        }
      ],
      dhl: [
        {
          service: 'Ground',
          method: ShippingMethod.STANDARD,
          cost: 10.99,
          transitTime: '3-7 business days'
        }
      ]
    };

    const carrierRates = baseRates[carrier as keyof typeof baseRates] || [];
    
    return carrierRates.map(rate => ({
      carrier,
      service: rate.service,
      method: rate.method,
      cost: rate.cost,
      estimatedDelivery: this.calculateDeliveryDate(rate.transitTime),
      transitTime: rate.transitTime,
      currency: 'USD'
    }));
  }

  /**
   * Create UPS shipment
   */
  private async createUPSShipment(order: IOrder, _packageInfo: any): Promise<IShipmentLabel> {
    // Mock UPS shipment creation
    return {
      labelUrl: 'https://example.com/ups-label.pdf',
      trackingNumber: `1Z${Date.now()}`,
      cost: order.shipping.cost,
      carrier: 'ups',
      service: order.shipping.service || 'Ground'
    };
  }

  /**
   * Create FedEx shipment
   */
  private async createFedExShipment(order: IOrder, _packageInfo: any): Promise<IShipmentLabel> {
    // Mock FedEx shipment creation
    return {
      labelUrl: 'https://example.com/fedex-label.pdf',
      trackingNumber: `${Date.now()}`,
      cost: order.shipping.cost,
      carrier: 'fedex',
      service: order.shipping.service || 'Ground'
    };
  }

  /**
   * Create USPS shipment
   */
  private async createUSPSShipment(order: IOrder, _packageInfo: any): Promise<IShipmentLabel> {
    // Mock USPS shipment creation
    return {
      labelUrl: 'https://example.com/usps-label.pdf',
      trackingNumber: `9400${Date.now()}`,
      cost: order.shipping.cost,
      carrier: 'usps',
      service: order.shipping.service || 'Ground Advantage'
    };
  }

  /**
   * Create DHL shipment
   */
  private async createDHLShipment(order: IOrder, _packageInfo: any): Promise<IShipmentLabel> {
    // Mock DHL shipment creation
    return {
      labelUrl: 'https://example.com/dhl-label.pdf',
      trackingNumber: `${Date.now()}`,
      cost: order.shipping.cost,
      carrier: 'dhl',
      service: order.shipping.service || 'Ground'
    };
  }

  // ==================== TRACKING IMPLEMENTATIONS ====================

  private async trackUPSShipment(trackingNumber: string): Promise<ITrackingInfo> {
    // Mock UPS tracking
    return this.createMockTrackingInfo(trackingNumber, 'ups');
  }

  private async trackFedExShipment(trackingNumber: string): Promise<ITrackingInfo> {
    // Mock FedEx tracking
    return this.createMockTrackingInfo(trackingNumber, 'fedex');
  }

  private async trackUSPSShipment(trackingNumber: string): Promise<ITrackingInfo> {
    // Mock USPS tracking
    return this.createMockTrackingInfo(trackingNumber, 'usps');
  }

  private async trackDHLShipment(trackingNumber: string): Promise<ITrackingInfo> {
    // Mock DHL tracking
    return this.createMockTrackingInfo(trackingNumber, 'dhl');
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate package dimensions and weight from order items
   */
  private calculatePackageInfo(items: IOrderItem[]): {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    value: number;
  } {
    let totalWeight = 0;
    let totalValue = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    items.forEach(item => {
      const weight = (item.weight || 1) * item.quantity;
      const value = item.totalPrice;
      
      totalWeight += weight;
      totalValue += value;

      if (item.dimensions) {
        maxLength = Math.max(maxLength, item.dimensions.length || 12);
        maxWidth = Math.max(maxWidth, item.dimensions.width || 8);
        totalHeight += (item.dimensions.height || 2) * item.quantity;
      } else {
        // Default dimensions if not provided
        maxLength = Math.max(maxLength, 12);
        maxWidth = Math.max(maxWidth, 8);
        totalHeight += 2 * item.quantity;
      }
    });

    return {
      weight: Math.max(totalWeight, 1), // Minimum 1 lb
      dimensions: {
        length: Math.min(maxLength, this.config.maxDimensions.length),
        width: Math.min(maxWidth, this.config.maxDimensions.width),
        height: Math.min(totalHeight, this.config.maxDimensions.height)
      },
      value: totalValue
    };
  }

  /**
   * Identify carrier from tracking number
   */
  private identifyCarrier(trackingNumber: string): string {
    // Basic carrier identification by tracking number pattern
    if (trackingNumber.startsWith('1Z')) return 'ups';
    if (trackingNumber.length === 12 && /^\d+$/.test(trackingNumber)) return 'fedex';
    if (trackingNumber.startsWith('9400') || trackingNumber.startsWith('9200')) return 'usps';
    if (trackingNumber.length === 10) return 'dhl';
    
    return this.config.defaultCarrier;
  }

  /**
   * Calculate estimated delivery date from transit time
   */
  private calculateDeliveryDate(transitTime: string): Date {
    const days = parseInt(transitTime.split('-')[1] || transitTime.split('-')[0] || '5');
    const deliveryDate = new Date();
    
    // Add business days (skip weekends)
    let businessDays = 0;
    while (businessDays < days) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      if (deliveryDate.getDay() !== 0 && deliveryDate.getDay() !== 6) {
        businessDays++;
      }
    }
    
    return deliveryDate;
  }

  /**
   * Create mock tracking info for development
   */
  private createMockTrackingInfo(trackingNumber: string, carrier: string): ITrackingInfo {
    return {
      trackingNumber,
      status: ShippingStatus.IN_TRANSIT,
      location: 'Distribution Center',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      updates: [
        {
          status: ShippingStatus.SHIPPED,
          message: 'Package shipped',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          carrier
        },
        {
          status: ShippingStatus.IN_TRANSIT,
          message: 'In transit to destination',
          location: 'Distribution Center',
          timestamp: new Date(),
          carrier
        }
      ],
      carrier,
      service: 'Standard'
    };
  }
}

export default ShippingService;
