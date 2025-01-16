sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
  ], function (BaseController, JSONModel) {
    "use strict";
  
    return BaseController.extend("ods4.controller.Master", {
  
        onInit: function () {
          console.log("View is being initialized");
            var oViewModel = new JSONModel({
                busy: false,
                delay: 1000, // 默认延迟值，单位为毫秒
                layout: "OneColumn",
                previousLayout: "",
                actionBarButtonsInfo: {
                    midColumn: {
                        fullScreen: false
                    }
                }
            });
            this.setModel(oViewModel, "appView");
  
            // 由于视图中没有List控件，我们不再尝试获取List控件的忙碌指示器延迟值
            // 而是直接使用默认值
  
            var fnSetAppNotBusy = function() {
                oViewModel.setProperty("/busy", false);
            };
  
            // since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
           
           
            // apply content density mode to root view
            var oComponent = this.getOwnerComponent();
            if (oComponent && typeof oComponent.getContentDensityClass === "function") {
                this.getView().addStyleClass(oComponent.getContentDensityClass());
            } else {
                // 如果getContentDensityClass方法不存在，添加默认的内容密度类
                this.getView().addStyleClass("sapUiSizeCompact"); // 或者 "sapUiSizeCozy"，取决于你的默认设置
            }
        },
  
        onUpdateFinished: function() {
            // 更新完成后的逻辑
        },
  
        onSelectionChange: function(oEvent) {
            // 选择变更逻辑
        },
  
        onSearch: function(oEvent) {
            // 搜索逻辑
        }
  
    });
  });