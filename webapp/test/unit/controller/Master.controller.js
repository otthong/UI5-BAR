/*global QUnit*/

sap.ui.define([
	"ods4/controller/Master.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Master Controller");

	QUnit.test("I should test the Master controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
