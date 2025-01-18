sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	'sap/m/MessageToast'

], function(Controller, ODataModel, JSONModel, Filter, FilterOperator, Sorter, Fragment, MessageToast) {
	"use strict";
	return Controller.extend("ods4.controller.List", {

		onInit: function() {
			var oModel = this.getOwnerComponent().getModel("rfp");
			this._mDialogs = {};
			this.aMessageFilters = [];
			this.getView().setModel(oModel,"rfp");
		},
		onSearchPress: function(){
			MessageToast.show("TODO: filter by Input");
		},	
		onRowNavigationPress: function(oEvent){
			var Internalid = oEvent.getSource().getBindingContext("rfp").getProperty("Internalid");
			MessageToast.show( Internalid + " pressed");
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("detail", {"Internalid": Internalid});
		}
	});
});
