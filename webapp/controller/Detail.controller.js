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
            var that = this;
            this.readRfpItemDataAsync(internalid).then(rfpItemData => {
                that.readRfpItemPriceDataAsync(internalid).then(rfpItemPriceData => {
                    var rfpItems = rfpItemData.results || [];
                    var suppliners = [];
        
                    // 处理供应商数据
                    rfpItemPriceData.results.forEach(row => {
                        if (!suppliners.includes(row.Supplier)) {
                            suppliners.push(row.Supplier);
                        }
                        let record = rfpItems.find(item => item.Internalid === row.Internalid && item.Itemid === row.Itemid);
                        if (!record) {
                            record = { Internalid: row.Internalid, Itemid: row.Itemid };
                            rfpItems.push(record);
                        }
                        record[row.Supplier + "Supplier"] = row.Supplier;
                        record[row.Supplier + "Amount"] = row.Amount;
                        record[row.Supplier + "Currency"] = row.Currency;
                        record[row.Supplier + "Specification"] = row.Specification;
                        record[row.Supplier + "Award"] = row.Award;
                        record[row.Supplier + "Specification_Old"] = row.Specification;
                        record[row.Supplier + "Award_Old"] = row.Award;
        
                        if (!record.lowestPrice || row.Amount < record.lowestPrice) {
                            record.lowestPrice = row.Amount;
                            record.lowestPriceSupplier = row.Supplier;
                        }
                    });
        
                    // 获取表格控件并清空现有列
                    var oTable = that.getView().byId("materialTable");
                    oTable.destroyColumns();
                    if (suppliners) {
                        this.addTableColumns(oTable, { "Field": "Itemid", "Title": "{i18n>Itemid}", Width: "3em" });
                        this.addTableColumns(oTable, { "Field": "Materialcode", "Title": "{i18n>materialCode}", Width: "8em" });
                        this.addTableColumns(oTable, { "Field": "Itemdescription", "Title": "{i18n>Itemdescription}", Width: "15em" });
                        this.addTableColumns(oTable, { "Field": "Quantity", "Title": "{i18n>Quantity}", Width: "6em" });
                        suppliners.forEach(suppliner => {
                            this.addTableColumns(oTable, { "Field": suppliner + "-Amount", "Title": "{i18n>Amount}", "UIType":"LOWEST_SUPPLIER", "Group": suppliner, "headerSpan": 5, Width: "7em"});//ObjectListItem
                            this.addTableColumns(oTable, { "Field": suppliner + "-TotalAmount", "Title": "{i18n>TotalAmount}", "Group": suppliner, Width: "5em" });
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
        onSavePress: function(){
            var that = this;
            // 获取 ODataModel
            var oRfpModel = this.getRfpModel();
            console.log("获取到的模型实例：", oRfpModel);
            console.log("模型是否为 ODataModel v2：", oRfpModel instanceof sap.ui.model.odata.v2.ODataModel);
        
            if (!(oRfpModel instanceof sap.ui.model.odata.v2.ODataModel)) {
                console.error("当前模型不是 ODataModel v2，无法调用 update 方法");
                return;
            }
        
            // 获取表格数据
            var oTable = this.getView().byId("materialTable");
            var oJsonModel = oTable.getModel();
            var aData = oJsonModel.getData().rows;
        
            // 遍历表格数据，更新每一行
            aData.forEach(function (oRow) {
                // 确保每一行都有 Internalid 和 Itemid
                if (oRow.Internalid && oRow.Itemid) {
                    // 构造更新路径
                    var sEntityPath = "/zrfp_itemSet(Internalid='" + oRow.Internalid + "',Itemid='" + oRow.Itemid + "')";
        
                    // 确保传递的数据对象中包含所有需要更新的字段
                    var oUpdateData = {
                        Internalid: oRow.Internalid,
                        Itemid: oRow.Itemid,
                        Itemdescription: oRow.Itemdescription,
                        Materialcode: oRow.Materialcode,
                        Quantity: oRow.Quantity,
                        Unit: oRow.Unit
                    };
        
                    // 执行更新操作
                    oRfpModel.update(sEntityPath, oUpdateData, {
                        success: function () {
                            console.log("更新成功：", sEntityPath);
                            MessageToast.show(that.getResourceBundleText("updateSuccessful"));
                        },
                        error: function (oError) {
                            console.error("更新失败：", oError, "路径：", sEntityPath);
                            MessageToast.show(that.getResourceBundleText("updateFailed"));
                        }
                    });
                })
            }else{
                MessageToast.show(that.getResourceBundleText('noDataChangedError')); 
            }
        },
        onSendPress: function () {
            MessageToast.show("TODO:onSendPress");
        }
    });
});