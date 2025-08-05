import { Router } from "express";
import { sendMessage } from "../controllers/message.js";

const messageRouter = Router();

messageRouter.post("/contact", sendMessage);


export default messageRouter 