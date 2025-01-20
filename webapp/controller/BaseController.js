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
		addTableColumns: function (oTable, column) {
		
		
			if (column.Edit == true || column.Edit == "true") {
				if ("CheckBox" == column.UIType) {
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan : "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						width: column.Width ? column.Width : "",
						multiLabels: column.Group ? [new sap.m.Label({ text: column.Group, textAlign: "Center", width: "100%" }), new sap.m.Label({ text: column.Title })] : null,
						template: new sap.m.CheckBox().bindProperty("selected", column.Field),
						filterProperty: column.Field
					}));
				} else {
					oTable.addColumn(new sap.ui.table.Column({
						headerSpan: column.headerSpan ? column.headerSpan : "",
						label: new sap.m.Text({
							wrapping: false,
							text: column.Title
						}),
						width: column.Width ? column.Width : "",
						multiLabels: column.Group ? [new sap.m.Label({ text: column.Group, textAlign: "Center", width: "100%" }), new sap.m.Label({ text: column.Title })] : null,
						template: new sap.m.Input().bindProperty("value", column.Field),
						filterProperty: column.Field
					}));
				}
			} else {
				oTable.addColumn(new sap.ui.table.Column({
					headerSpan: column.headerSpan ? column.headerSpan : "",
					autoResizable: true,
					flexible: false,
					width: column.Width ? column.Width : "",
					label: new sap.m.Text({
						wrapping: false,
						text: column.Title
					}),
					multiLabels: column.Group ? [new sap.m.Label({ text: column.Group, textAlign: "Center", width: "100%" }), new sap.m.Label({ text: column.Title })] : null,
					template: this.createColumnTemplate(column),
					filterProperty: column.Field
				}));
			}
		
			
		},
		createColumnTemplate: function (column) {
			if (column.Field.includes("Amount")) {
				// 单价列使用特殊的模板
				return new sap.m.VBox({  // 使用 VBox 垂直排列
					items: [
						new sap.m.Text({
							text: {
								path: column.Field
							},
							wrapping: false
						}),
						new sap.m.Text({
							text: {
								path: column.Field.replace("Amount", "IsLowest"),
								formatter: function (isLowest) {
									return isLowest ? "Rank 1 Lowest" : "";
								}
							},
							wrapping: false,
							visible: {
								path: column.Field.replace("Amount", "IsLowest"),
								formatter: function (isLowest) {
									return isLowest;
								}
							}
						}).addStyleClass("lowestPriceText")  // 动态添加样式类
					]
				});
			} else {
				// 其他列使用普通文本模板
				return new sap.m.Text({
					text: {
						path: column.Field
					}
				});
			}
		}

	});
});