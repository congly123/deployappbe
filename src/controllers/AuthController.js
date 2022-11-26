const authService = require("../services/AuthService");
const userService = require("../services/UserSevice");

class AuthController {
  // [POST] /login
  async login(req, res, next) {
    const { employid, password } = req.body;

    const source = req.headers["user-agent"];

    try {
      const { token, refreshToken } = await authService.login(
        employid,
        password,
        source
      );
      res.json({ token, refreshToken });
    } catch (err) {
      next(err);
    }
  }

  // [POST] /refresh-token
  async refreshToken(req, res, next) {
    const { refreshToken } = req.body;
    const source = req.headers["user-agent"];

    try {
      const token = await authService.refreshToken(refreshToken, source);

      res.json({ token });
    } catch (err) {
      next(err);
    }
  }

  // [POST] /registry
  // async registry(req, res, next) {
  //     try {
  //         await authService.registry(req.body);

  //         res.status(201).json();
  //     } catch (err) {
  //         next(err);
  //     }
  // }
  // [POST] /registry2
  async registry2(req, res, next) {
    try {
      await authService.registry2(req.body);

      res.status(201).json();
    } catch (err) {
      next(err);
    }
  }
  // [POST] /confirm-account
  async confirmAccount(req, res, next) {
    const { username, otp } = req.body;

    try {
      await authService.confirmAccount(username, otp + "");

      res.json();
    } catch (err) {
      next(err);
    }
  }

  // [POST] /reset-otp
  async resetOTP(req, res, next) {
    const { username } = req.body;
    try {
      const status = await authService.resetOTP(username);

      res.json(status);
    } catch (err) {
      next(err);
    }
  }

  // [POST] /confirm-password
  async confirmPassword(req, res, next) {
    const { username, otp, password } = req.body;

    try {
      await authService.resetPassword(username, otp + "", password);

      res.json();
    } catch (err) {
      next(err);
    }
  }

  // [GET]  /users/:username
  async getUserInfo(req, res, next) {
    const { username } = req.params;

    try {
      const user = await userService.getUserSummaryInfo(username);

      return res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async twiliosendOTP(req, res, next) {
    const phone = req.body.phone;
    try {
      const user = await authService.twiliosendOTP(phone);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async twilioviryfyOTP(req, res, next) {
    const { phone, code } = req.body;
    try {
      const user = await authService.twilioviryfyOTP(phone, code);
      res.json(user === 1 ? "Đúng" : "Sai");
    } catch (err) {
      next(err);
    }
  }
  async forgetpassword(req, res, next) {
    const { username, password } = req.body;
    try {
      const user = await authService.forgetpassword(username, password);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async checkuser(req, res, next) {
    const username = req.body.username;
    try {
      const user = await authService.checkuser(username);
      console.log(user);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
