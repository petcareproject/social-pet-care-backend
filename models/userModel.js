const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String
    },
    lastName:{
      type: String
    },
    userName:{
      type: String
    },
    email:{
      type: String
    },
    dob:{
      type: Date
    },
    city: {
      type: String
    },
    phone: {
      type: String
    },
    password: {
      type: String
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    profileImage: {
      type: String
    },
    aboutUs: {
      type: String
    },
    tokens:{
      type: [String]
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);