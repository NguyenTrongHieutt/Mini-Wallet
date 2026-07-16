var crud = require("./OfficerServiceCrudService");
var configuration = require("./OfficerServiceConfigurationService");
var transFields = require("./OfficerTransFieldService");
var transValidations = require("./OfficerTransValidationService");

// Compatibility facade used by OfficerServiceController. Keep the public
// method names stable while implementation responsibilities live in focused
// services.
module.exports = {
  create: crud.create,
  list: crud.list,
  detail: crud.detail,
  update: crud.update,
  listTransFields: transFields.list,
  insertTransField: transFields.insert,
  updateTransField: transFields.update,
  listTransValidations: transValidations.list,
  insertTransValidation: transValidations.insert,
  updateTransValidation: transValidations.update,
  updateFieldBuilder: configuration.updateFieldBuilder,
  updateActions: configuration.updateActions,
  detailTransDefinition: configuration.detailTransDefinition,
  updateTransDefinition: configuration.updateTransDefinition,
  publish: crud.publish,
  unpublish: crud.unpublish,
};
