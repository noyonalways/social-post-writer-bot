const { Schema, model } = require("mongoose");

const userSchema = Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: false,
    },
    tgId: {
      type: String,
      required: true,
    },
    isBot: {
      type: Boolean,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    promptTokens: {
      type: Number,
      required: false,
    },
    completionTokens: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = model("User", userSchema);
module.exports = User;
