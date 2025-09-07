export interface IProduct {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  trackQuantity: boolean;
  quantity: number;
  allowBackorder: boolean;
  weight?: number;
  dimensions?: IDimensions;
  images: IProductImage[];
  categoryIds: string[];
  tags: string[];
  variants: IProductVariant[];
  options: IProductOption[];
  seoTitle?: string;
  seoDescription?: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  featured: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductImage {
  _id: string;
  url: string;
  altText?: string;
  isMain: boolean;
  sortOrder: number;
}

export interface IProductVariant {
  _id: string;
  name: string;
  sku: string;
  price?: number;
  comparePrice?: number;
  cost?: number;
  quantity: number;
  weight?: number;
  dimensions?: IDimensions;
  image?: string;
  options: { [optionName: string]: string };
}

export interface IProductOption {
  _id: string;
  name: string;
  displayName: string;
  type: ProductOptionType;
  values: IProductOptionValue[];
  required: boolean;
}

export interface IProductOptionValue {
  _id: string;
  value: string;
  displayValue: string;
  priceModifier?: number;
  weightModifier?: number;
}

export interface IDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  isVerified: boolean;
  isApproved: boolean;
  helpfulCount: number;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

export enum ProductVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PASSWORD_PROTECTED = 'password_protected'
}

export enum ProductOptionType {
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TEXT = 'text',
  TEXTAREA = 'textarea'
}

export interface CreateProductInput {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  trackQuantity?: boolean;
  quantity?: number;
  allowBackorder?: boolean;
  weight?: number;
  categoryIds: string[];
  tags?: string[];
  status?: ProductStatus;
  visibility?: ProductVisibility;
  featured?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price?: number;
  comparePrice?: number;
  cost?: number;
  trackQuantity?: boolean;
  quantity?: number;
  allowBackorder?: boolean;
  weight?: number;
  categoryIds?: string[];
  tags?: string[];
  status?: ProductStatus;
  visibility?: ProductVisibility;
  featured?: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  status?: ProductStatus;
  featured?: boolean;
  inStock?: boolean;
  search?: string;
}

export interface ProductSort {
  field: 'name' | 'price' | 'createdAt' | 'rating' | 'soldCount';
  order: 'asc' | 'desc';
}

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}
