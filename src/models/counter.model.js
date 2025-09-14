
import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1000 } 
});

export const Counter= mongoose.model("Counter", counterSchema);
