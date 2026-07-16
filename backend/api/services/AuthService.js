var DOMAIN = require("../../config/domain").domain;
var DEFAULTS = require("../../config/miniWallet").miniWallet;

module.exports = {
  AUTH_COOKIE_NAME: DEFAULTS.auth.cookieName,

  registerCustomer: async function (body) {
    body = body || {};

    AuthValidatorService.validateRegisterPayload(body);

    const existing = await Customer.findOne({ phone: body.phone });
    if (existing) {
      throw AppErrorService.create(
        EnvelopeService.CODE.CONFLICT,
        "CUSTOMER_PHONE_EXISTS",
      );
    }

    const walletConfig = MiniWalletConfigService.wallet();
    const currency = await Currency.findOne({
      code: body.currency || walletConfig.defaultCurrency,
      status: DOMAIN.status.ACTIVE,
    });
    if (!currency) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "DEFAULT_CURRENCY_NOT_FOUND",
      );
    }

    let customer;
    let pocket;

    try {
      customer = await Customer.create({
        phone: body.phone,
        passwordHash: CryptoService.hashSecret(body.password),
        pinHash: CryptoService.hashSecret(body.pin),
        displayName: body.displayName || body.phone,
        status: DOMAIN.status.ACTIVE,
      });

      const pocketSeed = {
        ownerId: String(customer.id),
        ownerType: DOMAIN.ownerType.CUSTOMER,
        currency: currency.id,
        balance: walletConfig.registrationBalance,
        name: customer.displayName + " Wallet",
        status: DOMAIN.status.ACTIVE,
      };
      pocketSeed.checksum = CryptoService.checksumPocket(pocketSeed);
      pocket = await Pocket.create(pocketSeed);

      const auth = await this.createAuthSession(
        customer,
        DOMAIN.userType.CUSTOMER,
      );

      return {
        token: auth.token,
        data: {
          customer: this.publicUser(customer),
          pocket: this.publicPocket(pocket, currency),
          auth: {
            accessToken: auth.token,
            expiresAt: auth.expiredAt,
            tokenType: "Bearer",
          },
        },
      };
    } catch (err) {
      if (pocket && pocket.id) {
        await Pocket.destroy({ id: pocket.id });
      }
      if (customer && customer.id) {
        await Customer.destroy({ id: customer.id });
      }
      throw err;
    }
  },

  loginCustomer: async function (body) {
    return this.login(Customer, DOMAIN.userType.CUSTOMER, body);
  },

  loginOfficer: async function (body) {
    return this.login(Officer, DOMAIN.userType.OFFICER, body);
  },

  login: async function (model, userType, body) {
    body = body || {};

    AuthValidatorService.validateLoginPayload(body);

    const user = await model.findOne({ phone: body.phone });
    const secret = body.password;
    const hash = user ? user.passwordHash : null;

    if (
      !user ||
      user.status !== DOMAIN.status.ACTIVE ||
      !CryptoService.verifySecret(secret, hash)
    ) {
      throw AppErrorService.create(
        EnvelopeService.CODE.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
      );
    }

    const auth = await this.createAuthSession(user, userType);

    const data = {
      auth: {
        accessToken: auth.token,
        expiresAt: auth.expiredAt,
        tokenType: "Bearer",
      },
    };
    data[userType] = this.publicUser(user);

    return {
      token: auth.token,
      data: data,
    };
  },

  logout: async function (user) {
    AuthValidatorService.validateLogoutInput(user);

    await Session.update(
      { id: user.sessionId },
      { status: DOMAIN.status.REVOKED },
    );
    return null;
  },

  createAuthSession: async function (user, userType, expiredAt) {
    const authConfig = MiniWalletConfigService.auth();
    const tokenTtlMs = authConfig.tokenTtlSeconds * 1000;
    expiredAt = expiredAt || new Date(Date.now() + tokenTtlMs);

    const token = JwtService.sign({
      userId: String(user.id),
      userType: userType,
    });

    await Session.create({
      tokenHash: CryptoService.hashToken(token),
      userType: userType,
      userId: String(user.id),
      status: DOMAIN.status.ACTIVE,
      expiredAt: expiredAt,
      customer:
        userType === DOMAIN.userType.CUSTOMER ? user.id : undefined,
      officer:
        userType === DOMAIN.userType.OFFICER ? user.id : undefined,
    });

    return {
      token: token,
      expiredAt: expiredAt,
    };
  },

  publicUser: function (user) {
    if (!user) {
      return null;
    }

    return {
      id: String(user.id),
      phone: user.phone,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  publicPocket: function (pocket, currency) {
    if (!pocket) {
      return null;
    }

    return {
      id: String(pocket.id),
      name: pocket.name,
      balance: pocket.balance,
      currency: currency
        ? {
            code: currency.code,
            name: currency.name,
            minorUnit: currency.minorUnit,
          }
        : pocket.currency,
      status: pocket.status,
      createdAt: pocket.createdAt,
      updatedAt: pocket.updatedAt,
    };
  },

  cookieOptions: function () {
    const authConfig = MiniWalletConfigService.auth();
    return {
      httpOnly: true,
      secure: authConfig.cookieSecure,
      maxAge: authConfig.tokenTtlSeconds * 1000,
      path: "/",
    };
  },

  setAuthCookie: function (res, token) {
    res.cookie(
      MiniWalletConfigService.auth().cookieName,
      token,
      this.cookieOptions(),
    );
  },

  clearAuthCookie: function (res) {
    res.clearCookie(MiniWalletConfigService.auth().cookieName, { path: "/" });
  },
};
