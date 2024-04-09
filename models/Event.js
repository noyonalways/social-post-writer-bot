const { Schema, model } = require("mongoose");

const eventSchema = Schema(
  {
    text: {
      type: String,
      required: true,
    },
    tgId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = model("Event", eventSchema);
module.exports = Event;
