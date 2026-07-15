var sails = require("sails");

var phone = process.env.OFFICER_PHONE || "0900000000";
var password = process.env.OFFICER_PASSWORD || "Officer123";
var displayName = process.env.OFFICER_DISPLAY_NAME || "Demo Officer";

sails.load(
  { hooks: { grunt: false }, log: { level: "warn" } },
  function loadApp(err) {
    if (err) {
      console.error("Failed to load Sails:", err);
      process.exit(1);
    }

    seedOfficer(function seedDone(seedErr, action) {
      if (seedErr) {
        console.error("Failed to seed officer:", seedErr);
        return sails.lower(function lowerAfterError() {
          process.exit(1);
        });
      }

      console.log(
        "Officer " + action + ": " + phone + " / " + password,
      );
      sails.lower(function lowerAfterSuccess() {
        process.exit(0);
      });
    });
  },
);

async function seedOfficer(done) {
  try {
    var existing = await Officer.findOne({ phone: phone });
    var values = {
      passwordHash: CryptoService.hashSecret(password),
      displayName: displayName,
      status: "active",
      updatedBy: "seed",
    };

    if (existing) {
      await Officer.update({ id: existing.id }, values);
      return done(null, "updated");
    }

    values.phone = phone;
    values.createdBy = "seed";
    await Officer.create(values);
    return done(null, "created");
  } catch (err) {
    return done(err);
  }
}
