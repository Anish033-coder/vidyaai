import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

 chatId:{
  type:mongoose.Schema.Types.ObjectId,
  required:true
 },

 role:{
  type:String,
  enum:["user","assistant"],
  required:true
 },

 content:{
  type:String,
  default:""
 },

 mode:{
  type:String,
  enum:["normal","teacher","mcq","interview","paper"],
  default:"normal"
 },

 // structured AI response
 data:{
  type:mongoose.Schema.Types.Mixed,
  default:null
 },

 // RAG source citations shown under the answer
 citations:{
  type:mongoose.Schema.Types.Mixed,
  default:[]
 }

},{timestamps:true});

const Message =
 mongoose.models.Message ||
 mongoose.model("Message", messageSchema);

export default Message;