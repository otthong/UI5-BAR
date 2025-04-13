sap.ui.define([
    "./BaseController",
    'sap/m/MessageToast',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/format/NumberFormat"
], function (BaseController, MessageToast, Filter, FilterOperator,NumberFormat) {
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
                        record[row.Supplier + "-Amount"] = Number(row.Amount).toFixed(2); 
                        record[row.Supplier + "-TotalAmount"] = Number(row.Totalprice).toFixed(2); 
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
                        this.addTableColumns(oTable, { "Field": "Unit", "Title": "{i18n>Unit}", Width: "6em" });
                        suppliners.forEach(suppliner => {
                            this.addTableColumns(oTable, { "Field": suppliner + "-Amount", "Title": "{i18n>Amount}",  "UIType":"LOWEST_SUPPLIER", "Group": suppliner, "headerSpan": 5, Width: "7em",  "bindingTemplate": "{path:'" + suppliner + "-Amount', formatter: '.formatAmount'}" });//ObjectListItem
                            this.addTableColumns(oTable, { "Field": suppliner + "-TotalAmount", "Title": "{i18n>TotalAmount}", "Group": suppliner, Width: "5em" , "bindingTemplate": "{path:'" + suppliner + "-TotalAmount', formatter: '.formatAmount'}"});
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
        formatLowestPrice: function(price,lowestPrice){
            if(price === lowestPrice)
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
        // 科学计数法转换为小数格式
formatAmount: function(value) {
    if (!value) return "";
    // 设置小数位数为2，禁用科学计数法
    var oNumberFormat = NumberFormat.getFloatInstance({
        maxFractionDigits: 2,
        minFractionDigits: 2,
        groupingEnabled: true  // 启用千分位分隔符（如1,000.00）
    });
    return oNumberFormat.format(value);
},
onSavePress: function() {
    var that = this;
    var oRfpModel = this.getRfpModel();
    if (!(oRfpModel instanceof sap.ui.model.odata.v2.ODataModel)) {
        console.error("Invalid OData model");
        return;
    }

    var oTable = this.getView().byId("materialTable");
    var oJsonModel = oTable.getModel();
    var aData = oJsonModel.getData().rows;
    var zrfpItemPriceChanged = [];
    var errorMessages = [];
    var itemAwards = {};

    // 第一次循环：验证数据有效性（增强字段名兼容性）
    aData.forEach(function(oRow) {
        // 安全获取字段值（兼容不同命名规范）
        var itemid = oRow.Itemid || oRow.itemid || oRow.ItemId || "Unknown-ItemID";
        var itemDesc = oRow.Itemdescription || oRow.itemdescription || oRow.ItemDescription || "Unnamed Material";
        
        // 初始化物料统计
        itemAwards[itemid] = { sum: 0, name: itemDesc };

        suppliners.forEach(s => {
            var awardField = s + "-Award";
            var awardValue = oRow[awardField];

            // 空值处理（包括空字符串）
            if (awardValue === null || awardValue === undefined || awardValue === "") {
                errorMessages.push(
                    that.getResourceBundleText("awardNullError", [
                        s, 
                        String(itemid),
                        String(itemDesc)
                    ])
                );
                return;
            }

            // 类型转换（兼容千分位格式）
            var cleanedValue = String(awardValue).replace(/,/g, '');
            var parsedAward = parseFloat(cleanedValue);
            if (isNaN(parsedAward)) {
                errorMessages.push(
                    that.getResourceBundleText("invalidAwardValue", [
                        s, 
                        String(itemid),
                        String(itemDesc)
                    ])
                );
                return;
            }

            // 负值处理（允许0但不允许负数）
            if (parsedAward < 0) {
                errorMessages.push(
                    that.getResourceBundleText("negativeAwardError", [
                        s, 
                        String(itemid),
                        String(itemDesc)
                    ])
                );
                return;
            }

            // 精度处理（保留4位小数计算）
            parsedAward = Math.round(parsedAward * 10000) / 10000;
            itemAwards[itemid].sum += parsedAward;
        });

        // 最终精度处理（保留2位小数显示）
        itemAwards[itemid].sum = Math.round(itemAwards[itemid].sum * 100) / 100;
    });

    // 立即返回所有格式错误
    if (errorMessages.length > 0) {
        MessageToast.show(errorMessages.join("\n"));
        return;
    }

    // 检查总和有效性
    Object.keys(itemAwards).forEach(itemid => {
        var total = itemAwards[itemid].sum;
        if (total !== 0 && total !== 100) {
            errorMessages.push(
                that.getResourceBundleText("awardSumError", [
                    String(itemid),
                    String(itemAwards[itemid].name),
                    total.toFixed(2)
                ])
            );
        }
    });

    // 返回所有逻辑错误
    if (errorMessages.length > 0) {
        MessageToast.show(errorMessages.join("\n"));
        return;
    }

    // 第二次循环：收集修改记录（增强字段类型转换）
    aData.forEach(function(oRow) {
        var Internalid = oRow.Internalid || oRow.internalid || "";
        var Itemid = oRow.Itemid || oRow.itemid || oRow.ItemId || "";
        
        suppliners.forEach(s => {
            var supplier = oRow[s + "-Supplier"];
            if (!supplier) return;

            // 安全获取字段值
            var Award = parseFloat(oRow[s + "-Award"]) || 0;
            var Award_Old = parseFloat(oRow[s + "-Award_Old"]) || 0;
            var Specification = String(oRow[s + "-Specification"] || "");
            var Specification_Old = String(oRow[s + "-Specification_Old"] || "");

            // 检测变更（考虑数值精度）
            var isAwardChanged = Math.abs(Award - Award_Old) > 0.0001;
            var isSpecChanged = Specification !== Specification_Old;
            
            if (isAwardChanged || isSpecChanged) {
                zrfpItemPriceChanged.push({
                    Internalid: Internalid,
                    Itemid: Itemid,
                    Supplier: supplier,
                    Specification: Specification,
                    Award: Award.toFixed(4) // 保持4位小数精度
                });
            }
        });
    });

    // 执行保存（增强错误处理）
    if (zrfpItemPriceChanged.length > 0) {
        oRfpModel.setUseBatch(true);
        
        zrfpItemPriceChanged.forEach(row => {
            var sPath = `/zrfp_item_priceSet(Internalid='${row.Internalid}',Itemid='${row.Itemid}',Supplier='${row.Supplier}')`;
            oRfpModel.update(sPath, {
                Specification: row.Specification,
                Award: parseFloat(row.Award)
            }, {
                groupId: "saveGroup",
                success: function() {
                    MessageToast.show(that.getResourceBundleText("updateSuccessful"));
                },
                error: function(oError) {
                    var errorMsg = that.getResourceBundleText("updateFailed", [
                        row.Supplier,
                        row.Itemid || "N/A",
                        oError.message || "Unknown error"
                    ]);
                    console.error(`Update failed for ${sPath}:`, oError);
                    MessageToast.show(errorMsg);
                }
            });
        });
        
        oRfpModel.submitChanges();
    } else {
        MessageToast.show(that.getResourceBundleText("noChangesDetected"));
    }
},
        onSendPress: function () {
            const that = this;
            return new Promise((resolve, reject) => {
              
                var oRfpDetail = this.getView().getModel("rfpDetail").getData();
                var sInternalid = oRfpDetail.Internalid; // 例如 "Doc152422851"  
                var sPath = "/zrfpSet(Internalid='" + sInternalid + "')";
                var oData = {
                    Internalid: sInternalid, 
                };
             
                var oParameters = {
                    success: function (oResponse) {
                        console.log("更新成功：", sInternalid);
                        MessageToast.show(that.getResourceBundleText("sendStatusSuccessful"));
                        resolve(oResponse);
                    },
                    error: function (oError) {
                        console.error("更新失败:", oError);
                        reject({
                            code: oError.statusCode,
                            message: oError.message || "未知错误"
                        });
                    },
                    headers: {
                        "Content-Type": "application/json"
                    },
                    // 可选：指定 MERGE 或 PUT 方法（默认是 MERGE）
                    method: "PUT",
                    batchGroupId: null // 禁用批处理
                };
               
                this.getRfpModel().update(sPath, oData, oParameters);
            });
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
            if( Internalid ){
                var sPath = "/sap/opu/odata/SAP/ZUI5SRVRFP_SRV/fileSet('"+Internalid+"')/$value";
                //this.downloadFileFromOData(sPath, "file.xlsx");
                window.open(sPath);
            }else{
                MessageToast.show(this.getResourceBundleText("downloadFailedNoInternalid"));
            }
        },
        // Controller.js

    });
});