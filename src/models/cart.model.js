import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, 
  },
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      priceAtAddition: {  
        type: Number,
      },
      // New fields for customizable products
      selectedSizeVariant: {
        variantId: String,
        name: String,
        dimensions: {
          length: Number,
          width: Number,
          height: Number,
          unit: String
        },
        price: Number
      },
      customSize: {
        isCustom: {
          type: Boolean,
          default: false
        },
        measurements: {
          length: Number,
          width: Number,
          height: Number,
          area: Number,
          diameter: Number,
          unit: String
        },
        calculatedPrice: Number,
        notes: String
      }
    }
  ],
  totalPrice: {
    type: Number,
    default: 0, 
  }

},{ timestamps:true});

export const Cart=  mongoose.model("Cart", cartSchema);
