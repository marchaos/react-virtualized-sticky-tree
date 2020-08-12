'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactMeasure = require('react-measure');

var _reactMeasure2 = _interopRequireDefault(_reactMeasure);

var _StickyTree = require('./StickyTree');

var _StickyTree2 = _interopRequireDefault(_StickyTree);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AutoSizedStickyTree = function (_React$PureComponent) {
    _inherits(AutoSizedStickyTree, _React$PureComponent);

    function AutoSizedStickyTree(props) {
        _classCallCheck(this, AutoSizedStickyTree);

        var _this = _possibleConstructorReturn(this, (AutoSizedStickyTree.__proto__ || Object.getPrototypeOf(AutoSizedStickyTree)).call(this, props));

        _this.state = {};
        return _this;
    }

    _createClass(AutoSizedStickyTree, [{
        key: 'render',
        value: function () {
            function render() {
                var _this2 = this;

                return _react2['default'].createElement(
                    _reactMeasure2['default'],
                    {
                        bounds: true,
                        onResize: function () {
                            function onResize(rect) {
                                _this2.setState({ width: rect.bounds.width, height: rect.bounds.height });
                                if (_this2.props.onResize !== undefined) {
                                    _this2.props.onResize(rect);
                                }
                            }

                            return onResize;
                        }()
                    },
                    function (_ref) {
                        var measureRef = _ref.measureRef;
                        return _react2['default'].createElement(
                            'div',
                            { ref: measureRef, className: _this2.props.className },
                            _react2['default'].createElement(_StickyTree2['default'], _extends({ ref: _this2.props.treeRef, width: _this2.state.width, height: _this2.state.height }, _this2.props))
                        );
                    }
                );
            }

            return render;
        }()
    }]);

    return AutoSizedStickyTree;
}(_react2['default'].PureComponent);

exports['default'] = AutoSizedStickyTree;