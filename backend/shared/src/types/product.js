"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductOptionType = exports.ProductVisibility = exports.ProductStatus = void 0;
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["DRAFT"] = "draft";
    ProductStatus["ARCHIVED"] = "archived";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductVisibility;
(function (ProductVisibility) {
    ProductVisibility["PUBLIC"] = "public";
    ProductVisibility["PRIVATE"] = "private";
    ProductVisibility["PASSWORD_PROTECTED"] = "password_protected";
})(ProductVisibility || (exports.ProductVisibility = ProductVisibility = {}));
var ProductOptionType;
(function (ProductOptionType) {
    ProductOptionType["SELECT"] = "select";
    ProductOptionType["RADIO"] = "radio";
    ProductOptionType["CHECKBOX"] = "checkbox";
    ProductOptionType["TEXT"] = "text";
    ProductOptionType["TEXTAREA"] = "textarea";
})(ProductOptionType || (exports.ProductOptionType = ProductOptionType = {}));
//# sourceMappingURL=product.js.map