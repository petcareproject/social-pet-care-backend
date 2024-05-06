const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        contactName: {
            type: String
        },
        email: {
            type: String
        },
        phone : {
            type: String
        },
        text: {
            type: String
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Contact", contactSchema);