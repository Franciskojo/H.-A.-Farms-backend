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
  <div style="font-family: Arial, sans-serif; background-color: #f8f1e5; padding: 20px; border: 1px solid #ddd;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 6px; overflow: hidden;">
      <div style="background-color: #4a8f29; color: white; padding: 15px 20px;">
        <h2 style="margin: 0;">📩 New Customer Message – H.A. Farms</h2>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 16px; color: #2c3e50;"><strong>From:</strong> ${value.name}</p>
        <p style="font-size: 16px; color: #2c3e50;"><strong>Email:</strong> <a href="mailto:${value.email}" style="color: #4a8f29;">${value.email}</a></p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 16px; color: #2c3e50;"><strong>Message:</strong></p>
        <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">${value.message}</p>
      </div>
      <div style="background-color: #e67e22; color: white; text-align: center; padding: 10px;">
        <p style="margin: 0; font-size: 14px;">This message was sent from the H.A. Farms website</p>
      </div>
    </div>
  </div>
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