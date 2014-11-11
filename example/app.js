angular.module('ExampleApp', ['hj.cropify']);

var ExampleCtrl = function($scope) {
    var ctrl = this;

    ctrl.coords = {
        bottom: 0.8345710998694076,
        height: 0.4368438271421349,
        left: 0.29,
        right: 0.8666331658291457,
        top: 0.3977272727272727,
        width: 0.5766331658291457
    };

    $scope.$watch(function() {
        return ctrl.coords;
    }, function(n) {
        console.log(n);
    });

    ctrl.reset = function() {
        $scope.$broadcast('hjCropify:reset');
    };

    ctrl.setCrop = function() {
        ctrl.coords = {
            bottom: 0.8345710998694076,
            height: 0.4368438271421349,
            left: 0.29,
            right: 0.8666331658291457,
            top: 0.3977272727272727,
            width: 0.5766331658291457
        };
    };
};

angular.module('ExampleApp').controller('ExampleCtrl', ExampleCtrl);
