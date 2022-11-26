const bcrypt = require("bcryptjs");
const MyError = require("../exception/MyError");
const NotFoundError = require("../exception/NotFoundError");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dateUtils = require("../utils/dateUtils");

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    employid: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default:
        "https://firebasestorage.googleapis.com/v0/b/toyskid-653c4.appspot.com/o/z3910096751874_228fc89e6adc172bd4f3bcdda715a5aa.jpg?alt=media&token=87234205-e5d6-458b-85d1-32ec1093fad2",
    },
    avatarColor: {
      type: String,
      default: "#FF0000",
    },
    coverImage: {
      type: String,
      default:
        "https://firebasestorage.googleapis.com/v0/b/toyskid-653c4.appspot.com/o/z3910096751874_228fc89e6adc172bd4f3bcdda715a5aa.jpg?alt=media&token=87234205-e5d6-458b-85d1-32ec1093fad2",
    },
    type: Boolean,
    dateOfBirth: {
      type: Date,
      default: new Date("2000-01-01"),
    },
    gender: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [
        {
          token: String,
          source: String,
        },
      ],
      default: [],
    },
    phoneBooks: {
      type: [{ name: String, phone: String }],
      default: [],
    },
    otp: String,
    otpTime: Date,
    isActived: Boolean,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    timeRevokeToken: {
      type: Date,
      default: new Date(),
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.statics.findByCredentials = async (employid, password) => {
  const user = await User.findOne({
    employid,
    isActived: true,
    isDeleted: false,
  });
  if (!user) throw new NotFoundError("User");

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new MyError("Password invalid");

  return user;
};

userSchema.statics.existsById = async (_id) => {
  const user = await User.findOne({ _id, isActived: true });
  if (user) return true;
  return false;
};

userSchema.statics.checkByIds = async (ids, message = "User") => {
  for (const idEle of ids) {
    const user = await User.findOne({
      _id: idEle,
      isActived: true,
      isDeleted: false,
    });

    if (!user) throw new NotFoundError(message);
  }
};

userSchema.statics.getById = async (_id, message = "User") => {
  const user = await User.findOne({ _id, isActived: true });
  if (!user) throw new NotFoundError(message);

  const {
    name,
    employid,
    department,
    username,
    dateOfBirth,
    gender,
    avatar,
    avatarColor,
    coverImage,
    isAdmin,
    phoneBooks,
  } = user;
  return {
    _id,
    name,
    employid,
    department,
    username,
    dateOfBirth: dateUtils.toObject(dateOfBirth),
    gender,
    avatar,
    avatarColor,
    coverImage,
    isAdmin,
    phoneBooks,
  };
};

userSchema.statics.existsByUsername = async (username) => {
  const user = await User.findOne({
    username,
    isActived: true,
  });
  if (user) return true;
  return false;
};

userSchema.statics.findByUsername = async (username, message = "User") => {
  const user = await User.findOne({
    username,
    isActived: true,
  });

  if (!user) throw new NotFoundError(message);

  const { _id, name, dateOfBirth, gender, avatar, avatarColor, coverImage } =
    user;
  return {
    _id,
    name,
    username,
    dateOfBirth: dateUtils.toObject(dateOfBirth),
    gender,
    avatar,
    avatarColor,
    coverImage,
  };
};

userSchema.statics.checkById = async (_id, message = "User") => {
  const user = await User.findOne({ _id, isActived: true });

  if (!user) throw new NotFoundError(message);

  return user;
};

userSchema.statics.getSummaryById = async (_id, message = "User") => {
  const user = await User.findOne({ _id, isActived: true });
  if (!user) throw new NotFoundError(message);

  const { name, avatar, avatarColor } = user;
  return {
    _id,
    name,
    avatar,
    avatarColor,
  };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
