sap.ui.define([
    "./BaseController",
    'sap/m/MessageToast',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat"
], function (BaseController, MessageToast, Filter, FilterOperator, NumberFormat) {
    "use strict";
    var suppliners;
    return BaseController.extend("ods4.controller.Detail", {
        getRfpModel: function () {
            return this.getOwnerComponent().getModel("rfp");
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
                    console.log(rfpItemData);
                    console.log(rfpItemPriceData);
                    var rfpItems = rfpItemData.results;
                    suppliners = []; //统计一共有多少供应商
                    //为每个物料添加供应商数据列
                    rfpItemPriceData.results.forEach(row => {
                        if (!suppliners.includes(row.Supplier)) {
                            suppliners.push(row.Supplier)
                        }
                        let record = rfpItems.find(item => item.Internalid === row.Internalid && item.Itemid === row.Itemid);
                        record[row.Supplier + "-Supplier"] = row.Supplier;
                        record[row.Supplier + "-Amount"] = row.Amount;
                        record[row.Supplier + "-TotalAmount"] = row.Amount * record.Quantity;
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

                    //Add dynamic columns based on suppliers
                    var oTable = this.getView().byId("materialTable");
                    oTable.destroyColumns();
                    if (suppliners) {
                        this.addTableColumns(oTable, { "Field": "Itemid", "Title": "{i18n>Itemid}", Width: "3em" });
                        this.addTableColumns(oTable, { "Field": "Materialcode", "Title": "{i18n>materialCode}", Width: "8em" });
                        this.addTableColumns(oTable, { "Field": "Itemdescription", "Title": "{i18n>Itemdescription}", Width: "15em" });
                        this.addTableColumns(oTable, { "Field": "Quantity", "Title": "{i18n>Quantity}", Width: "6em" });
                        suppliners.forEach(suppliner => {
                            this.addTableColumns(oTable, { "Field": suppliner + "-Amount", "Title": "{i18n>Amount}", "UIType": "LOWEST_SUPPLIER", "Group": suppliner, "headerSpan": 5, Width: "7em" });//ObjectListItem
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
        formatLowestPrice: function (price, lowestPrice) {
            if (price === lowestPrice)
                return "Rank 1 Lowest";
            else
                return "";
        },
        formatPercentage: function (value) {
            if (value === undefined || value === null) {
                return "";
            }
            return NumberFormat.getPercentInstance().format(value);
        },
        onSavePress: function () {
            var that = this;
            // 获取 ODataModel
            var oRfpModel = this.getRfpModel();
            if (!(oRfpModel instanceof sap.ui.model.odata.v2.ODataModel)) {
                console.error("当前模型不是 ODataModel v2，无法调用 update 方法");
                return;
            }

            // 获取表格数据
            var oTable = this.getView().byId("materialTable");
            var oJsonModel = oTable.getModel();
            var aData = oJsonModel.getData().rows;
            //遍历所有数据获取有更新的记录
            var zrfpItemPriceChanged = []
            aData.forEach(function (oRow) {
                var Internalid = oRow["Internalid"];
                var Itemid = oRow["Itemid"];
                suppliners.forEach(s => {
                    var supplier = oRow[s + "-Supplier"];
                    if (supplier) {
                        var Award = oRow[s + "-Award"];
                        var Award_Old = oRow[s + "-Award_Old"];
                        var Specification = oRow[s + "-Specification"];
                        var Specification_Old = oRow[s + "-Specification_Old"];
                        if (Award != Award_Old || Specification != Specification_Old) {
                            zrfpItemPriceChanged.push({
                                "Internalid": Internalid,
                                "Itemid": Itemid,
                                "Supplier": supplier,
                                "Specification": Specification,
                                "Award": Award,
                            })

                        }
                    }
                })
                //TODO: 检查同一个物料配额的和必须等于0或100%
            });

            if (zrfpItemPriceChanged && zrfpItemPriceChanged.length > 0) {
                //1.设置useBatch为true
                oRfpModel.setUseBatch(true);
                zrfpItemPriceChanged.forEach(row => {
                    // 构造更新路径
                    var sEntityPath = "/zrfp_item_priceSet(Internalid='" + row.Internalid + "',Itemid='" + row.Itemid + "',Supplier='" + row.Supplier + "')";
                    // 执行更新操作
                    oRfpModel.update(sEntityPath, row, {
                        "groupId": row.Internalid + row.Itemid + row.Supplier,
                        "changeSetId": row.Internalid + row.Itemid + row.Supplier,
                        success: function () {
                            console.log("更新成功：", sEntityPath);
                            MessageToast.show(that.getResourceBundleText("updateSuccessful"));
                        },
                        error: function (oError) {
                            console.error("更新失败：", oError, "路径：", sEntityPath);
                            MessageToast.show(that.getResourceBundleText("updateFailed"));
                        }
                    });
                });
                oRfpModel.submitChanges();
            } else {
                MessageToast.show("您没有修改任何数据!");
            }
        },




        onSendPress: function () {
            // 从路由参数获取Internalid（即DocID）
            const sDocId = this._getDocIdFromRoute();
            if (!sDocId) {
                MessageToast.show(this.getResourceBundleText("invalidDocId"));
                return;
            }

            // 准备OData调用
            const oModel = this.getRfpModel();
            const sPath = `/zrfpSet(Internalid='${sDocId}')`;
            const oView = this.getView();

        
            oView.setBusy(true);

            //  调用OData更新方法
            oModel.update(sPath, {
                Action: "SUBMIT_TO_ARIBA" // 固定动作类型
            }, {
                method: "PUT",
                success: () => {
                    MessageToast.show(this.getResourceBundleText("submitSuccess"));
                    // 5. 刷新前端数据
                    oView.getModel("rfpDetail").updateBindings();
                },
                error: (oError) => {
                    console.error("提交失败:", oError);
                    MessageToast.show(this.getResourceBundleText("submitError"));
                },
                complete: () => {
                    oView.setBusy(false);
                }
            });
        },

        // 辅助方法：从路由参数获取Internalid
        _getDocIdFromRoute: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            const oRouteInfo = oRouter.getCurrentRouteInfo();

            // 安全获取参数
            return oRouteInfo?.arguments?.Internalid;

            //OData调用方法
        },

        onExportToExcel: function () {
            var that = this;
            // 获取 ODataModel
            var oRfpModel = this.getRfpModel();
            if (!(oRfpModel instanceof sap.ui.model.odata.v2.ODataModel)) {
                console.error("当前模型不是 ODataModel v2，无法调用 update 方法");
                return;
            }

            var Internalid = this.getView().getModel("rfpDetail").getData().Internalid;
            if (Internalid) {
                var sPath = "/sap/opu/odata/SAP/ZUI5SRVRFP_SRV/fileSet('" + Internalid + "')/$value";
                //this.downloadFileFromOData(sPath, "file.xlsx");
                window.open(sPath);
            } else {
                MessageToast.show(this.getResourceBundleText("downloadFailedNoInternalid"));
            }
        },
    });
});