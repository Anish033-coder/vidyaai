import mongoose from "mongoose";

const chatEmbeddingSchema = new mongoose.Schema({

 chatId: mongoose.Schema.Types.ObjectId,

 messageId: mongoose.Schema.Types.ObjectId,

 embedding: [Number],

 text: String

});

export default mongoose.model("ChatEmbedding", chatEmbeddingSchema);