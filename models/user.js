import { Schema, model } from "mongoose";
import { toJSON } from "@reis/mongoose-to-json";


const userSchema = new Schema({
    name: {
        type: String, required: true,
    },
    email: {
        type: String, required: true, unique: true
    },
    password: {
        type: String, required: true, minlength: 6
    },
    profilePicture: { type: String },
    role: {
        type: String, default: "user", enum: ["user", "admin"]
    },
},
    {
        timestamps: true,
    }
)

// Add a virtual field for confirmPassword
// userSchema.virtual("confirmPassword").set(function (value) {
//   this._confirmPassword = value;
// });
// // Custom validation for password confirmation
// userSchema.pre("save", function (next) {
//   if (this.password !== this._confirmPassword) {
//     return next(new Error("Passwords do not match"));
//   }
//   next();
// });


// Plugin for converting MongoDB data to JSON
userSchema.plugin(toJSON);

export const UserModel = model("User", userSchema);
