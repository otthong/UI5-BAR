sap.ui.define([
    "./BaseController",
    "sap/ui/model/odata/v2/ODataModel", // 只需要ODataModel
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "../model/formatter",
    "sap/ui/core/format/DateFormat",
    "sap/m/MessageToast"
], function (BaseController, ODataModel, Filter, FilterOperator, formatter, DateFormat, MessageToast) {
    "use strict";

    return BaseController.extend("ods4.controller.Master", {
        onInit: function () {
            // 创建ODataModel实例
            var sServiceUrl = "http://localhost:8080/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/"; 
            var oModel = new ODataModel(sServiceUrl, {
                ignoreSSLErrors: true, // 忽略SSL证书错误
                maxAge: 0
            });
            
            this.getView().setModel(oModel); 

            // 检查OData服务是否正常
            oModel.read("/A_PurchaseOrder/$metadata", {
                success: function (oData) {
                    console.log("OData服务正常，元数据获取成功");
                },
                error: function (oError) {
                    console.error("OData服务请求失败", oError);
                    MessageToast.show("OData服务请求失败: " + oError.message);
                }
            });

            // 注册路由匹配事件
            var oRouter = this.getRouter();
            if (oRouter) {
                var oRoute = oRouter.getRoute("RouteMaster");
                if (oRoute) {
                    oRoute.attachMatched(this._onMasterMatched, this);
                } else {
                    console.error("Route 'RouteMaster' not found");
                }
            } else {
                console.error("Router未找到");
            }
        },

        _onMasterMatched: function (oEvent) {
            // 处理路由匹配事件的逻辑
            console.log("Route 'RouteMaster' has been matched.");
        },

        onBypassed: function (oEvent) {
            // 处理路由绕过事件的逻辑
            console.log("Route has been bypassed.");
        },

        onNavBack: function () {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("appHome", {}, true);
            }
        },

        // 格式化货币的函数
        formatCurrency: function (value) {
            return sap.ui.model.format.NumberFormat.currency(value, "USD");
        },

        // 搜索事件处理函数
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query"); // 获取搜索框中的值
            this._applyFilterSearch(sQuery);
        },

        // 应用过滤搜索的函数
        _applyFilterSearch: function (sQuery) {
            var oList = this.getView().byId("myTable"); // 获取表格控件
            if (oList) {
                // 创建一个过滤器，按照 PurchaseOrderType 过滤
                var oFilter = new Filter("PurchaseOrderType", FilterOperator.Contains, sQuery);
                oList.getBinding("items").filter(oFilter); // 应用过滤器
            } else {
                console.error("Table控件未找到");
            }
        },

        // 处理数值对比和添加小字的逻辑
        formatRankLabel: function (cashDiscount1Days, cashDiscount2Days) {
            if (cashDiscount1Days < cashDiscount2Days) {
                return 'Rank 1 Lowest';
            } else {
                return '';
            }
        },

        // 处理 Award 复选框的选中逻辑
        onAwardSelect: function (oEvent) {
            var oSource = oEvent.getSource();
            var bSelected = oEvent.getParameter("selected");
            var sPurchaseOrder = oSource.getCustomData()[0].getValue();
        
            var oModel = this.getView().getModel();
            var oContext = oModel.createKey("/A_PurchaseOrder", { PurchaseOrder: sPurchaseOrder });
            var oBindingContext = oModel.getContext(oContext);
        
            if (bSelected) {
                // 如果当前复选框被选中，确保同一行的另一个复选框未被选中
                if (oSource.getId().endsWith("CheckBoxAward1")) {
                    oModel.setProperty("SelectedAward2", false, oBindingContext);
                } else if (oSource.getId().endsWith("CheckBoxAward2")) {
                    oModel.setProperty("SelectedAward1", false, oBindingContext);
                }
            }
        }
    });
});