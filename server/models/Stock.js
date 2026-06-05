import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    inStock: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ["Yes", "No"],
      default: "No"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Stock", stockSchema);
