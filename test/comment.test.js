// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

let sequelize_version = require('sequelize').version;
/* c8 ignore next 3 */
if (!sequelize_version)
	sequelize_version = require('sequelize/package').version;

const {wrapSequelize} = require('../index');
const chai = require("chai");
const expect = chai.expect;
const seq_version = require('sequelize').version;

const createFakeSequelize = () => {
	return {
		dialect: {
			Query: {
				prototype: {
					run: (sql) => {
						return Promise.resolve(sql);
					},
					sequelize: {
						config: {
							database: 'fake', client: 'fakesql',
						},
						options: {
							databaseVersion: 'fakesql-server:0.0.X',
							dialect: 'fakesql',
							timezone: '+00:00',
						},
					},
				},
			},
		},
	};
}

describe("Comments for Sequelize", () => {

	const fakeSequelize = createFakeSequelize();

	before(() => {
		wrapSequelize(fakeSequelize, {client_timezone:true, db_driver:true});
	});

	describe("Cases", () => {

		it("should add comment to generated sql", (done) => {

			const want = `SELECT * FROM foo /*client_timezone='%2B00%3A00',db_driver='sequelize%3A${seq_version}'*/`;
			const query = 'SELECT * FROM foo';

			fakeSequelize.dialect.Query.prototype.run(query).then((sql) => {
				expect(sql).equals(want);
			});

			done();
		});

		it("should NOT affix comments to statements with existing comments", (done) => {

			const q = [
				'SELECT * FROM people /* existing */',
				'SELECT * FROM people -- existing'
			];

			Promise.all([
				fakeSequelize.dialect.Query.prototype.run(q[0]),
				fakeSequelize.dialect.Query.prototype.run(q[1])
			]).then(([a, b]) => {
				expect(a).to.equal(q[0]);
				expect(b).to.equal(q[1]);
			});

			done();
		});

		it("should add expected database/driver properties", (done) => {
			const want = [
				"db_driver",
				"client_timezone"
			];
			fakeSequelize.dialect.Query.prototype.run('SELECT * FROM foo').then((sql) => {
				want.forEach((key) => {
					expect(sql.indexOf(key)).to.be.gt(-1);
				});
			});
			done();
		});

		it("should deterministically sort keys alphabetically", (done) => {
			const want = `SELECT * FROM foo /*client_timezone='%2B00%3A00',db_driver='sequelize%3A${seq_version}'*/`;
			fakeSequelize.dialect.Query.prototype.run('SELECT * FROM foo').then((got) => {
				expect(got).equals(want);
			});
			done();
		});

		it("chaining and repeated calls should NOT indefinitely chain SQL", (done) => {

			const want = `SELECT * FROM foo /*client_timezone='%2B00%3A00',db_driver='sequelize%3A${seq_version}'*/`;

			const sql = 'SELECT * FROM foo';

			fakeSequelize.dialect.Query.prototype.run(sql)
				.then((a) => fakeSequelize.dialect.Query.prototype.run(a))
				.then((b) => fakeSequelize.dialect.Query.prototype.run(b))
				.then((c) => fakeSequelize.dialect.Query.prototype.run(c))
				.then((d) => {
					expect(d).equals(want);
					done();
				});
		});
	});
});

describe("Excluding all variables", () => {

	const fakeSequelize = createFakeSequelize();

	before(() => {
		wrapSequelize(fakeSequelize, {non_existent: true});
	});


	it("when all variables are excluded, no comment should be generated", (done) => {
		// Allow a re-wrap.
		fakeSequelize.___alreadySQLCommenterWrapped___ = false;
		wrapSequelize(fakeSequelize, {foo:true});

		const want = `SELECT * FROM foo`;
		const sql =  `SELECT * FROM foo`;

		fakeSequelize.dialect.Query.prototype.run(sql).then((got) => {
			expect(got).equals(want);
		});
		done();
	});

	it("check all possible tags for google cloud sql insights", (done) => {
		// Allow a re-wrap.
		fakeSequelize.___alreadySQLCommenterWrapped___ = false;
		wrapSequelize(fakeSequelize, {
			foo: true,
			application:'myapp:1.0.0'
		});

		const want = `SELECT * FROM foo /*application='myapp%3A1.0.0',client_timezone='%2B00%3A00',db_driver='sequelize%3A6.5.0',foo='true'*/`;
		const sql =  `SELECT * FROM foo`;

		fakeSequelize.dialect.Query.prototype.run(sql).then((got) => {
			expect(got).equals(want);
		});
		done();
	});

});
