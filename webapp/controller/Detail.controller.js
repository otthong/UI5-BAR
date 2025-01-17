sap.ui.define([
    "./BaseController",
    "sap/m/Text",
    'sap/m/MessageToast',
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], function (BaseController, Text,MessageToast,Filter,FilterOperator) {
    "use strict";
    var rfpOModel;
    return BaseController.extend("ods4.controller.Detail", {
        _onDetailMatched: function(oEvent) {
            // 获取路由参数
            var oParameters = oEvent.getParameter("arguments");
            var Internalid = oParameters.Internalid;
            var that = this;
            rfpOModel.read("/zrfpSet(Internalid='Doc152422851')",{
                success: function (oData) {
                    console.log(oData);
                    var rfpModel = new sap.ui.model.json.JSONModel(oData);
                    that.getView().setModel(rfpModel,"rfpDetail");
                },
                error: function (oError) {
                    console.error("OData服务请求失败", oError);
                    MessageToast.show("OData服务请求失败: " + oError.message);
                }
            });
            this.genTable(Internalid);
        },
        onInit: function () {
            rfpOModel = this.getOwnerComponent().getModel("rfp")
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
        },
        genTable:function(Internalid){
            // Fetch supplier data (this could be from a model or an API call)
            var oFilter1 = new Filter("Internalid",FilterOperator.EQ,"Doc152422852");
            var that = this;
            var oTable = this.getView().byId("materialTable");
            oTable.destroyColumns();
            rfpOModel.read("/zrfp_item_priceSet", {
                    filters: [oFilter1],
                    success: function (oData) {
                        console.log(oData);
                        // MessageToast.show("接收到RFP数据: " + JSON.stringify(oData));
                        var suppliners = [];
                        oData.results.forEach(row => {
                            if(!suppliners.includes(row.Supplier)){
                                suppliners.push(row.Supplier)
                            }
                        });
                        //Add dynamic columns based on suppliers
                        if(suppliners){
                            that.addTableColumns(oTable,{"Field":"MaterialId","Title":"物料", Width:"8em"});
                            that.addTableColumns(oTable,{"Field":"MaterialDescription","Title":"物料描述", Width:"15em"});
                            that.addTableColumns(oTable,{"Field":"Qty","Title":"数量", Width:"8em"});
                            suppliners.forEach(suppliner =>{
                                that.addTableColumns(oTable,{"Field":suppliner+"-Amount","Title":"Amount","Group":suppliner,"headerSpan":4, Width:"5em"});
                                that.addTableColumns(oTable,{"Field":suppliner+"-Currency","Title":"Currency","Group":suppliner, Width:"3em"});
                                that.addTableColumns(oTable,{"Field":suppliner+"-Specification","Title":"Specification","UIType":"Text","Edit":'true',"Group":suppliner, Width:"15em"});
                                that.addTableColumns(oTable,{"Field":suppliner+"-Award","Title":"Award","UIType":"Text","Edit":'true',"Group":suppliner, Width:"8em"});
                            })

                            //绑定数据
                            var oModel = new sap.ui.model.json.JSONModel({
                                rows: [
                                    { MaterialId: "Value 1", MaterialDescription: "Value A", Qty: "Value X", "S1-Amount": "Value P", "S1-Currency": "Value P" , "S1-Specification": "Value P" , "S1-Award": "Value P", "S2-Amount": "Value P2", "S2-Currency": "Value P2" , "S2-Specification": "Value 2" , "S2-Award": "Value P2" },
                                ]
                            });
                            oTable.setModel(oModel);
                            oTable.bindRows("/rows");
                        }
                    },
                    error: function (oError) {
                        console.error("OData服务请求失败", oError);
                        MessageToast.show("OData服务请求失败: " + oError.message);
                    }
                });
        }
    });
});