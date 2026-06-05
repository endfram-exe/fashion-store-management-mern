import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      required: true,
      trim: true
    },
    productFor: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      default: "Unisex"
    },
    season: {
      type: String,
      enum: ["Summer", "Winter", "All", "Festive"],
      default: "All"
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    imageUrl: {
      type: String,
      default: "/assets/products/tshirt.png"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
