module.exports = {
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME || "jwt",
  AUTH_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,

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

    const currency = await Currency.findOne({ code: body.currency || "VND" });
    if (!currency) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "DEFAULT_CURRENCY_NOT_FOUND",
      );
    }

    const customer = await Customer.create({
      phone: body.phone,
      passwordHash: CryptoService.hashSecret(body.password),
      pinHash: CryptoService.hashSecret(body.pin),
      displayName: body.displayName || body.phone,
      status: "active",
    });

    const pocketSeed = {
      ownerId: String(customer.id),
      ownerType: "customer",
      currency: currency.id,
      balance: 0,
      name: customer.displayName + " Wallet",
      status: "active",
    };
    pocketSeed.checksum = CryptoService.checksumPocket(pocketSeed);

    const pocket = await Pocket.create(pocketSeed);

    const auth = await this.createAuthSession(customer, "customer");

    return {
      token: auth.token,
      data: {
        customer: this.publicUser(customer),
        pocket: this.publicPocket(pocket, currency),
        auth: {
          expiresAt: auth.expiredAt,
          tokenType: "Bearer",
        },
      },
    };
  },

  loginCustomer: async function (body) {
    return this.login(Customer, "customer", body);
  },

  loginOfficer: async function (body) {
    return this.login(Officer, "officer", body);
  },

  login: async function (model, userType, body) {
    body = body || {};

    AuthValidatorService.validateLoginPayload(body);

    const user = await model.findOne({ phone: body.phone });
    const secret = body.password;
    const hash = user && userType === "customer" ? user.passwordHash : null;

    if (
      !user ||
      user.status !== "active" ||
      !CryptoService.verifySecret(secret, hash)
    ) {
      throw AppErrorService.create(
        EnvelopeService.CODE.UNAUTHORIZED,
        "INVALID_CREDENTIALS",
      );
    }

    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const auth = await this.createAuthSession(user, userType, expiredAt);

    const data = {
      auth: {
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

    await Session.update({ id: user.sessionId }, { status: "revoked" });
    return null;
  },

  createAuthSession: async function (user, userType, expiredAt) {
    expiredAt = expiredAt || new Date(Date.now() + this.AUTH_TOKEN_TTL_MS);

    const token = JwtService.sign({
      userId: String(user.id),
      userType: userType,
    });

    await Session.create({
      tokenHash: CryptoService.hashToken(token),
      userType: userType,
      userId: String(user.id),
      status: "active",
      expiredAt: expiredAt,
      customer: userType === "customer" ? user.id : undefined,
      officer: userType === "officer" ? user.id : undefined,
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
    return {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      maxAge: this.AUTH_TOKEN_TTL_MS,
      path: "/",
    };
  },

  setAuthCookie: function (res, token) {
    res.cookie(this.AUTH_COOKIE_NAME, token, this.cookieOptions());
  },

  clearAuthCookie: function (res) {
    res.clearCookie(this.AUTH_COOKIE_NAME, { path: "/" });
  },
};
