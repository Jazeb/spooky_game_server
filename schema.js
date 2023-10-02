const mongoose = require("mongoose").set("debug", true);
const Schema = mongoose.Schema;

const Users = Schema(
  {
    caption: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    region: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    image1: {
      type: Buffer,
      required: false,
    },
    image2: {
      type: Buffer,
      required: false,
    },
  },
  { collection: "Users" },
  { __v: false }
);

module.exports = mongoose.model("Users", Users);
