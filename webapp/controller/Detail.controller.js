sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, Column, Label, Text, MessageToast, Filter, FilterOperator) {
    "use strict";
    var rfpOModel;
    return BaseController.extend("ods4.controller.Detail", {
        _onDetailMatched: function (oEvent) {
            var that = this;
            var oParameters = oEvent.getParameter("arguments");
            var Internalid = oParameters.Internalid;
            rfpOModel.read("/zrfpSet(Internalid='Doc152422851')", {
                success: function (oData) {
                    console.log(oData);
                    var rfpModel = new sap.ui.model.json.JSONModel(oData);
                    that.getView().setModel(rfpModel, "rfpDetail");
                },
                error: function (oError) {
                    console.error("OData服务请求失败", oError);
                    MessageToast.show("OData服务请求失败: " + oError.message);
                }
            });
            this.genTable(Internalid);
        },
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
            rfpOModel = this.getOwnerComponent().getModel("rfp");
        },
        genTable: function (Internalid) {
            var that = this;
            var oTable = this.getView().byId("materialTable");
            oTable.destroyColumns();
            rfpOModel.read("/zrfp_item_priceSet", {
                filters: [
                    new Filter("Internalid", FilterOperator.EQ, Internalid)
                ],
                success: function (oData) {
                    console.log(oData);
                    var processedData = [];
                    var currentRow = null;
                    var maxRepeats = 0;
                    oData.results.forEach(function (item, index) {
                        if (currentRow === null || currentRow.Internalid !== item.Internalid || currentRow.Itemid !== item.Itemid) {
                            if (currentRow !== null) {
                                processedData.push(currentRow);
                                maxRepeats = Math.max(maxRepeats, currentRow.Specifications.length);
                                console.log("Adding currentRow:", currentRow);
                            }
                            currentRow = {
                                Internalid: item.Internalid,
                                Itemid: item.Itemid,
                                Currency: item.Currency,
                                Specifications: [item.Specification],
                                Suppliers: [item.Supplier],
                                Suppliernames: [item.Suppliername],
                                Amounts: [item.Amount],
                                Awards: [item.Award]
                            };
                        } else {
                            currentRow.Specifications.push(item.Specification);
                            currentRow.Suppliers.push(item.Supplier);
                            currentRow.Suppliernames.push(item.Suppliername);
                            currentRow.Amounts.push(item.Amount);
                            currentRow.Awards.push(item.Award);
                        }
                    });
                    if (currentRow !== null) {
                        processedData.push(currentRow);
                        maxRepeats = Math.max(maxRepeats, currentRow.Specifications.length);
                        
                    }
                    
                    var columns = [
                        { name: "Internalid", path: "Internalid" },
                        { name: "Itemid", path: "Itemid" },
                        { name: "Currency", path: "Currency" }
                    ];
                    for (var i = 0; i < maxRepeats; i++) {
                        columns.push({ name: "Specification " + (i + 1), path: "Specifications", index: i });
                        columns.push({ name: "Supplier " + (i + 1), path: "Suppliers", index: i });
                        columns.push({ name: "Suppliername " + (i + 1), path: "Suppliernames", index: i });
                        columns.push({ name: "Amount " + (i + 1), path: "Amounts", index: i });
                        columns.push({ name: "Award " + (i + 1), path: "Awards", index: i });
                    }
                    columns.forEach(function (col) {
                        oTable.addColumn(new Column({
                            label: new Label({
                                text: col.name
                            }),
                            template: new Text({
                                text: {
                                    path: col.path,
                                    formatter: function (value, context) {
                                        
                                        var index = col.index;
                                        if (Array.isArray(value) && index !== undefined) {
                                            return index < value.length ? value[index] : "";
                                        }
                                        return value || "";
                                    }
                                }
                            })
                        }));
                    });
                    var oModel = new sap.ui.model.json.JSONModel({
                        rows: processedData
                    });
                    oTable.setModel(oModel);
                    oTable.bindRows("/rows");
                },
                error: function (oError) {
                    console.error("OData服务请求失败", oError);
                    MessageToast.show("OData服务请求失败: " + oError.message);
                }
            });
        }
    });
});