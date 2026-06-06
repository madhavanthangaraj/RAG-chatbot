const authService = require('../services/auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body;
      const result = await authService.register({ username, email, password, role });
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Successfully logged out'
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
