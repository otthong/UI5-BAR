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
        
                    // 添加固定列
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
        
                    // 动态添加供应商相关的列
                    suppliners.forEach(suppliner => {
                        oTable.addColumn(new Column({
                            label: new Label({ text: suppliner + " {i18n>Amount}" }),
                            template: that.createPriceTemplate(suppliner),
                            width: "5em"
                        }));
                        oTable.addColumn(new Column({
                            label: new Label({ text: suppliner + " {i18n>Currency}" }),
                            template: new Text({ text: `{${suppliner}Currency}` }),
                            width: "3em"
                        }));
                        oTable.addColumn(new Column({
                            label: new Label({ text: suppliner + " {i18n>Specification}" }),
                            template: new Input({
                                value: `{${suppliner}Specification}`,
                                editable: true,
                                liveChange: function (oEvent) {
                                    var oSource = oEvent.getSource();
                                    var sPath = oSource.getBindingContext().getPath();
                                    var sValue = oEvent.getParameter("value");
                                    var oModel = oSource.getModel();
                                    oModel.setProperty(sPath + `/${suppliner}Specification`, sValue);
                                }
                            }),
                            width: "15em"
                        }));
                        oTable.addColumn(new Column({
                            label: new Label({ text: suppliner + " {i18n>Award}" }),
                            template: new Input({
                                value: `{${suppliner}Award}`,
                                editable: true,
                                liveChange: function (oEvent) {
                                    var oSource = oEvent.getSource();
                                    var sPath = oSource.getBindingContext().getPath();
                                    var sValue = oEvent.getParameter("value");
                                    var oModel = oSource.getModel();
                                    oModel.setProperty(sPath + `/${suppliner}Award`, sValue);
                                }
                            }),
                            width: "8em"
                        }));
                    });
        
                    // 将数据绑定到表格
                    var oJsonModel = new sap.ui.model.json.JSONModel({ rows: rfpItems });
                    oTable.setModel(oJsonModel);
                    oTable.bindRows("/rows");
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
            console.log("onSavePress 方法被触发");
        
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
                        },
                        error: function (oError) {
                            console.error("更新失败：", oError, "路径：", sEntityPath);
                        }
                    });
                } else {
                    console.error("缺少必要的键值 Internalid 或 Itemid，无法更新：", oRow);
                }
            });
        },
        onCancelPress: function () {
            this.onNavBack();
        }
    });
});