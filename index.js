const { hasComment } = require('./util');

/**
 * All available variables for the commenter are on the `util.fields` object
 * passing the excludes parameter will result in each item being excluded from
 * the commenter output
 *
 * @param {Object} sequelize
 * @param {Object} include - A map of values to be optionally included.
 * @param {Object} options - A configuration object specifying where to collect trace data from. Accepted fields are:
 *  TraceProvider: Should be either 'OpenCensus' or 'OpenTelemetry', indicating which library to collect trace data from.
 * @return {void}
 */
exports.wrapSequelize = (sequelize, include={}, options={}) => {
	/* c8 ignore next 2 */
	if (sequelize.___alreadySQLCommenterWrapped___)
		return;

	const run = sequelize.dialect.Query.prototype.run;

	// Please don't change this prototype from an explicit function
	// to use arrow functions lest we'll get bugs with not resolving "this".
	sequelize.dialect.Query.prototype.run = function(sql, sql_options) {

		// If a comment already exists, do not insert a new one.
		if (hasComment(sql))
			return run.apply(this, [sql, sql_options]);

		const comments = {
			...include,
			client_timezone: this.sequelize.options.timezone,
			db_driver: `sequelize:${sequelizeVersion}`,
		};

		// Filter out keys whose values are undefined or aren't to be included by default.
		const keys = Object.keys(comments).filter((key) => {
			return include[key] || comments[key];
		});

		// Finally sort the keys alphabetically.
		keys.sort();

		const commentStr = keys.map((key) => {
			const uri_encoded_key = encodeURIComponent(key);
			const uri_encoded_value = encodeURIComponent(comments[key]);
			return `${uri_encoded_key}=${uri_encoded_value}`;
		}).join(',');

		if (commentStr && commentStr.length > 0)
			sql = `${sql} /*${commentStr}*/`;

		return run.apply(this, [sql, sql_options]);
	}

	// Finally mark the object as having already been wrapped.
	sequelize.___alreadySQLCommenterWrapped___ = true;
}

const resolveSequelizeVersion = () => {
	const sv = require('sequelize').version;
	if (sv)
		return sv;

	return require('sequelize/package').version;
};

// Since resolveSequelizeVersion performs expensive lookups by imports,
// we should ensure that this is resolved only once at start time.
const sequelizeVersion = resolveSequelizeVersion();
