sap.ui.define([
    "./BaseController",
    'sap/m/MessageToast',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], function (BaseController, MessageToast, Filter, FilterOperator) {
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
            // 获取路由参数
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
        },
        genTable: function (internalid) {
            this.readRfpItemDataAsync(internalid).then(rfpItemData => {
                this.readRfpItemPriceDataAsync(internalid).then(rfpItemPriceData => {
                    console.log(rfpItemData);
                    console.log(rfpItemPriceData);
                    var rfpItems = rfpItemData.results;
                    var suppliners = []; //统计一共有多少供应商
                    //为每个物料添加供应商数据列
                    rfpItemPriceData.results.forEach(row => {
                        if (!suppliners.includes(row.Supplier)) {
                            suppliners.push(row.Supplier)
                        }
                        let record = rfpItems.find(item => item.Internalid === row.Internalid && item.Itemid === row.Itemid);
                        record[row.Supplier + "-Supplier"] = row.Supplier;
                        record[row.Supplier + "-Amount"] = row.Amount;
                        record[row.Supplier + "-Currency"] = row.Currency;
                        record[row.Supplier + "-Specification"] = row.Specification;
                        record[row.Supplier + "-Award"] = row.Award;
                        record[row.Supplier + "-Specification_Old"] = row.Specification;
                        record[row.Supplier + "-Award_Old"] = row.Award;
                    });

                    //Add dynamic columns based on suppliers
                    var oTable = this.getView().byId("materialTable");
                    oTable.destroyColumns();
                    if (suppliners) {
                        this.addTableColumns(oTable, { "Field": "Itemid", "Title": "{i18n>Itemid}", Width: "2em" });
                        this.addTableColumns(oTable, { "Field": "Materialcode", "Title": "{i18n>materialCode}", Width: "8em" });
                        this.addTableColumns(oTable, { "Field": "Itemdescription", "Title": "{i18n>Itemdescription}", Width: "15em" });
                        this.addTableColumns(oTable, { "Field": "Quantity", "Title": "{i18n>Quantity}", Width: "4em" });
                        suppliners.forEach(suppliner => {
                            this.addTableColumns(oTable, { "Field": suppliner + "-Amount", "Title": "{i18n>Amount}", "Group": suppliner, "headerSpan": 4, Width: "5em" });
                            this.addTableColumns(oTable, { "Field": suppliner + "-Currency", "Title": "{i18n>Currency}", "Group": suppliner, Width: "3em" });
                            this.addTableColumns(oTable, { "Field": suppliner + "-Specification", "Title": "{i18n>Specification}", "UIType": "Text", "Edit": 'true', "Group": suppliner, Width: "15em" });
                            this.addTableColumns(oTable, { "Field": suppliner + "-Award", "Title": "{i18n>Award}", "UIType": "Text", "Edit": 'true', "Group": suppliner, Width: "8em" });
                        })

                        //绑定数据
                        var oModel = new sap.ui.model.json.JSONModel({
                            rows: rfpItems
                        });
                        oTable.setModel(oModel);
                        oTable.bindRows("/rows");
                    }
                })
            });
        },
        onSavePress: function(){
            var oTable = this.getView().byId("materialTable");
            MessageToast.show("TODO:Save by call odata"+JSON.stringify(oTable.getModel().getData()));
        },
        onCancelPress: function(){
            this.onNavBack();
        }
    });
});