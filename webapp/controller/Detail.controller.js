sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Column",
    "sap/m/Text",
    'sap/m/MessageToast'
], function (Controller, Column, Text,MessageToast) {
    "use strict";

    return Controller.extend("ods4.controller.Detail", {
        _onDetailMatched: function(oEvent) {
            // 获取路由参数
            var oParameters = oEvent.getParameter("arguments");
            var Internalid = oParameters.Internalid;
            
            var rfpOModel = this.getOwnerComponent().getModel("rfp")
            rfpOModel.read("/zrfpSet(Internalid='Doc152422851')",{
                success: function (oData) {
                    console.log(oData);
                    MessageToast.show("接收到RFP数据: " + JSON.stringify(oData));
                },
                error: function (oError) {
                    console.error("OData服务请求失败", oError);
                    MessageToast.show("OData服务请求失败: " + oError.message);
                }
            });
        },
        onInit: function () {
            var oView = this.getView();
            var oTable = oView.byId("materialTable");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);

            // // Fetch supplier data (this could be from a model or an API call)

            // // Add dynamic columns based on suppliers
   
        }
    });
});