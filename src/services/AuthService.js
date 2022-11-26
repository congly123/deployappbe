const User = require("../models/User");
const classifyService = require("../services/ClassifyService");
const userValidate = require("../validate/userValidate");
const mailer = require("../utils/mailer");
const commonUtils = require("../utils/commonUtils");
const NotFoundError = require("../exception/NotFoundError");
const MyError = require("../exception/MyError");
const AuthenError = require("../exception/AuthenError");
const tokenUtils = require("../utils/tokenUtils");
const templateHtml = require("../utils/templateHtml");
const bcrypt = require("bcryptjs");
const axios = require("axios");
require("dotenv").config();
const OTP_EXPIRE_MINUTE = parseInt(process.env.OTP_EXPIRE_MINUTE);
const authenConstant = require("../constant/authenConstant");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const serviceId = process.env.TWILIO_SERVICE_SID;
const sidkey = process.env.TWILIO_API_KEY;
const secret = process.env.TWILIO_API_SECRET;
const twilioClient = require("twilio")(sidkey, secret, { accountSid });

class AuthService {
  async login(employid, password, source) {
    userValidate.validateLogin(employid, password);
    const { _id } = await User.findByCredentials(employid, password);

    return await this.generateAndUpdateAccessTokenAndRefreshToken(_id, source);
  }

  async generateAndUpdateAccessTokenAndRefreshToken(_id, source) {
    const token = await tokenUtils.generateToken(
      { _id, source },
      process.env.JWT_LIFE_ACCESS_TOKEN
    );
    const refreshToken = await tokenUtils.generateToken(
      { _id, source },
      process.env.JWT_LIFE_REFRESH_TOKEN
    );

    await User.updateOne({ _id }, { $pull: { refreshTokens: { source } } });
    await User.updateOne(
      { _id },
      { $push: { refreshTokens: { token: refreshToken, source } } }
    );

    return {
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshToken, reqSource) {
    // check token
    const { _id } = await tokenUtils.verifyToken(refreshToken);

    const user = await User.findOne({
      _id,
      isActived: true,
      refreshTokens: {
        $elemMatch: { token: refreshToken, source: reqSource },
      },
    });

    if (!user) throw new AuthenError();

    return await tokenUtils.generateToken(
      { _id, source: reqSource },
      process.env.JWT_LIFE_ACCESS_TOKEN
    );
  }

  async registry(userInfo) {
    const registryInfo = await userValidate.checkRegistryInfo2(userInfo);

    const avatarColor = await classifyService.getRandomColor();
    const newUser = new User({
      ...registryInfo,
      avatarColor,
      isActived: true,
    });
    const saveUser = await newUser.save();

    const { _id, username } = saveUser;
    this.sendOTP(_id, username);
  }
  //////dk 2
  async registry2(userInfo2) {
    const registryInfo = await userValidate.checkRegistryInfo2(userInfo2);

    const avatarColor = await classifyService.getRandomColor();
    const newUser = new User({
      ...registryInfo,
      avatarColor,
      isActived: false,
    });

    const saveUser = await newUser.save();

    // const { _id, username } = saveUser;
    // this.sendOTP(_id, username);
  }
  async confirmAccount(username, otpPhone) {
    await userValidate.validateConfirmAccount(username, otpPhone);

    // tìm tài khoản chưa kích hoạt
    const user = await User.findOne({
      username,
      isActived: false,
    });
    if (!user) throw new NotFoundError("User");

    const { otp, otpTime } = user;
    this.checkOTP(otpPhone, otp, otpTime);

    await User.updateOne({ username }, { isActived: true });
  }

  async resetOTP(username) {
    if (!userValidate.validateUsername(username))
      throw new MyError("Username invalid");

    const user = await User.findOne({ username });
    if (!user) throw new NotFoundError("User");

    const { _id } = user;

    await this.sendOTP(_id, username);

    return {
      status: user.isActived,
    };
  }

  async resetPassword(username, otpPhone, password) {
    userValidate.validateResetPassword(username, otpPhone, password);

    const user = await User.findOne({
      username,
      isActived: true,
    });
    if (!user) throw new NotFoundError("User");

    const { otp, otpTime } = user;

    this.checkOTP(otpPhone, otp, otpTime);

    // cập nhật lại password
    const hashPassword = await commonUtils.hashPassword(password);

    await User.updateOne(
      { username },
      { password: hashPassword, otp: null, otpTime: null }
    );
  }

  async sendOTP(_id, username) {
    // email: true
    let type = true;

    if (userValidate.validatePhone(username)) type = false;

    const otp = commonUtils.getRandomOTP();
    const otpTime = new Date();
    otpTime.setMinutes(otpTime.getMinutes() + OTP_EXPIRE_MINUTE);
    await User.updateOne({ _id }, { otp, otpTime });
    if (type)
      mailer.sendMail(
        username,
        "Zelo - OTP xác nhận tài khoản",
        templateHtml.getOtpHtml(otp, OTP_EXPIRE_MINUTE)
      );
    else {
      const { data } = await axios.post(process.env.BALANCE_API_URL, {
        ApiKey: process.env.PHONE_API_KEY,
        SecretKey: process.env.PHONE_API_SECRET,
      });

      if (data.Balance > 500) {
        await axios.get(process.env.PHONE_OTP_API_URL, {
          params: {
            Phone: username,
            Content: `Zelo - Ma OTP (thoi han ${OTP_EXPIRE_MINUTE} phut) xac nhan tai khoan  la: ${otp} `,
            ApiKey: process.env.PHONE_API_KEY,
            SecretKey: process.env.PHONE_API_SECRET,
            SmsType: 8,
          },
        });
      } else throw new MyError("Insufficient money ");
    }
  }

  checkOTP(sendOTP, dbOTP, otpTime) {
    if (!dbOTP) throw new MyError("OTP không hợp lệ");

    // check hết hạn otp
    if (new Date() > otpTime) throw new MyError("OTP đã hết hạn");

    // nếu otp sai
    if (sendOTP !== dbOTP) throw new MyError("OTP không hợp lệ");
  }
  async twiliosendOTP(phone) {
    try {
      const sendOTP = await twilioClient.verify
        .services(serviceId)
        .verifications.create({
          to: `+84${phone}`,
          channel: "sms",
        });
    } catch (error) {
      console.log(error);
    }
  }

  async twilioviryfyOTP(phone, code) {
    try {
      const verifyOTP = await twilioClient.verify
        .services(serviceId)
        .verificationChecks.create({
          to: `+84${phone}`,
          code: code,
        });

      if (verifyOTP.valid) {
        return 1;
      }
      if (!verifyOTP.valid) {
        return 2;
      }
    } catch (error) {
      console.log(error);
    }
  }
  async forgetpassword(username, password) {
    const hashpassword = await bcrypt.hash(password, 8);
    const { nModified } = await User.updateOne(
      { username: username },
      { password: hashpassword }
    );

    if (nModified === 0) throw new NotFoundError("User");
  }

  async checkuser(username) {
    await userValidate.checkInfo(username);
    const { nModified } = await User.findOne({ username: username });
    if (nModified === 0) throw new NotFoundError("User");
  }
}

module.exports = new AuthService();
