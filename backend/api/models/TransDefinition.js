var DOMAIN = require("../../config/domain").domain;

module.exports = {
  attributes: {
    code: {
      type: "string",
      required: true,
      unique: true,
      index: true,
    },
    service: {
      type: "string",
      required: true,
      index: true,
    },
    glSteps: {
      type: "array",
      required: true,
    },
    status: {
      type: "string",
      enum: [DOMAIN.status.ACTIVE, DOMAIN.status.INACTIVE],
      defaultsTo: DOMAIN.status.ACTIVE,
      required: true,
      index: true,
    },
    createdBy: {
      type: "string",
    },
    updatedBy: {
      type: "string",
    },
  },

  loadActiveByService: async function (service) {
    const definition = await TransDefinition.findOne({
      service: String(service.id),
      status: DOMAIN.status.ACTIVE,
    });

    if (!definition) {
      throw AppErrorService.create(
        EnvelopeService.CODE.NOT_FOUND,
        "TRANS_DEFINITION_NOT_FOUND"
      );
    }

    return definition;
  },
};
