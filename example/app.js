angular.module('ExampleApp', ['hj.cropify']);

var ExampleCtrl = function($scope) {
    var ctrl = this;

    ctrl.coords = {};

    $scope.$watch(function() {
        return ctrl.coords;
    }, function(n) {
        console.log(n);
    });
};

angular.module('ExampleApp').controller('ExampleCtrl', ExampleCtrl);
