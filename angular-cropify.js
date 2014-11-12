(function() {
    'use strict';

    angular.module('hj.cropify', []).directive('hjCropify', ['$window', '$document', '$timeout',
        function($window, $document, $timeout) {
            return {
                restrict: 'EA',
                transclude: true,
                scope: {
                    coords: '=',
                    aspectRatio: '=',
                    options: '&'
                },
                template: function() {
                    var html = '<div class="hj-cropify" style="position: relative; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;">' +
                        '<div class="hj-cropify-container" style="display: inline-block;" ng-transclude></div>' +
                        '<div class="hj-cropify-selection" ng-show="ctrl.show.selection">' +
                        '<div class="hj-cropify-crop" ng-style="ctrl.getStyleCrop()"></div>' +
                        '<div class="hj-cropify-shade" ng-style="ctrl.getStyleLeft()"></div>' +
                        '<div class="hj-cropify-shade" ng-style="ctrl.getStyleRight()"></div>' +
                        '<div class="hj-cropify-shade" ng-style="ctrl.getStyleTop()"></div>' +
                        '<div class="hj-cropify-shade" ng-style="ctrl.getStyleBottom()"></div>' +
                        '</div>' +
                        '</div>';

                    return html;
                },
                controllerAs: 'ctrl',
                controller: ['$scope', '$element', '$attrs', function($scope, $element, $attrs) {
                    var ctrl = this;

                    var options = {
                        id: "hjCropify" + (+new Date()),
                        precision: 3,
                        selectBuffer: 10,
                        selectionStyle: {
                            'position': 'absolute',
                            'background-color': 'black',
                            'opacity': 0.5,
                            'z-index': 999,
                            'pointer-events': 'none',
                            '-webkit-user-select': 'none',
                            '-moz-user-select': 'none',
                            '-ms-user-select': 'none',
                            'user-select': 'none'
                        }
                    };

                    ctrl.getStyleLeft = function() {
                        return angular.extend({
                            top: _coords.el.top - ctrl.offsets.el.top + 'px',
                            left: _coords.el.left - ctrl.offsets.el.left + 'px',
                            height: _coords.el.bottom - _coords.el.top + 'px',
                            width: _coords.select.left - _coords.el.left + 'px'
                        }, options.selectionStyle);
                    };

                    ctrl.getStyleRight = function() {
                        return angular.extend({
                            top: _coords.el.top - ctrl.offsets.el.top + 'px',
                            left: _coords.select.right - ctrl.offsets.el.left + 'px',
                            height: _coords.el.bottom - _coords.el.top + 'px',
                            width: _coords.el.right - _coords.select.right + 'px'
                        }, options.selectionStyle);
                    };

                    ctrl.getStyleTop = function() {
                        return angular.extend({
                            top: _coords.el.top - ctrl.offsets.el.top + 'px',
                            left: _coords.select.left - ctrl.offsets.el.left + 'px',
                            height: _coords.select.top - _coords.el.top + 'px',
                            width: _coords.select.right - _coords.select.left + 'px',
                        }, options.selectionStyle);
                    };

                    ctrl.getStyleBottom = function() {
                        return angular.extend({
                            top: _coords.select.bottom - ctrl.offsets.el.top + 'px',
                            left: _coords.select.left - ctrl.offsets.el.left + 'px',
                            height: _coords.el.bottom - _coords.select.bottom + 'px',
                            width: _coords.select.right - _coords.select.left + 'px'
                        }, options.selectionStyle);
                    };

                    ctrl.getStyleCrop = function() {
                        return {
                            'position': 'absolute',
                            'z-index': 999,
                            'cursor': 'move',
                            // 'background-color': 'rgba(128,0,0,0.5)',
                            'border': '1px dashed rgba(255,255,255,0.5)',
                            top: ctrl.coords.el.height * ctrl.coords.select.top + 'px',
                            left: ctrl.coords.el.width * ctrl.coords.select.left + 'px',
                            width: ctrl.coords.el.width * ctrl.coords.select.width + 'px',
                            height: ctrl.coords.el.height * ctrl.coords.select.height + 'px'
                        };
                    };

                    var container = angular.element($element[0].querySelector('.hj-cropify-container')),
                        crop = angular.element($element[0].querySelector('.hj-cropify-crop'));

                    /**
                    @property ctrl.offsets Holds the relative offset of this directive / the element (for position absolute to work with the coordinates properly)
                    @type Object
                    */
                    ctrl.offsets = {
                        el: {
                            top: 0,
                            left: 0
                        },
                        crop: {
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
                        cropping: false,
                        dragging: false
                    };

                    /**
                    @property _coords Internal coordinates used for the calculations
                    @type Object
                    */
                    var _coords = {
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
                            bottom: 0,
                            width: 0,
                            height: 0
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

                    crop.on('mousedown touchstart', function(e) {
                        e.stopPropagation();

                        dragStart(e);

                        scopeApply();
                    });

                    crop.on('mousemove touchmove', function(e) {
                        e.stopPropagation();

                        dragMove(e);

                        scopeApply();
                    });

                    $document.on('mousedown touchstart', function(e) {
                        cropStart(e);

                        scopeApply();
                    });

                    container.on('mousemove touchmove', function(e) {
                        cropMove(e);

                        scopeApply();
                    });

                    $document.on('mouseup touchend', function(e) {
                        end(e);

                        scopeApply();
                    });

                    var resizeEvent = 'onorientationchange' in $window ? 'orientationchange' : 'resize';

                    angular.element($window).on(resizeEvent, function() {
                        setCoords();

                        setSelect();

                        scopeApply();
                    });

                    $scope.$watch('coords', function(n) {
                        if (n === undefined) {
                            return;
                        }

                        setCoords();

                        ctrl.coords.select = n;

                        setSelect();
                    });

                    var setSelect = function() {
                        _coords.select = {
                            top: (ctrl.coords.select.top * ctrl.coords.el.height) + ctrl.offsets.el.top,
                            bottom: (ctrl.coords.select.bottom * ctrl.coords.el.height) + ctrl.offsets.el.top,
                            left: (ctrl.coords.select.left * ctrl.coords.el.width) + ctrl.offsets.el.left,
                            right: (ctrl.coords.select.right * ctrl.coords.el.width) + ctrl.offsets.el.left
                        };

                        _coords.select.width = _coords.select.right - _coords.select.left;
                        _coords.select.height = _coords.select.bottom - _coords.select.top;

                        calculateSelectArea();
                    };

                    var init = function() {
                        if ($attrs.hjCropifyOptions !== undefined) {
                            angular.extend(options, $scope.$eval($attrs.hjCropifyOptions));
                        }

                        setCoords($scope.coords || {});

                        calculateSelectArea(true);
                    };

                    var end = function(e) {
                        cropMove(e);

                        if (ctrl.state.cropping || ctrl.state.dragging) {
                            calculateSelectArea(true);
                        }

                        ctrl.state.cropping = false;
                        ctrl.state.dragging = false;
                    };

                    var cropStart = function(e) {
                        var xx = e.pageX;
                        var yy = e.pageY;

                        //only start if within a certain distance of the element itself (i.e. don't reset if doing something else but DO want a little buffer to allow for selecting from an edge and getting it all)
                        if (xx >= _coords.el.left - options.selectBuffer && xx <= _coords.el.right + options.selectBuffer && yy >= _coords.el.top - options.selectBuffer && yy <= _coords.el.bottom + options.selectBuffer) {

                            if (xx < _coords.el.left) {
                                xx = _coords.el.left;
                            } else if (xx > _coords.el.right) {
                                xx = _coords.el.right;
                            }
                            if (yy < _coords.el.top) {
                                yy = _coords.el.top;
                            } else if (yy > _coords.el.bottom) {
                                yy = _coords.el.bottom;
                            }

                            _coords.start.x = xx;
                            _coords.start.y = yy;

                            ctrl.state.cropping = true;
                        }
                    };

                    var cropMove = function(e) {
                        if (!ctrl.state.cropping) {
                            return;
                        }

                        var xx = e.pageX;
                        var yy = e.pageY;

                        //don't allow to be outside the element itself
                        if (xx > _coords.el.right) {
                            xx = _coords.el.right;
                        } else if (xx < _coords.el.left) {
                            xx = _coords.el.left;
                        }
                        if (yy > _coords.el.bottom) {
                            yy = _coords.el.bottom;
                        } else if (yy < _coords.el.top) {
                            yy = _coords.el.top;
                        }

                        _coords.end.x = xx;
                        _coords.end.y = yy;

                        var selectTemp = {};

                        //calculate the select area top, left, right, bottom (if end is less than start, reverse them)
                        //end more left than start
                        if (_coords.end.x < _coords.start.x) {
                            selectTemp.left = _coords.end.x;
                            selectTemp.right = _coords.start.x;
                        } else { //start same or more left than end
                            selectTemp.left = _coords.start.x;
                            selectTemp.right = _coords.end.x;
                        }
                        //end higher than start
                        if (_coords.end.y < _coords.start.y) {
                            selectTemp.top = _coords.end.y;
                            selectTemp.bottom = _coords.start.y;
                        } else { //start same or higher than end
                            selectTemp.top = _coords.start.y;
                            selectTemp.bottom = _coords.end.y;
                        }

                        //if aspect ratio set, enforce proportions by making the part that is too large be smaller
                        if ($scope.aspectRatio > 0) {
                            var curWidth = selectTemp.right - selectTemp.left;
                            var curHeight = selectTemp.bottom - selectTemp.top;
                            var curRatio = curWidth / curHeight;

                            //too wide, shrink width
                            if (curRatio > $scope.aspectRatio) {
                                //end more left than start
                                if (_coords.end.x < _coords.start.x) {
                                    //we're ending on the left, so alter the left
                                    selectTemp.left = selectTemp.right - (curHeight * $scope.aspectRatio);
                                } else { //start same or more left than end
                                    //we're ending on right, alter the right
                                    selectTemp.right = selectTemp.left + (curHeight * $scope.aspectRatio);
                                }
                            }
                            //too tall, shrink height
                            else {
                                //end higher than start
                                if (_coords.end.y < _coords.start.y) {
                                    //we're ending on the top, so alter top
                                    selectTemp.top = selectTemp.bottom - (curWidth / $scope.aspectRatio);
                                } else { //start same or higher than end
                                    //we're ending on the bottom, so alter bottom
                                    selectTemp.bottom = selectTemp.top + (curWidth / $scope.aspectRatio);
                                }
                            }
                        }

                        _coords.select = {
                            top: selectTemp.top,
                            left: selectTemp.left,
                            bottom: selectTemp.bottom,
                            right: selectTemp.right
                        };

                        _coords.select.width = selectTemp.right - selectTemp.left;
                        _coords.select.height = selectTemp.bottom - selectTemp.top;

                        calculateSelectArea();
                    };

                    var dragStart = function(e) {
                        ctrl.state.dragging = true;

                        ctrl.offsets.crop.left = e.offsetX;
                        ctrl.offsets.crop.top = e.offsetY;
                    };

                    var dragMove = function(e) {
                        if (!ctrl.state.dragging) {
                            return;
                        }

                        var maxX = (ctrl.offsets.el.left + ctrl.coords.el.width) - _coords.select.width,
                            minX = ctrl.offsets.el.left;

                        var maxY = (ctrl.offsets.el.top + ctrl.coords.el.height) - _coords.select.height,
                            minY = ctrl.offsets.el.top;

                        var xx = e.pageX - ctrl.offsets.crop.left;
                        var yy = e.pageY - ctrl.offsets.crop.top;

                        xx = Math.min(xx, maxX);
                        xx = Math.max(xx, minX);
                        yy = Math.min(yy, maxY);
                        yy = Math.max(yy, minY);

                        _coords.select.top = yy;
                        _coords.select.left = xx;
                        _coords.select.bottom = yy + _coords.select.height;
                        _coords.select.right = xx + _coords.select.width;

                        calculateSelectArea();
                    };

                    var scopeApply = function() {
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };

                    var calculateSelectArea = function(update) {
                        update = update || false;

                        ctrl.coords.select = {
                            left: Number(((_coords.select.left - ctrl.offsets.el.left) / ctrl.coords.el.width).toFixed(options.precision)),
                            top: Number(((_coords.select.top - ctrl.offsets.el.top) / ctrl.coords.el.height).toFixed(options.precision)),
                            right: Number(((_coords.select.right - ctrl.offsets.el.left) / ctrl.coords.el.width).toFixed(options.precision)),
                            bottom: Number(((_coords.select.bottom - ctrl.offsets.el.top) / ctrl.coords.el.height).toFixed(options.precision)),
                            height: Number(((_coords.select.bottom - _coords.select.top) / ctrl.coords.el.height).toFixed(options.precision)),
                            width: Number(((_coords.select.right - _coords.select.left) / ctrl.coords.el.width).toFixed(options.precision))
                        };

                        if (ctrl.coords.select.width === 0 && ctrl.coords.select.height === 0) {
                            ctrl.show.selection = false;
                        } else {
                            ctrl.show.selection = true;
                        }

                        if (update) {
                            $scope.coords = ctrl.coords.select;
                        }
                    };

                    var setCoords = function(coords) {
                        coords = coords || {};

                        var _rect = container[0].getBoundingClientRect(), //gives correct height & width sometimes negative/wrong left/top/right/bottom!
                            el = $element[0].parentElement === $document[0].body ? $element[0] : $element[0].parentElement,
                            _x = 0, _y = 0;

                        while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) && !isNaN(el.scrollLeft) && !isNaN(el.scrollTop)) {
                            _x += el.offsetLeft + el.scrollLeft;
                            _y += el.offsetTop + el.scrollTop;
                            el = el.parentElement;
                        }

                        var rect = {
                            left: _x,
                            right: _x + _rect.width,
                            top: _y,
                            bottom: _y + _rect.height
                        };

                        _coords.el = {
                            left: rect.left,
                            right: rect.right,
                            top: rect.top,
                            bottom: rect.bottom
                        };

                        ctrl.offsets.el = {
                            top: rect.top,
                            left: rect.left
                        };

                        ctrl.coords.el = {
                            left: 0,
                            top: 0,
                            right: rect.right - rect.left,
                            bottom: rect.bottom - rect.top,
                            height: rect.bottom - rect.top,
                            width: rect.right - rect.left
                        };

                        if (Object.keys(coords).length === 0) {
                            _coords.select = {
                                left: rect.left,
                                right: rect.left,
                                top: rect.top,
                                bottom: rect.top,
                                width: 0,
                                height: 0
                            };

                        } else {
                            _coords.select = {
                                left: (ctrl.coords.el.width * coords.left) + ctrl.offsets.el.left,
                                right: (ctrl.coords.el.width * coords.right) + ctrl.offsets.el.left,
                                top: (ctrl.coords.el.height * coords.top) + ctrl.offsets.el.top,
                                bottom: (ctrl.coords.el.height * coords.bottom) + ctrl.offsets.el.top,
                                width: ctrl.coords.el.width * coords.width,
                                height: ctrl.coords.el.height * coords.height
                            };
                        }
                    };

                    $scope.$on('hjCropify:init', function(e, params) {
                        if (params) {
                            if (params.id && params.id !== options.id) {
                                return false;
                            }
                        }

                        init();
                    });

                    $scope.$on('hjCropify:toggleSelection', function(e, params) {
                        if (params) {
                            if (params.id && params.id !== options.id) {
                                return false;
                            }
                        }

                        ctrl.show.selection = !ctrl.show.selection;
                    });

                    $scope.$on('hjCropify:showSelection', function(e, params) {
                        if (params) {
                            if (params.id && params.id !== options.id) {
                                return false;
                            }
                        }

                        ctrl.show.selection = true;
                    });

                    $scope.$on('hjCropify:hideSelection', function(e, params) {
                        if (params) {
                            if (params.id && params.id !== options.id) {
                                return false;
                            }
                        }

                        ctrl.show.selection = false;
                    });

                    $timeout(init);

                }]
            };
        }
    ]);
})();
