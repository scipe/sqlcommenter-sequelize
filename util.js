/**
 * fields represent variables that can be made optional for commenter output
 */
exports.fields = {
	ACTION: "action",
	CONTROLLER: "controller",
	FRAMEWORK: "framework",
	ROUTE: "route",
	APPLICATION: "application",
	DB_DRIVER: "db_driver",
	CLIENT_TIMEZONE: "client_timezone",
};

/**
 * Inspects the provided sql statement for existing comments.
 *
 * @param {String} sql The SQL string to inspect
 * @return {Boolean} true if a comment exists, false otherwise
 */
exports.hasComment = (sql) => {

	if (!sql)
		return false;

	// See https://docs.oracle.com/cd/B12037_01/server.101/b10759/sql_elements006.htm
	// for how to detect comments.
	const indexOpeningDashDashComment = sql.indexOf('--');
	if (indexOpeningDashDashComment >= 0)
		return true;

	const indexOpeningSlashComment = sql.indexOf('/*');
	if (indexOpeningSlashComment < 0)
		return false;

	// Check if it is a well formed comment.
	const indexClosingSlashComment = sql.indexOf('*/');

	/* c8 ignore next */
	return indexOpeningSlashComment < indexClosingSlashComment;
}
