import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    saleId: {
      type: String,
      required: true,
      unique: true
    },
    itemId: {
      type: String,
      required: true,
      trim: true
    },
    noOfItemsSold: {
      type: Number,
      required: true,
      min: 1
    },
    saleRate: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dateOfSale: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
