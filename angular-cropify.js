(function () {
  'use strict';

  angular.module('hj.cropify', []).directive('hjCropify', function () {
    return {
      restrict: 'EA',
      transclude: true,
      scope: {
        coords: '=',
        aspectRatio: '=',
        options: '=?'
      },
      bindToController: true,
      template: function ($element, $attrs) {
        var containerStyle = $attrs.containerStyle || 'block';

        var html = '<div class="hj-cropify">' +
          '<div class="hj-cropify__container hj-cropify__container--' + containerStyle + '" ng-transclude></div>' +
          '<div class="hj-cropify__selection">' +
          '<div class="hj-cropify__crop"></div>' +
          '<div class="hj-cropify__shade hj-cropify__shade--left"></div>' +
          '<div class="hj-cropify__shade hj-cropify__shade--right"></div>' +
          '<div class="hj-cropify__shade hj-cropify__shade--top"></div>' +
          '<div class="hj-cropify__shade hj-cropify__shade--bottom"></div>' +
          '</div>' +
          '</div>';

        return html;
      },
      controllerAs: 'ctrl',
      controller: ['$scope', '$element', '$attrs', '$window', '$document', '$timeout', function ($scope, $element, $attrs, $window, $document, $timeout) {
        var ctrl = this;

        var options = {
          id: 'hjCropify' + (+new Date()),
          precision: 3,
          selectBuffer: 10,
        };

        options = angular.extend(options, ctrl.options || {});

        var container = angular.element($element[0].querySelector('.hj-cropify__container'));
        var crop = angular.element($element[0].querySelector('.hj-cropify__crop'));
        var selection = angular.element($element[0].querySelector('.hj-cropify__selection'));
        var shadeLeft = angular.element($element[0].querySelector('.hj-cropify__shade--left'));
        var shadeRight = angular.element($element[0].querySelector('.hj-cropify__shade--right'));
        var shadeTop = angular.element($element[0].querySelector('.hj-cropify__shade--top'));
        var shadeBottom = angular.element($element[0].querySelector('.hj-cropify__shade--bottom'));

        var showSelection = true;
        var isCropping = false;
        var isDragging = false;
        var isFixed = false;

        var coords;

        if (!ctrl.coords) {
          coords = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            height: 0,
            width: 0,
          };
        } else {
          coords = ctrl.coords;
        }

        var _coords = {
          start: {
            x: 0,
            y: 0,
          },
          end: {
            x: 0,
            y: 0,
          },
          // raw coords - without elOffsets subtracted
          el: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
          },
          // raw coords - without elOffsets subtracted
          select: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            width: 0,
            height: 0,
          }
        };

        var elOffsets = {
          top: 0,
          left: 0,
        };

        var cropOffsets = {
          top: 0,
          left: 0,
        };

        var elCoords = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          height: 0,
          width: 0,
        };

        var updateUi = function () {
          coords = {
            left: Number(((_coords.select.left - elOffsets.left) / elCoords.width).toFixed(options.precision)),
            top: Number(((_coords.select.top - elOffsets.top) / elCoords.height).toFixed(options.precision)),
            right: Number(((_coords.select.right - elOffsets.left) / elCoords.width).toFixed(options.precision)),
            bottom: Number(((_coords.select.bottom - elOffsets.top) / elCoords.height).toFixed(options.precision)),
            height: Number(((_coords.select.bottom - _coords.select.top) / elCoords.height).toFixed(options.precision)),
            width: Number(((_coords.select.right - _coords.select.left) / elCoords.width).toFixed(options.precision))
          };

          if (coords.width === 0 && coords.height === 0) {
            showSelection = false;
          } else {
            showSelection = true;
          }

          shadeLeft.css({
            top: 0,
            left: 0,
            width: _coords.select.left - _coords.el.left + 'px',
            height: '100%',
          });
          shadeRight.css({
            top: 0,
            right: 0,
            width: _coords.el.right - _coords.select.right + 'px',
            height: '100%',
          });
          shadeTop.css({
            top: 0,
            left: _coords.select.left - _coords.el.left + 'px',
            width: _coords.select.right - _coords.select.left + 'px',
            height: _coords.select.top - _coords.el.top + 'px',
          });
          shadeBottom.css({
            bottom: 0,
            left: _coords.select.left - _coords.el.left + 'px',
            width: _coords.select.right - _coords.select.left + 'px',
            height: _coords.el.bottom - _coords.select.bottom + 'px',
          });

          crop.css({
            top: elCoords.height * coords.top + 'px',
            left: elCoords.width * coords.left + 'px',
            width: elCoords.width * coords.width + 'px',
            height: elCoords.height * coords.height + 'px',
          });

          if (showSelection) {
            selection.css('display', 'block');
          } else {
            selection.css('display', 'none');
          }
        };

        var findPos = function (obj) {
          var obj2 = obj;
          var x = 0;
          var y = 0;

          while ((obj && obj.offsetParent) || (obj && obj.parentNode)) {
            var style = $window.getComputedStyle(obj);

            if (style.position === 'fixed') {
              x += parseInt(style.left, 10) + $document[0].body.scrollLeft;
              y += parseInt(style.top, 10) + $document[0].body.scrollTop;
            } else {
              x += obj.offsetLeft - obj.scrollLeft;
              y += obj.offsetTop - obj.scrollTop;
            }

            obj = obj.offsetParent;
            obj2 = obj2.parentNode;

            while (obj2 !== obj && style.position !== 'fixed') {
              x -= !isNaN(obj2.scrollLeft) ? obj2.scrollLeft : 0;
              y -= !isNaN(obj2.scrollTop) ? obj2.scrollTop : 0;
              obj2 = obj2.parentNode;
            }
          }

          return [x, y];
        };

        var fixedParent = function () {
          var result = false;
          var obj = $element[0];
          while ((obj && obj.offsetParent) || (obj && obj.parentNode)) {
            var style = $window.getComputedStyle(obj);
            if (style.position === 'fixed') {
              result = true;
            }
            obj = obj.offsetParent;
          }
          return result;
        };

        var cropStart = function (event) {
          isFixed = fixedParent();

          var xx;
          var yy;

          if (isFixed) {
            xx = event.pageX;
            yy = event.pageY;
          } else {
            xx = event.pageX - $window.scrollX;
            yy = event.pageY - $window.scrollY;
          }

          // Only start if within a certain distance of the element itself (i.e. don't reset if doing something else but DO want a little buffer to allow for selecting from an edge and getting it all)
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

            isCropping = true;
          }
        };

        var cropMove = function (event) {
          if (!isCropping) {
            return;
          }

          var xx;
          var yy;

          if (isFixed) {
            xx = event.pageX;
            yy = event.pageY;
          } else {
            xx = event.pageX - $window.scrollX;
            yy = event.pageY - $window.scrollY;
          }

          // Don't allow to be outside the element itself
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

          // Calculate the select area top, left, right, bottom (if end is less than start, reverse them)
          if (_coords.end.x < _coords.start.x) {
            // End more left than start
            selectTemp.left = _coords.end.x;
            selectTemp.right = _coords.start.x;
          } else {
            // Start same or more left than end
            selectTemp.left = _coords.start.x;
            selectTemp.right = _coords.end.x;
          }

          if (_coords.end.y < _coords.start.y) {
            // End higher than start
            selectTemp.top = _coords.end.y;
            selectTemp.bottom = _coords.start.y;
          } else {
            // Start same or higher than end
            selectTemp.top = _coords.start.y;
            selectTemp.bottom = _coords.end.y;
          }

          // If aspect ratio set, enforce proportions by making the part that is too large be smaller
          if (ctrl.aspectRatio > 0) {
            var curWidth = selectTemp.right - selectTemp.left;
            var curHeight = selectTemp.bottom - selectTemp.top;
            var curRatio = curWidth / curHeight;

            if (curRatio > ctrl.aspectRatio) {
              // too wide, shrink width

              // end more left than start
              if (_coords.end.x < _coords.start.x) {
                // we're ending on the left, so alter the left
                selectTemp.left = selectTemp.right - (curHeight * ctrl.aspectRatio);
              } else {
                // start same or more left than end
                // we're ending on right, alter the right
                selectTemp.right = selectTemp.left + (curHeight * ctrl.aspectRatio);
              }

            } else {
              // too tall, shrink height

              // end higher than start
              if (_coords.end.y < _coords.start.y) {
                // we're ending on the top, so alter top
                selectTemp.top = selectTemp.bottom - (curWidth / ctrl.aspectRatio);
              } else {
                // start same or higher than end
                // we're ending on the bottom, so alter bottom
                selectTemp.bottom = selectTemp.top + (curWidth / ctrl.aspectRatio);
              }
            }
          }

          _coords.select = {
            top: selectTemp.top,
            left: selectTemp.left,
            bottom: selectTemp.bottom,
            right: selectTemp.right,
          };

          _coords.select.width = selectTemp.right - selectTemp.left;
          _coords.select.height = selectTemp.bottom - selectTemp.top;
        };

        var dragStart = function (event) {
          isFixed = fixedParent();

          isDragging = true;

          cropOffsets.left = event.offsetX;
          cropOffsets.top = event.offsetY;

          if (isFixed) {
            cropOffsets.left = event.offsetX;
            cropOffsets.top = event.offsetY;
          } else {
            cropOffsets.left = event.offsetX + $window.scrollX;
            cropOffsets.top = event.offsetY + $window.scrollY;
          }
        };

        var dragMove = function (event) {
          if (!isDragging) {
            return;
          }

          var maxX = (elOffsets.left + elCoords.width) - _coords.select.width;
          var minX = elOffsets.left;

          var maxY = (elOffsets.top + elCoords.height) - _coords.select.height;
          var minY = elOffsets.top;

          var xx = event.pageX - cropOffsets.left;
          var yy = event.pageY - cropOffsets.top;

          xx = Math.min(xx, maxX);
          xx = Math.max(xx, minX);
          yy = Math.min(yy, maxY);
          yy = Math.max(yy, minY);

          _coords.select.top = yy;
          _coords.select.left = xx;
          _coords.select.bottom = yy + _coords.select.height;
          _coords.select.right = xx + _coords.select.width;
        };

        var end = function (event) {
          cropMove(event);

          if (isCropping || isDragging) {
            $timeout(function () {
              ctrl.coords = coords;
            });
          }

          isCropping = false;
          isDragging = false;

          updateUi();
        };

        var setCoords = function (newCoords) {
          newCoords = newCoords || coords;

          var containerRect = container[0].getBoundingClientRect(); // Gives correct height & width sometimes negative/wrong left/top/right/bottom!
          var el = $element[0].parentElement === $document[0].body ? $element[0] : $element[0].parentElement;
          var pos = findPos(el);
          var x = pos[0];
          var y = pos[1];
          var rect = {
            left: x,
            right: x + containerRect.width,
            top: y,
            bottom: y + containerRect.height
          };

          _coords.el = {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          };

          elOffsets = {
            top: rect.top,
            left: rect.left,
          };

          elCoords = {
            left: 0,
            top: 0,
            right: rect.right - rect.left,
            bottom: rect.bottom - rect.top,
            height: rect.bottom - rect.top,
            width: rect.right - rect.left,
          };

          if (Object.keys(newCoords).length === 0) {
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
              left: (elCoords.width * newCoords.left) + elOffsets.left,
              right: (elCoords.width * newCoords.right) + elOffsets.left,
              top: (elCoords.height * newCoords.top) + elOffsets.top,
              bottom: (elCoords.height * newCoords.bottom) + elOffsets.top,
              width: elCoords.width * newCoords.width,
              height: elCoords.height * newCoords.height,
            };
          }
        };

        var init = function () {
          setCoords();
          updateUi();
        };

        crop.on('mousedown touchstart', function (event) {
          event.stopPropagation();

          dragStart(event);
        });

        crop.on('mousemove touchmove', function (event) {
          event.stopPropagation();

          dragMove(event);

          updateUi();
        });

        $document.on('mousedown touchstart', function (event) {
          setCoords();

          cropStart(event);
        });

        container.on('mousemove touchmove', function (event) {
          cropMove(event);

          updateUi();
        });

        $document.on('mouseup touchend', function (event) {
          end(event);
        });

        var resizeEvent = 'onorientationchange' in $window ? 'orientationchange' : 'resize';

        angular.element($window).on(resizeEvent, init);

        // angular.element($window).on('scroll', init);

        $scope.$watch(function () {
          return ctrl.coords;
        }, function (newCoords) {
          if (newCoords === undefined) {
            return;
          }

          coords = newCoords;

          $timeout(init);
        });

        $scope.$on('hjCropify:init', function (event, params) {
          if (params) {
            if (params.id && params.id !== options.id) {
              return false;
            }
          }

          init();
        });

        $scope.$on('hjCropify:toggleSelection', function (event, params) {
          if (params) {
            if (params.id && params.id !== options.id) {
              return false;
            }
          }

          showSelection = !showSelection;

          updateUi();
        });

        $scope.$on('hjCropify:showSelection', function (event, params) {
          if (params) {
            if (params.id && params.id !== options.id) {
              return false;
            }
          }

          showSelection = true;

          updateUi();
        });

        $scope.$on('hjCropify:hideSelection', function (event, params) {
          if (params) {
            if (params.id && params.id !== options.id) {
              return false;
            }
          }

          showSelection = false;

          updateUi();
        });

      }]
    };
  }
  );
})();
