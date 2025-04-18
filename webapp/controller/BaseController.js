sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (Controller, History) {
	"use strict";

	return Controller.extend(".ods4.controller.BaseController", {
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},
		debounce: function(fn, delay) {
			let timer = null;
			return function() {
				const context = this;
				const args = arguments;
				clearTimeout(timer);
				timer = setTimeout(() => {
					fn.apply(context, args);
				}, delay);
			};
		},
		addTableColumns: function(oTable, column){
			if (column.Edit == true || column.Edit == "true") {
				if ("CheckBox" == column.UIType) {
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan: "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						width: column.Width ? column.Width : "",
						// visible: column.hidden == undefined || !column.hidden,
						multiLabels: column.Group ? [new sap.m.Label({text: column.Group,textAlign:"Center",width:"100%"}), new sap.m.Label({text: column.Title})] : null,
						template: new sap.m.CheckBox().bindProperty("selected", column.Field),
						filterProperty: column.Field
					}));
				} else if("PercentInput" == column.UIType){
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan: "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						width: column.Width ? column.Width : "",
						multiLabels: column.Group ? [new sap.m.Label({text: column.Group,textAlign:"Center",width:"100%"}), new sap.m.Label({text: column.Title})] : null,
						template: new sap.m.Input({
							value:{
								path:column.Field,
								type: 'sap.ui.model.type.Float',
								constraints: {minimum: 0, maximum: 1},
								formatter: this.formatPercentage.bind(this)
							},
							submit: this.onPercentInputChange
						}),
						filterProperty: column.Field
					}));
				} else {
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan: "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						width: column.Width ? column.Width : "",
						multiLabels: column.Group ? [new sap.m.Label({text: column.Group,textAlign:"Center",width:"100%"}), new sap.m.Label({text: column.Title})] : null,
						template: new sap.m.Input({
							value:{
								path:column.Field,
							}
						}),
						filterProperty: column.Field
					}));
				}
			} else {
				//最低价列
				if("LOWEST_SUPPLIER" == column.UIType){
					var objTemplate = new sap.m.VBox({
						items: [
							new sap.m.Text().bindProperty("text", column.Field).setWrapping(false),
							new sap.m.ObjectStatus({
								text:{
									parts: [
										{path: column.Field},
										{path: "lowestPrice"},
									],
									formatter: this.formatLowestPrice.bind(this)
								},
								state:"Success"
							})
						]
					});
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan: "",
						autoResizable: true,
						flexible: false,
						width: column.Width ? column.Width : "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						multiLabels: column.Group ? [new sap.m.Label({text: column.Group,textAlign:"Center",width:"100%"}), new sap.m.Label({text: column.Title})] : null,
						// visible: column.hidden == undefined || !column.hidden,
						template: objTemplate,
						filterProperty: column.Field
					}));
				}else{
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan: "",
						autoResizable: true,
						flexible: false,
						width: column.Width ? column.Width : "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						multiLabels: column.Group ? [new sap.m.Label({text: column.Group,textAlign:"Center",width:"100%"}), new sap.m.Label({text: column.Title})] : null,
						// visible: column.hidden == undefined || !column.hidden,
						template: new sap.m.Text().bindProperty("text", column.Field).setWrapping(false),
						filterProperty: column.Field
					}));
				}
			}
		},
		getResourceBundleText: function (text, aValues) {
			if (this.bundle === undefined || this.bundle === null) {
			  this.bundle = this.getResourceBundle();
			}
			return this.bundle.getText(text, JSON.stringify(aValues, null, 2));
		},
		 downloadFileFromOData:function(odataUrl, fileName) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", odataUrl, true);
			xhr.responseType = "blob";
			var that = this;
			xhr.onload = function () {
				if (xhr.status === 200) {
					var contentType = xhr.getResponseHeader("Content-Type");
					var contentDisposition = xhr.getResponseHeader("Content-Disposition");
					var fileName = contentDisposition ? contentDisposition.split("filename=")[1] : "file.xlsx";
		
					var blob = new Blob([xhr.response], { type: contentType });
					that.downloadFile(blob, fileName);
				} else {
					console.error("Failed to download file. Status:", xhr.status);
				}
			};
		
			xhr.onerror = function () {
				console.error("Error downloading file.");
			};
		
			xhr.send();
		},
		downloadFile: function(blob, fileName) {
			var url = URL.createObjectURL(blob);
			var a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	});
});