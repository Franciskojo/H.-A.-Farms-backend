import { messageModel } from "../models/message.js";
import { mailTransport } from "../utils/mail.js";
import { messageValidator } from "../validators/message.js";


export const sendMessage = async (req, res, next) => {
  try {
// Validate message input with Joi
    const { error, value } = messageValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ error: error.details[0].message });
    }

    //Create message with validated data
    const message = await messageModel.create({
      ...value
    });

     // ✅ Notify seller
    await mailTransport.sendMail({
      to: value.email,
      subject: 'New Customer Message – H.A. Farms',
      text: `
        New message from ${value.name} (${value.email}):
        ${value.message}
      `,
      html: `
        <h3>New Message from ${value.name}</h3>
        <p><strong>Email:</strong> ${value.email}</p>
        <p><strong>Message:</strong><br/>${value.message}</p>
        <p><em>Login to your dashboard to reply or mark as read.</em></p>
      `
    });


    // ✅ Respond with success
    res.status(201).json({
      message: "Your message has been received", data: message
    });

  } catch (error) {
    next(error);
  }
};