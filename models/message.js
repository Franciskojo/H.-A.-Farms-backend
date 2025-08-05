import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";


const messageSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
},
    { timestamps: true });


    messageSchema.plugin(toJSON);

export const messageModel = model('Message', messageSchema);
