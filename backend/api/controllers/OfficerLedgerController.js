module.exports = {
  listEntries: async function (req, res) {
    try {
      const data = await OfficerLedgerService.listEntries(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "LEDGER_ENTRIES_LISTED", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "LEDGER_ENTRIES_LIST_FAILED");
    }
  },

  entryDetail: async function (req, res) {
    try {
      const data = await OfficerLedgerService.entryDetail(req.body || {});
      return res.ok(EnvelopeService.CODE.OK, "LEDGER_ENTRY_DETAIL", data);
    } catch (err) {
      return EnvelopeService.handleError(res, err, "LEDGER_ENTRY_DETAIL_FAILED");
    }
  },
};
