import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

const getNumber = (value) => Number(value) > 0 ? Number(value) : 0;

const getBaseDeliveryCharge = (product) => (
  product?.deliveryInfo?.freeDelivery ? 0 : getNumber(product?.deliveryInfo?.deliveryCharges)
);

const findVariant = (product, selectedSizeVariant) => {
  const variantId = selectedSizeVariant?.variantId || selectedSizeVariant?._id;
  if (!product?.sizeVariants?.length || !variantId) return null;
  return product.sizeVariants.find(variant => variant._id?.toString() === String(variantId)) || null;
};

const getVariantAdditionalDeliveryCharge = (product, selectedSizeVariant) => {
  const variant = findVariant(product, selectedSizeVariant);
  return getNumber(variant?.additionalDeliveryCharge ?? selectedSizeVariant?.additionalDeliveryCharge);
};

const getDeliveryCharge = (product, selectedSizeVariant) => (
  getBaseDeliveryCharge(product) + getVariantAdditionalDeliveryCharge(product, selectedSizeVariant)
);

const getCartItemPrice = (item) => (
  getNumber(item.priceAtAddition) ||
  getNumber(item.selectedSizeVariant?.price) ||
  getNumber(item.customSize?.calculatedPrice) ||
  getNumber(item.productId?.price)
);

const buildSelectedSizeVariant = (product, selectedSizeVariant) => {
  if (!selectedSizeVariant) return undefined;

  const variant = findVariant(product, selectedSizeVariant);
  return {
    variantId: String(variant?._id || selectedSizeVariant.variantId || selectedSizeVariant._id || ""),
    name: variant?.name || selectedSizeVariant.name,
    dimensions: variant?.dimensions || selectedSizeVariant.dimensions,
    price: getNumber(variant?.price ?? selectedSizeVariant.price),
    additionalDeliveryCharge: getNumber(variant?.additionalDeliveryCharge ?? selectedSizeVariant.additionalDeliveryCharge)
  };
};

const recalculateCartTotals = (cart) => {
  let productTotal = 0;
  let deliveryTotal = 0;

  cart.products.forEach((item) => {
    const quantity = getNumber(item.quantity) || 1;
    const itemPrice = getCartItemPrice(item);
    const itemDelivery = getNumber(item.deliveryChargeAtAddition);
    productTotal += quantity * itemPrice;
    deliveryTotal += quantity * itemDelivery;
  });

  cart.totalDeliveryCharge = deliveryTotal;
  cart.totalPrice = productTotal + deliveryTotal;
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { productId, quantity, selectedSizeVariant, customSize } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (selectedSizeVariant && product.sizeVariants?.length && !findVariant(product, selectedSizeVariant)) {
      return res.status(400).json({ message: "Selected size variant is not available for this product" });
    }

    const normalizedSelectedSizeVariant = buildSelectedSizeVariant(product, selectedSizeVariant);

    // Determine the price based on size selection
    let priceAtAddition = product.price;
    if (normalizedSelectedSizeVariant && normalizedSelectedSizeVariant.price) {
      priceAtAddition = normalizedSelectedSizeVariant.price;
    } else if (customSize && customSize.calculatedPrice) {
      // Server-side guard: custom size price must be >= minimumCharge (which admin must set >= base price)
      const minRequired =
        product.customSizeConfig?.minimumCharge > 0
          ? product.customSizeConfig.minimumCharge
          : product.price;
      if (customSize.calculatedPrice < minRequired) {
        return res.status(400).json({
          status: false,
          message: `Custom size price (₹${customSize.calculatedPrice}) must be at least ₹${minRequired}. Please review your size measurements.`
        });
      }
      priceAtAddition = customSize.calculatedPrice;
    }
    const deliveryChargeAtAddition = getDeliveryCharge(product, normalizedSelectedSizeVariant);

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      const cartItem = { 
        productId, 
        quantity, 
        priceAtAddition,
        deliveryChargeAtAddition
      };
      
      // Add size data if provided
      if (normalizedSelectedSizeVariant) {
        cartItem.selectedSizeVariant = normalizedSelectedSizeVariant;
      }
      if (customSize) {
        cartItem.customSize = customSize;
      }
      
      cart = new Cart({
        userId,
        products: [cartItem],
      });
      recalculateCartTotals(cart);
    } else {
      // Check if same product with same size configuration exists
      let itemIndex = -1;
      
      if (normalizedSelectedSizeVariant) {
        // Find item with same product and same size variant
        itemIndex = cart.products.findIndex(p => 
          p.productId.equals(productId) && 
          p.selectedSizeVariant?.variantId === normalizedSelectedSizeVariant.variantId
        );
      } else if (customSize?.isCustom) {
        // For custom sizes, always add as new item (each custom size is unique)
        itemIndex = -1;
      } else {
        // Regular product without customization
        itemIndex = cart.products.findIndex(p => 
          p.productId.equals(productId) && 
          !p.selectedSizeVariant && 
          !p.customSize?.isCustom
        );
      }
      
      if (itemIndex > -1) {
        // Update existing item quantity
        cart.products[itemIndex].quantity += quantity;
        cart.products[itemIndex].deliveryChargeAtAddition = deliveryChargeAtAddition;
        if (normalizedSelectedSizeVariant) {
          cart.products[itemIndex].selectedSizeVariant = normalizedSelectedSizeVariant;
        }
      } else {
        // Add new item
        const cartItem = { 
          productId, 
          quantity, 
          priceAtAddition,
          deliveryChargeAtAddition
        };
        
        if (normalizedSelectedSizeVariant) {
          cartItem.selectedSizeVariant = normalizedSelectedSizeVariant;
        }
        if (customSize) {
          cartItem.customSize = customSize;
        }
        
        cart.products.push(cartItem);
      }
      
      recalculateCartTotals(cart);
    }

    await cart.save();
    res.status(201).json({status:true, messege:"Item added to cart"});
  } catch (err) {
    res.status(500).json({messege:"server error :", error: err.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    const { productId } = req.params;
    console.log("getting product id",productId)

    // Validate productId


    // Find the cart for the user
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if product exists in cart
    const productIndex = cart.products.findIndex(p =>
      p.productId.equals(productId)
    );
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove the product
    cart.products.splice(productIndex, 1);

    recalculateCartTotals(cart);

    await cart.save();

    return res.status(200).json({
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (err) {
    console.error("Error removing from cart:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;
    console.log(productId)

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.products.find(p => p.productId.equals(productId));
    if (!item) return res.status(404).json({ message: "Product not in cart" });

    item.quantity = quantity;
    recalculateCartTotals(cart);

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getCartTotal = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // Filter out products that were deleted (null after populate)
    cart.products = cart.products.filter(item => item.productId !== null);
    
    // Repair legacy cart items that were saved before delivery charges were stored.
    cart.products.forEach((item) => {
      item.deliveryChargeAtAddition = getDeliveryCharge(item.productId, item.selectedSizeVariant);
    });

    recalculateCartTotals(cart);
    
    // Save the cleaned cart
    if (cart.isModified()) {
      await cart.save();
    }

    res.json({ total: cart.totalPrice, totalDeliveryCharge: cart.totalDeliveryCharge || 0, items: cart.products });
  } catch (err) {
    console.error('Get cart total error:', err);
    res.status(500).json({ error: err.message });
  }
};
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = [];
    cart.totalPrice = 0;
    cart.totalDeliveryCharge = 0;

    await cart.save();
    res.json({ message: "Cart cleared successfully", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export{
     addToCart,removeFromCart,updateQuantity,getCartTotal,clearCart
}
