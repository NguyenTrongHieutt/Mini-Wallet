module.exports = {
  create: action("create", "OFFICER_SERVICE_CREATED", "OFFICER_SERVICE_CREATE_FAILED", true),
  list: action("list", "OFFICER_SERVICES_LISTED", "OFFICER_SERVICES_LIST_FAILED"),
  detail: action("detail", "OFFICER_SERVICE_DETAIL", "OFFICER_SERVICE_DETAIL_FAILED"),
  update: action("update", "OFFICER_SERVICE_UPDATED", "OFFICER_SERVICE_UPDATE_FAILED", true),
  listTransFields: action(
    "listTransFields",
    "TRANS_FIELDS_LISTED",
    "TRANS_FIELDS_LIST_FAILED",
  ),
  updateTransField: action(
    "updateTransField",
    "TRANS_FIELD_UPDATED",
    "TRANS_FIELD_UPDATE_FAILED",
    true,
  ),
  insertTransField: action(
    "insertTransField",
    "TRANS_FIELD_INSERTED",
    "TRANS_FIELD_INSERT_FAILED",
    true,
  ),
  listTransValidations: action(
    "listTransValidations",
    "TRANS_VALIDATIONS_LISTED",
    "TRANS_VALIDATIONS_LIST_FAILED",
  ),
  updateTransValidation: action(
    "updateTransValidation",
    "TRANS_VALIDATION_UPDATED",
    "TRANS_VALIDATION_UPDATE_FAILED",
    true,
  ),
  insertTransValidation: action(
    "insertTransValidation",
    "TRANS_VALIDATION_INSERTED",
    "TRANS_VALIDATION_INSERT_FAILED",
    true,
  ),
  updateFieldBuilder: action(
    "updateFieldBuilder",
    "FIELD_BUILDER_UPDATED",
    "FIELD_BUILDER_UPDATE_FAILED",
    true,
  ),
  updateActions: action(
    "updateActions",
    "SERVICE_ACTIONS_UPDATED",
    "SERVICE_ACTIONS_UPDATE_FAILED",
    true,
  ),
  detailTransDefinition: action(
    "detailTransDefinition",
    "TRANS_DEFINITION_DETAIL",
    "TRANS_DEFINITION_DETAIL_FAILED",
  ),
  updateTransDefinition: action(
    "updateTransDefinition",
    "TRANS_DEFINITION_UPDATED",
    "TRANS_DEFINITION_UPDATE_FAILED",
    true,
  ),
  publish: action("publish", "SERVICE_PUBLISHED", "SERVICE_PUBLISH_FAILED", true),
  unpublish: action(
    "unpublish",
    "SERVICE_UNPUBLISHED",
    "SERVICE_UNPUBLISH_FAILED",
    true,
  ),
};

function action(method, successMessage, fallbackMessage, passOfficer) {
  return async function officerServiceAction(req, res) {
    try {
      const args = [req.body || {}];
      if (passOfficer) args.push(req.info.user);
      const data = await OfficerServiceService[method].apply(
        OfficerServiceService,
        args,
      );
      return res.ok(EnvelopeService.CODE.OK, successMessage, data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, fallbackMessage);
    }
  };
}
