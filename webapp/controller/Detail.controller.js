sap.ui.define([
    "./BaseController",
    'sap/m/MessageToast',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/VBox"
], function (BaseController, MessageToast, Filter, FilterOperator, Column, Label, Text, Input, VBox) {
    "use strict";
    var rfpOModel;
    return BaseController.extend("ods4.controller.Detail", {
        getRfpModel: function () {
            if (!rfpOModel) {
                rfpOModel = this.getOwnerComponent().getModel("rfp");
            }
            return rfpOModel;
        },
        _onDetailMatched: function (oEvent) {
            var oParameters = oEvent.getParameter("arguments");
            var internalid = oParameters.Internalid;
            var that = this;
            this.readRfpDataAsync(internalid).then(rfpData => {
                var rfpModel = new sap.ui.model.json.JSONModel(rfpData);
                that.getView().setModel(rfpModel, "rfpDetail");
                that.genTable(internalid);
            });
        },
        readRfpDataAsync: function (internalid) {
            return new Promise((resolve, reject) => {
                var sPath = "/zrfpSet(Internalid='" + internalid + "')";
                var oParameters = {
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                };
                this.getRfpModel().read(sPath, oParameters);
            });
        },
        readRfpItemDataAsync: function (internalid) {
            return new Promise((resolve, reject) => {
                var sPath = "/zrfp_itemSet";
                var oFilter1 = new Filter("Internalid", FilterOperator.EQ, internalid);
                var oParameters = {
                    filters: [oFilter1],
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                };
                this.getRfpModel().read(sPath, oParameters);
            });
        },
        readRfpItemPriceDataAsync: function (internalid) {
            return new Promise((resolve, reject) => {
                var sPath = "/zrfp_item_priceSet";
                var oFilter1 = new Filter("Internalid", FilterOperator.EQ, internalid);
                var oParameters = {
                    filters: [oFilter1],
                    success: function (oData) {
                        resolve(oData);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                };
                this.getRfpModel().read(sPath, oParameters);
            });
        },
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
        
            // 获取 OData 模型
            var oModel = this.getOwnerComponent().getModel("rfp");
        
            // 检查模型是否为 ODataModel
            if (oModel instanceof sap.ui.model.odata.v2.ODataModel) {
                // oModel.setDefaultUpdateMethod("PUT"); // 或 "MERGE"，根据后端支持选择
                oModel.setRefreshAfterChange(true); // 保存后自动刷新模型
            } else {
                console.error("模型 'rfp' 不是 ODataModel 实例");
            }
        },
        genTable: function (internalid) {
            this.readRfpItemDataAsync(internalid).then(rfpItemData => {
                this.readRfpItemPriceDataAsync(internalid).then(rfpItemPriceData => {
                    var rfpItems = rfpItemData.results;
                    var suppliners = [];
                    rfpItemPriceData.results.forEach(row => {
                        if (!suppliners.includes(row.Supplier)) {
                            suppliners.push(row.Supplier);
                        }
                        let record = rfpItems.find(item => item.Internalid === row.Internalid && item.Itemid === row.Itemid);
                        if (!record) {
                            record = { Internalid: row.Internalid, Itemid: row.Itemid };
                            rfpItems.push(record);
                        }
                        record[row.Supplier + "-Supplier"] = row.Supplier;
                        record[row.Supplier + "-Amount"] = row.Amount;
                        record[row.Supplier + "-Currency"] = row.Currency;
                        record[row.Supplier + "-Specification"] = row.Specification;
                        record[row.Supplier + "-Award"] = row.Award;
                        record[row.Supplier + "-Specification_Old"] = row.Specification;
                        record[row.Supplier + "-Award_Old"] = row.Award;

                        if (!record.lowestPrice || row.Amount < record.lowestPrice) {
                            record.lowestPrice = row.Amount;
                            record.lowestPriceSupplier = row.Supplier;
                        }
                    });

                    var oTable = this.getView().byId("materialTable");
                    oTable.destroyColumns();
                    if (suppliners) {
                        oTable.addColumn(new Column({
                            label: new Label({ text: "{i18n>Itemid}" }),
                            template: new Text({ text: "{Itemid}" }),
                            width: "2em"
                        }));
                        oTable.addColumn(new Column({
                            label: new Label({ text: "{i18n>materialCode}" }),
                            template: new Text({ text: "{Materialcode}" }),
                            width: "8em"
                        }));
                        oTable.addColumn(new Column({
                            label: new Label({ text: "{i18n>Itemdescription}" }),
                            template: new Text({ text: "{Itemdescription}" }),
                            width: "15em"
                        }));
                        oTable.addColumn(new Column({
                            label: new Label({ text: "{i18n>Quantity}" }),
                            template: new Text({ text: "{Quantity}" }),
                            width: "4em"
                        }));

                        suppliners.forEach(suppliner => {
                            oTable.addColumn(new Column({
                                label: new Label({ text: suppliner + " {i18n>Amount}" }),
                                template: this.createPriceTemplate(suppliner),
                                width: "5em"
                            }));
                            oTable.addColumn(new Column({
                                label: new Label({ text: suppliner + " {i18n>Currency}" }),
                                template: new Text({ text: `{${suppliner}-Currency}` }),
                                width: "3em"
                            }));
                            oTable.addColumn(new Column({
                                label: new Label({ text: suppliner + " {i18n>Specification}" }),
                                template: new Input({
                                    value: `{${suppliner}-Specification}`,
                                    editable: true
                                }),
                                width: "15em"
                            }));
                            oTable.addColumn(new Column({
                                label: new Label({ text: suppliner + " {i18n>Award}" }),
                                template: new Input({
                                    value: `{${suppliner}-Award}`,
                                    editable: true
                                }),
                                width: "8em"
                            }));
                        });

                        var oModel = new sap.ui.model.json.JSONModel({ rows: rfpItems });
                        oTable.setModel(oModel);
                        oTable.bindRows("/rows");
                    }
                });
            });
        },
        createPriceTemplate: function (supplier) {
            return new VBox({
                items: [
                    new Text({
                        text: `{${supplier}-Amount}`
                    }),
                    new Text({
                        text: {
                            path: `lowestPriceSupplier`,
                            formatter: (lowestSupplier) => lowestSupplier === supplier ? "Rank 1 Lowest" : ""
                        }
                    }).addStyleClass("lowestPriceText")
                ]
            });
        },
        onSavePress: function () {
            var oTable = this.getView().byId("materialTable");
            var oModel = oTable.getModel(); // 获取绑定到表格的模型
            var aData = oModel.getData().rows;

            aData.forEach(function (oRow) {
                if (oRow.__metadata) {
                    var sEntityPath = oRow.__metadata.uri;
                    delete oRow.__metadata;
                    oModel.update(sEntityPath, oRow, {
                        success: function (oData) {
                            MessageToast.show("保存成功");
                        },
                        error: function (oError) {
                            MessageToast.show("保存失败: " + oError.message);
                        }
                    });
                }
            });
        },
        onCancelPress: function () {
            this.onNavBack();
        }
    });
});