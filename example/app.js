angular.module('ExampleApp', ['hj.cropify']);

var ExampleCtrl = function($scope) {
    var ctrl = this;

    ctrl.coords = {
        "left": 0.29,
        "top": 0.398,
        "right": 0.867,
        "bottom": 0.835,
        "height": 0.437,
        "width": 0.577
    };

    $scope.$watch(function() {
        return ctrl.coords;
    }, function(n) {
        console.log(n);
    });

    ctrl.setCrop = function() {
        ctrl.coords = {
            "left": 0.29,
            "top": 0.398,
            "right": 0.867,
            "bottom": 0.835,
            "height": 0.437,
            "width": 0.577
        };
    };
};

angular.module('ExampleApp').controller('ExampleCtrl', ExampleCtrl);
