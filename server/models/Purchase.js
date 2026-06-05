import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: String,
      required: true,
      unique: true
    },
    itemId: {
      type: String,
      required: true,
      trim: true
    },
    noOfItems: {
      type: Number,
      required: true,
      min: 1
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    purchaseDate: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);
