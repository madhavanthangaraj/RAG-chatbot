const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const config = require('../config/environment');
const { ConflictError, UnauthorizedError } = require('../utils/errors');

class AuthService {
  async register({ username, email, password, role }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser({
      username,
      email,
      passwordHash,
      role: role || 'user'
    });

    const tokens = this.generateTokens(user);
    await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
      const user = await userRepository.findById(decoded.id);
      
      if (!user || user.refresh_token !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);
      await userRepository.updateRefreshToken(user.id, tokens.refreshToken);

      return { user: this.sanitizeUser(user), ...tokens };
    } catch (err) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(userId) {
    await userRepository.updateRefreshToken(userId, null);
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  sanitizeUser(user) {
    const { password_hash, refresh_token, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
