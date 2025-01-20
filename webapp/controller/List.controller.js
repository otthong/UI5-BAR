sap.ui.define([
	"./BaseController",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	'sap/m/MessageToast'

], function(BaseController, ODataModel, JSONModel, Filter, FilterOperator, Sorter, Fragment, MessageToast) {
	"use strict";
	var rfpOModel;
	return BaseController.extend("ods4.controller.List", {
		getRfpModel: function () {
            if (!rfpOModel) {
                rfpOModel = this.getOwnerComponent().getModel("rfp");
            }
            return rfpOModel;
        },
		onInit: function() {
			this._mDialogs = {};
			this.aMessageFilters = [];
			var searchCriteria = new JSONModel({"InternalId":"","Description":"","Owner":""});
			this.getView().setModel(searchCriteria,"SearchCriteria");
			var oModel = this.getOwnerComponent().getModel("rfp");
			this.getView().setModel(oModel,"rfp");
		},
		onSearchPress: function(){
			var SearchCriteriaModel = this.getView().getModel("SearchCriteria");
			var SearchCriteria = SearchCriteriaModel.oData;
			var oTable = this.getView().byId("table");
			var oFilter;
			var oFilters = [];
			if(SearchCriteria){
				if(SearchCriteria.InternalId){
					oFilter = new Filter("Internalid", FilterOperator.Contains, SearchCriteria.InternalId);
					oFilters.push(oFilter);
				}
				if(SearchCriteria.Description){
					oFilter = new Filter("Description", FilterOperator.Contains, SearchCriteria.Description);
					oFilters.push(oFilter);
				}
				if(SearchCriteria.Owner){
					oFilter = new Filter("Owner", FilterOperator.Contains, SearchCriteria.Owner);
					oFilters.push(oFilter);
				}
			}
			oTable.getBinding().filter(oFilters);
		},	
		onRowNavigationPress: function(oEvent){
			var Internalid = oEvent.getSource().getBindingContext("rfp").getProperty("Internalid");
			MessageToast.show( Internalid + " pressed");
			
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("detail", {"Internalid": Internalid});
		}
	});
});
