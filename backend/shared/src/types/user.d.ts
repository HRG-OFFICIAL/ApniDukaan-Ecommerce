export interface IUser {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    role: UserRole;
    googleId?: string;
    avatar?: string;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IProfile {
    _id: string;
    userId: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    addresses: IAddress[];
    preferences: IUserPreferences;
    createdAt: Date;
    updatedAt: Date;
}
export interface IAddress {
    _id: string;
    type: AddressType;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
}
export interface IWishlist {
    _id: string;
    userId: string;
    items: IWishlistItem[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IWishlistItem {
    productId: string;
    addedAt: Date;
}
export interface IUserPreferences {
    newsletter: boolean;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    theme: 'light' | 'dark';
    language: string;
    currency: string;
}
export declare enum UserRole {
    CUSTOMER = "customer",
    ADMIN = "admin",
    MODERATOR = "moderator"
}
export declare enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other"
}
export declare enum AddressType {
    HOME = "home",
    WORK = "work",
    OTHER = "other"
}
export interface CreateUserInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface UpdateUserInput {
    firstName?: string;
    lastName?: string;
    avatar?: string;
}
export interface CreateAddressInput {
    type: AddressType;
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
}
export interface AuthPayload {
    user: IUser;
    token: string;
    refreshToken: string;
}
//# sourceMappingURL=user.d.ts.map