"use strict";

const { hasComment } = require('../../util');
const chai = require("chai");
const expect = chai.expect;

describe("Unit", () => {

	describe("hasComment", () => {

		it("should return true for well-formed comments", () => {

			const queries = [
				`SELECT * FROM foo /* existing */`,
				`SELECT * FROM foo -- existing`
			];

			const want = true;
			queries.forEach(q => {
				expect(hasComment(q)).to.equal(want)
			});
		});

		it("should return false when comment is undefined", () => {
			let comment;
			expect(hasComment(comment)).to.equal(false);
		});

		it("should return false for malformed comments", () => {
			const queries = [
				"SELECT * FROM people /*",
				"SELECT * FROM people */ /*"
			];

			queries.forEach(q => {
				expect(hasComment(q)).to.equal(false);
			});
		});

	});
});
