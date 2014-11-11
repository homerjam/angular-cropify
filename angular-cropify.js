(function() {
    'use strict';

    angular.module('hj.cropify', []).directive('hjCropify', ['$rootScope', '$document', '$timeout',
        function($rootScope, $document, $timeout) {
            return {
                restrict: 'EA',
                transclude: true,
                scope: {
                    coords: '=',
                    options: '&'
                },
                template: function($element, $attrs) {
                    var options = {
                        display: 'block'
                    };

                    if ($attrs.hjCropifyOptions !== undefined) {
                        angular.extend(options, $rootScope.$eval($attrs.hjCropifyOptions));
                    }

                    var html = '<div class="hj-cropify" style="position: relative">';

                    html += '<div class="hj-cropify-container" style="display: ' + options.display + '; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;" ng-transclude></div>';

                    html += '<div ng-show="ctrl.show.selection">' +
                        '<div ng-style="ctrl.getStyleLeft()"></div>' +
                        '<div ng-style="ctrl.getStyleRight()"></div>' +
                        '<div ng-style="ctrl.getStyleTop()"></div>' +
                        '<div ng-style="ctrl.getStyleBottom()"></div>' +
                        '</div>';

                    html += "</div>";

                    return html;
                },
                link: {
                    pre: function($scope, $element, $attrs) {
                        var options = {
                            id: "hjCropify" + (+new Date()),
                            aspectRatio: 0,
                            selectBuffer: 50
                        };

                        if ($attrs.hjCropifyOptions !== undefined) {
                            angular.extend(options, $rootScope.$eval($attrs.hjCropifyOptions));
                        }

                        $scope.options = options;
                    }
                },
                controllerAs: 'ctrl',
                controller: function($scope, $element, $attrs) {
                    var ctrl = this,
                        options;

                    var selectionStyle = {
                        'position': 'absolute',
                        'background-color': 'black',
                        'opacity': 0.5,
                        'z-index': 999,
                        '-webkit-user-select': 'none',
                        '-moz-user-select': 'none',
                        '-ms-user-select': 'none',
                        'user-select': 'none'
                    };

                    ctrl.getStyleLeft = function() {
                        return angular.extend({
                            top: ctrl.coordsTemp.el.top - ctrl.offsets.el.top + 'px',
                            left: ctrl.coordsTemp.el.left - ctrl.offsets.el.left + 'px',
                            height: ctrl.coordsTemp.el.bottom - ctrl.coordsTemp.el.top + 'px',
                            width: ctrl.coordsTemp.select.left - ctrl.coordsTemp.el.left + 'px'
                        }, selectionStyle);
                    };

                    ctrl.getStyleRight = function() {
                        return angular.extend({
                            top: ctrl.coordsTemp.el.top - ctrl.offsets.el.top + 'px',
                            left: ctrl.coordsTemp.select.right - ctrl.offsets.el.left + 'px',
                            height: ctrl.coordsTemp.el.bottom - ctrl.coordsTemp.el.top + 'px',
                            width: ctrl.coordsTemp.el.right - ctrl.coordsTemp.select.right + 'px'
                        }, selectionStyle);
                    };

                    ctrl.getStyleTop = function() {
                        return angular.extend({
                            top: ctrl.coordsTemp.el.top - ctrl.offsets.el.top + 'px',
                            left: ctrl.coordsTemp.select.left - ctrl.offsets.el.left + 'px',
                            height: ctrl.coordsTemp.select.top - ctrl.coordsTemp.el.top + 'px',
                            width: ctrl.coordsTemp.select.right - ctrl.coordsTemp.select.left + 'px',
                        }, selectionStyle);
                    };

                    ctrl.getStyleBottom = function() {
                        return angular.extend({
                            top: ctrl.coordsTemp.select.bottom - ctrl.offsets.el.top + 'px',
                            left: ctrl.coordsTemp.select.left - ctrl.offsets.el.left + 'px',
                            height: ctrl.coordsTemp.el.bottom - ctrl.coordsTemp.select.bottom + 'px',
                            width: ctrl.coordsTemp.select.right - ctrl.coordsTemp.select.left + 'px'
                        }, selectionStyle);
                    };

                    var container = angular.element($element[0].querySelector('.hj-cropify-container'));

                    /**
            @property ctrl.offsets Holds the relative offset of this directive / the element (for position absolute to work with the coordinates properly)
            @type Object
            */
                    ctrl.offsets = {
                        el: {
                            top: 0,
                            left: 0
                        }
                    };

                    /**
            @property ctrl.show For use with ng-show/ng-hide
            @type Object
            */
                    ctrl.show = {
                        selection: true
                    };

                    /**
            @property ctrl.state Triggers for tracking when mouse/touch is started and ended
            @type Object
            */
                    ctrl.state = {
                        started: false,
                        ended: false
                    };

                    /**
            @property ctrl.coordsTemp Internal coordinates used for the calculations
            @type Object
            */
                    ctrl.coordsTemp = {
                        start: {
                            x: 0,
                            y: 0
                        },
                        end: {
                            x: 0,
                            y: 0
                        },
                        //raw coords - without ctrl.offsets.el subtracted
                        el: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        //raw coords - without ctrl.offsets.el subtracted
                        select: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        }
                    };

                    /**
            @property ctrl.coords The passed in (and set) coordinates to use outside this directive. They are all 0 offset so you'll get the dimensions of the element itself and then the dimensions of the selected area inside of that.
            @type Object
            */
                    ctrl.coords = {
                        el: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            height: 0,
                            width: 0
                        },
                        select: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            height: 0,
                            width: 0
                        }
                    };

                    $document.on('mousedown', function(e) {
                        start(e);
                        scopeApply();
                    });
                    $document.on('touchstart', function(e) {
                        start(e);
                        scopeApply();
                    });

                    // container.on('mouseup', function(e) {
                    $document.on('mouseup', function(e) {
                        end(e);
                        scopeApply();
                    });
                    // container.on('touchend', function(e) {
                    $document.on('touchend', function(e) {
                        end(e, {});
                        scopeApply();
                    });

                    $document.on('mousemove', function(e) {
                        move(e);
                        scopeApply();
                    });
                    $document.on('touchmove', function(e) {
                        move(e);
                        scopeApply();
                    });

                    var init = function() {
                        getElCoords();

                        ctrl.show.selection = true;
                    };

                    var start = function(e) {
                        var xx = e.pageX;
                        var yy = e.pageY;

                        // if(xx >= ctrl.coordsTemp.el.left && xx <= ctrl.coordsTemp.el.right && yy >= ctrl.coordsTemp.el.top && yy <= ctrl.coordsTemp.el.bottom) {

                        if (xx >= ctrl.coordsTemp.el.left - options.selectBuffer && xx <= ctrl.coordsTemp.el.right + options.selectBuffer && yy >= ctrl.coordsTemp.el.top - options.selectBuffer && yy <= ctrl.coordsTemp.el.bottom + options.selectBuffer) { //only start if within a certain distance of the element itself (i.e. don't reset if doing something else but DO want a little buffer to allow for selecting from an edge and getting it all)

                            if (xx < ctrl.coordsTemp.el.left) {
                                xx = ctrl.coordsTemp.el.left;
                            } else if (xx > ctrl.coordsTemp.el.right) {
                                xx = ctrl.coordsTemp.el.right;
                            }
                            if (yy < ctrl.coordsTemp.el.top) {
                                yy = ctrl.coordsTemp.el.top;
                            } else if (yy > ctrl.coordsTemp.el.bottom) {
                                yy = ctrl.coordsTemp.el.bottom;
                            }

                            ctrl.coordsTemp.start.x = xx;
                            ctrl.coordsTemp.start.y = yy;
                            ctrl.state.started = true;
                        }

                        ctrl.state.ended = false;
                    };

                    var end = function(e) {
                        move(e);

                        if (ctrl.state.started) {
                            calculateSelectArea();

                            ctrl.state.ended = true;
                        }

                        ctrl.state.started = false;
                    };

                    var move = function(e) {
                        if (ctrl.state.started) {
                            var xx = e.pageX;
                            var yy = e.pageY;

                            //don't allow to be outside the element itself
                            if (xx > ctrl.coordsTemp.el.right) {
                                xx = ctrl.coordsTemp.el.right;
                            } else if (xx < ctrl.coordsTemp.el.left) {
                                xx = ctrl.coordsTemp.el.left;
                            }
                            if (yy > ctrl.coordsTemp.el.bottom) {
                                yy = ctrl.coordsTemp.el.bottom;
                            } else if (yy < ctrl.coordsTemp.el.top) {
                                yy = ctrl.coordsTemp.el.top;
                            }

                            ctrl.coordsTemp.end.x = xx;
                            ctrl.coordsTemp.end.y = yy;

                            var selectTemp = {};

                            //calculate the select area top, left, right, bottom (if end is less than start, reverse them)
                            //end more left than start
                            if (ctrl.coordsTemp.end.x < ctrl.coordsTemp.start.x) {
                                selectTemp.left = ctrl.coordsTemp.end.x;
                                selectTemp.right = ctrl.coordsTemp.start.x;
                            } else { //start same or more left than end
                                selectTemp.left = ctrl.coordsTemp.start.x;
                                selectTemp.right = ctrl.coordsTemp.end.x;
                            }
                            //end higher than start
                            if (ctrl.coordsTemp.end.y < ctrl.coordsTemp.start.y) {
                                selectTemp.top = ctrl.coordsTemp.end.y;
                                selectTemp.bottom = ctrl.coordsTemp.start.y;
                            } else { //start same or higher than end
                                selectTemp.top = ctrl.coordsTemp.start.y;
                                selectTemp.bottom = ctrl.coordsTemp.end.y;
                            }

                            //if aspect ratio set, enforce proportions by making the part that is too large be smaller (i.e. always SHRINK, rather than grow). Shrink because this ensures don't run into issues where to make it fit the ratio, would have to go outside the element and thus would have to do handle these more complicated edge cases.
                            if (options.aspectRatio > 0) {
                                var curWidth = selectTemp.right - selectTemp.left;
                                var curHeight = selectTemp.bottom - selectTemp.top;
                                var curRatio = curWidth / curHeight;

                                //too wide, shrink width
                                if (curRatio > options.aspectRatio) {
                                    //end more left than start
                                    if (ctrl.coordsTemp.end.x < ctrl.coordsTemp.start.x) {
                                        //were ending on the left, so alter the left
                                        selectTemp.left = selectTemp.right - (curHeight * options.aspectRatio);
                                    } else { //start same or more left than end
                                        //were ending on right, alter the right
                                        selectTemp.right = selectTemp.left + (curHeight * options.aspectRatio);
                                    }
                                }

                                //too tall, shrink height
                                else {
                                    //end higher than start
                                    if (ctrl.coordsTemp.end.y < ctrl.coordsTemp.start.y) {
                                        //were ending on the top, so alter top
                                        selectTemp.top = selectTemp.bottom - (curWidth / options.aspectRatio);
                                    } else { //start same or higher than end
                                        //were ending on the bottom, so alter bottom
                                        selectTemp.bottom = selectTemp.top + (curWidth / options.aspectRatio);
                                    }
                                }
                            }

                            ctrl.coordsTemp.select.top = selectTemp.top;
                            ctrl.coordsTemp.select.left = selectTemp.left;
                            ctrl.coordsTemp.select.bottom = selectTemp.bottom;
                            ctrl.coordsTemp.select.right = selectTemp.right;

                            calculateSelectArea();
                        }
                    };

                    var scopeApply = function() {
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };

                    var calculateSelectArea = function() {
                        ctrl.coords.select = {
                            left: ctrl.coordsTemp.select.left - ctrl.offsets.el.left,
                            top: ctrl.coordsTemp.select.top - ctrl.offsets.el.top,
                            right: ctrl.coordsTemp.select.right - ctrl.offsets.el.left,
                            bottom: ctrl.coordsTemp.select.bottom - ctrl.offsets.el.top,
                            height: ctrl.coordsTemp.select.bottom - ctrl.coordsTemp.select.top,
                            width: ctrl.coordsTemp.select.right - ctrl.coordsTemp.select.left
                        };

                        if (ctrl.coords.select.width === 0 && ctrl.coords.select.height === 0) {
                            ctrl.show.selection = false;
                        } else {
                            ctrl.show.selection = true;
                        }

                        $scope.coords = ctrl.coords.select;
                    };

                    var getElCoords = function() {
                        var rect1 = container[0].getBoundingClientRect(); //gives correct height & width sometimes negative/wrong left/top/right/bottom!
                        var el = container[0];
                        var _x = 0;
                        var _y = 0;

                        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
                            // _x += el.offsetLeft - el.scrollLeft;
                            // _y += el.offsetTop - el.scrollTop;
                            //do NOT subtract scroll? creates issues on webkit/chrome if scrolled down
                            _x += el.offsetLeft;
                            _y += el.offsetTop;
                            el = el.offsetParent;
                        }

                        var rect = {
                            left: _x,
                            right: _x + rect1.width,
                            top: _y,
                            bottom: _y + rect1.height
                        };

                        ctrl.coordsTemp.el = {
                            left: rect.left,
                            right: rect.right,
                            top: rect.top,
                            bottom: rect.bottom
                        };

                        ctrl.offsets.el = {
                            top: rect.top,
                            left: rect.left
                        };

                        //set select coords to have it all selected at first
                        ctrl.coordsTemp.select = {
                            left: rect.left,
                            right: rect.right,
                            top: rect.top,
                            bottom: rect.bottom
                        };

                        ctrl.coords.el = {
                            left: 0,
                            top: 0,
                            right: rect.right - rect.left,
                            bottom: rect.bottom - rect.top,
                            height: rect.bottom - rect.top,
                            width: rect.right - rect.left
                        };
                    };

                    $scope.$on('hjCropify:forceInit', function(e, params) {
                        if (params.id == options.id) {
                            init({});
                        }
                    });

                    $scope.$on('hjCropify:hide', function(e, params) {
                        if (params.id == options.id) {
                            ctrl.show.selection = false;
                        }
                    });

                    $timeout(function() {
                        options = $scope.options;

                        init();
                    });
                }
            };
        }
    ]);

})();
