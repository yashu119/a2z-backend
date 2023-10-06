const mongoose = require("mongoose");
mongoose.set('strictQuery', true);

const ResponsesSchema = new mongoose.Schema({
    name: { type: String, required: true },
    topic: { type: String, required: true },
    link: { type: String, required: true },
},
    { collection: "all-responses" }
);

const Responses = mongoose.model("Responses", ResponsesSchema)
module.exports = Responses