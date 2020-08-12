'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function () {
    function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } }

    return get;
}();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _vendorSticky = require('./vendorSticky');

var _vendorSticky2 = _interopRequireDefault(_vendorSticky);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SCROLL_REASON = {
    OBSERVED: 'observed',
    REQUESTED: 'requested'
};

var StickyTree = function (_React$PureComponent) {
    _inherits(StickyTree, _React$PureComponent);

    function StickyTree(props) {
        _classCallCheck(this, StickyTree);

        var _this = _possibleConstructorReturn(this, (StickyTree.__proto__ || Object.getPrototypeOf(StickyTree)).call(this, props));

        _this.onScroll = _this.onScroll.bind(_this);

        if (_this.props.apiRef) {
            _this.props.apiRef(_this);
        }

        _this.state = {
            scrollTop: 0,
            currNodePos: 0,
            // used to know when an update was caused by a scroll so that we don't unnecessarily re-render.
            scrollTick: false
        };

        /**
         * A flattened node array created using post-traversal order.
         * @type {Array}
         */
        _this.nodes = [];
        _this.getChildrenCache = {};
        _this.rowRenderCache = {};
        _this.rowRenderRange = undefined;
        return _this;
    }

    /**
     *  Converts the consumer's tree structure into a flat array with root at index: 0,
     *  including information about the top and height of each node.
     *
     *  i.e:
     *  [
     *    { id: 'root', top: 0, index: 0, height: 100. isSticky: true , zIndex: 0, stickyTop: 10 },
     *    { id: 'child1', top: 10, index: 1, parentIndex: 0 height: 10, isSticky: false },
     *    ...
     *  ]
     */


    _createClass(StickyTree, [{
        key: 'flattenTree',
        value: function () {
            function flattenTree(node) {
                var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.props;
                var nodes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
                var isFirstChild = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
                var isLastChild = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

                var _this2 = this;

                var parentIndex = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : undefined;
                var context = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : { totalHeight: 0 };

                var index = nodes.length;
                var height = node.height !== undefined ? node.height : props.defaultRowHeight;

                var parentInfo = nodes[parentIndex];

                var id = node.id,
                    _node$isSticky = node.isSticky,
                    isSticky = _node$isSticky === undefined ? false : _node$isSticky,
                    _node$stickyTop = node.stickyTop,
                    stickyTop = _node$stickyTop === undefined ? 0 : _node$stickyTop,
                    _node$zIndex = node.zIndex,
                    zIndex = _node$zIndex === undefined ? 0 : _node$zIndex,
                    rest = _objectWithoutProperties(node, ['id', 'isSticky', 'stickyTop', 'zIndex']);

                var nodeInfo = _extends({
                    id: id,
                    isSticky: isSticky,
                    stickyTop: stickyTop,
                    zIndex: zIndex
                }, rest, {
                    top: context.totalHeight,
                    parentIndex: parentIndex,
                    parentInfo: parentInfo,
                    depth: parentIndex !== undefined ? parentInfo.depth + 1 : 0,
                    height: height,
                    index: index,
                    isFirstChild: isFirstChild,
                    isLastChild: isLastChild
                });

                nodes.push(nodeInfo);

                if (parentIndex !== undefined) {
                    parentInfo.children.push(index);
                }

                context.totalHeight += height;

                var children = props.getChildren(node.id, nodeInfo);

                if (props.isModelImmutable) {
                    // If children is undefined, then it is probably a leaf node, so we will have to render this since we don't know if the node
                    // itself has changed.
                    var oldChildren = this.getChildrenCache[node.id];
                    if (children === undefined || oldChildren !== children) {
                        delete this.rowRenderCache[node.id];
                        this.getChildrenCache[node.id] = children;

                        // Check for structure changes...
                        if (children && oldChildren && (children.length !== oldChildren.length || !children.every(function (child, i) {
                            return child.id === oldChildren[i].id;
                        }))) {
                            this.structureChanged = true;
                            // We need to update the entire branch if the structure has changed.
                            this.getBranchChildrenIds(children).forEach(function (id) {
                                return delete _this2.rowRenderCache[id];
                            });
                        }
                    }
                } else {
                    this.structureChanged = true;
                }

                if (Array.isArray(children)) {
                    nodeInfo.children = [];
                    for (var i = 0; i < children.length; i++) {
                        // Need to reset parentIndex here as we are recursive.
                        var child = children[i];
                        this.flattenTree(child, props, nodes, i === 0, i === children.length - 1, index, context);
                    }
                }

                nodeInfo.totalHeight = context.totalHeight - nodeInfo.top;

                return nodes;
            }

            return flattenTree;
        }()
    }, {
        key: 'getBranchChildrenIds',
        value: function () {
            function getBranchChildrenIds(children) {
                var _this3 = this;

                var arr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

                if (!children) {
                    return arr;
                }
                children.forEach(function (child) {
                    arr.push(child.id);
                    _this3.getBranchChildrenIds(_this3.getChildrenCache[child.id], arr);
                });
                return arr;
            }

            return getBranchChildrenIds;
        }()
    }, {
        key: 'UNSAFE_componentWillMount',
        value: function () {
            function UNSAFE_componentWillMount() {
                this.refreshCachedMetadata(this.props);
                this.storeRenderTree(this.props, this.state);
            }

            return UNSAFE_componentWillMount;
        }()
    }, {
        key: 'treeDataUpdated',
        value: function () {
            function treeDataUpdated(newProps) {
                return newProps.root !== this.props.root || newProps.getChildren !== this.props.getChildren || newProps.defaultRowHeight !== this.props.defaultRowHeight;
            }

            return treeDataUpdated;
        }()
    }, {
        key: 'UNSAFE_componentWillReceiveProps',
        value: function () {
            function UNSAFE_componentWillReceiveProps(newProps) {
                // These two properties will change when the structure changes, so we need to re-build the tree when this happens.
                if (this.treeDataUpdated(newProps)) {
                    this.refreshCachedMetadata(newProps);
                }

                if (newProps.scrollIndex !== undefined && newProps.scrollIndex >= 0) {
                    this.scrollIndexIntoView(newProps.scrollIndex);
                }
            }

            return UNSAFE_componentWillReceiveProps;
        }()
    }, {
        key: 'UNSAFE_componentWillUpdate',
        value: function () {
            function UNSAFE_componentWillUpdate(newProps, newState) {
                if (newState.scrollTick === this.state.scrollTick || newState.currNodePos !== this.state.currNodePos) {
                    this.storeRenderTree(newProps, newState);
                }
            }

            return UNSAFE_componentWillUpdate;
        }()

        /**
         * Returns the index of the node in a flat list tree (post-order traversal).
         *
         * @param nodeId The node index to get the index for.
         * @returns {number}
         */

    }, {
        key: 'getNodeIndex',
        value: function () {
            function getNodeIndex(nodeId) {
                return this.nodes.findIndex(function (node) {
                    return node.id === nodeId;
                });
            }

            return getNodeIndex;
        }()

        /**
         * Returns the node that appears higher than this node (either a parent, sibling or child of the sibling above).
         * @param nodeId The node to get the previous node of.
         * @returns {*}
         */

    }, {
        key: 'getPreviousNodeId',
        value: function () {
            function getPreviousNodeId(nodeId) {
                var index = this.getNodeIndex(nodeId);
                if (index !== -1) {
                    var node = this.nodes[index - 1];
                    if (node) {
                        return node.id;
                    }
                }
                return undefined;
            }

            return getPreviousNodeId;
        }()

        /**
         * Returns the node that appears lower than this node (sibling or sibling of the node's parent).
         * @param nodeId The node to get the next node of.
         * @returns {*}
         */

    }, {
        key: 'getNextNodeId',
        value: function () {
            function getNextNodeId(nodeId) {
                var index = this.getNodeIndex(nodeId);
                if (index !== -1) {
                    var node = this.nodes[index + 1];
                    if (node) {
                        return node.id;
                    }
                }
                return undefined;
            }

            return getNextNodeId;
        }()

        /**
         * Returns true if the node is completely visible and is not obscured.
         * This will return false when the node is partially obscured.
         *
         * @param nodeId The id of the node to check
         * @param includeObscured if true, this method will return true for partially visible nodes.
         * @returns {boolean}
         */

    }, {
        key: 'isNodeVisible',
        value: function () {
            function isNodeVisible(nodeId) {
                var includeObscured = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

                return this.isIndexVisible(this.getNodeIndex(nodeId), includeObscured);
            }

            return isNodeVisible;
        }()

        /**
         * Returns true if the node is completely visible and is not obscured, unless includeObscured is specified.
         * This will return false when the node is partially obscured, unless includeObscured is set to true.
         *
         * @param index The index of the node to check, generally retrieved via getNodeIndex()
         * @param includeObscured if true, this method will return true for partially visible nodes.
         * @returns {boolean}
         */

    }, {
        key: 'isIndexVisible',
        value: function () {
            function isIndexVisible(index) {
                var includeObscured = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

                var inView = void 0;
                var node = this.nodes[index];

                if (!node) {
                    return false;
                }

                if (node.isSticky && index === this.state.currNodePos || this.getParentPath(this.state.currNodePos).includes(this.nodes[index])) {
                    return true;
                }

                if (!includeObscured) {
                    inView = this.isIndexInViewport(index);
                } else {
                    inView = this.elem.scrollTop <= node.top + node.height - node.stickyTop && this.elem.scrollTop + this.props.height >= node.top;
                }
                if (inView) {
                    var path = this.getParentPath(index, false);
                    // If this node is in view, new need to check to see if it is obscured by a sticky parent.
                    // Note that this does not handle weird scenarios where the node's parent has a sticky top which is less than other ancestors.
                    // Or any z-index weirdness.
                    for (var i = 0; i < path.length; i++) {
                        var ancestor = path[i];
                        // If the ancestor is sticky and the node is in view, then it must be stuck to the top
                        if (ancestor.isSticky) {
                            if (!includeObscured && ancestor.stickyTop + ancestor.height > node.top - this.elem.scrollTop) {
                                return false;
                            }
                            if (includeObscured && ancestor.stickyTop + ancestor.height > node.top + node.height - this.elem.scrollTop) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
                return false;
            }

            return isIndexVisible;
        }()

        /**
         * Returns true if the node is within the view port window. Note this this will return FALSE for visible sticky nodes that are
         * partially out of view disregarding sticky, which is useful when the node will become unstuck. This may occur when the node is
         * collapsed in a tree. In this case, you want to scroll this node back into view so that the collapsed node stays in the same position.
         *
         * @param nodeId The id of the node to check
         * @returns {boolean}
         */

    }, {
        key: 'isNodeInViewport',
        value: function () {
            function isNodeInViewport(nodeId) {
                return this.isIndexInViewport(this.getNodeIndex(nodeId));
            }

            return isNodeInViewport;
        }()

        /**
         * Returns true if the node is within the view port window. Note this this will return FALSE for visible sticky nodes that are
         * partially out of view disregarding sticky, which is useful when the node will become unstuck. This may occur when the node is
         * collapsed in a tree. In this case, you want to scroll this node back into view so that the collapsed node stays in the same position.
         *
         * This also returns false if the node is partially out of view.
         *
         * @param index The node index, generally retrieved via getNodeIndex()
         * @returns {boolean}
         */

    }, {
        key: 'isIndexInViewport',
        value: function () {
            function isIndexInViewport(index) {
                var node = this.nodes[index];
                if (!node || !this.elem) {
                    return false;
                }
                return this.elem.scrollTop <= node.top - node.stickyTop && this.elem.scrollTop + this.props.height >= node.top + node.height;
            }

            return isIndexInViewport;
        }()

        /**
         * Returns the top of the node with the specified id.
         * @param nodeId
         */

    }, {
        key: 'getNodeTop',
        value: function () {
            function getNodeTop(nodeId) {
                return this.getIndexTop(this.getNodeIndex(nodeId));
            }

            return getNodeTop;
        }()

        /**
         * Returns the top of the node with the specified index.
         * @param index
         */

    }, {
        key: 'getIndexTop',
        value: function () {
            function getIndexTop(index) {
                var node = this.nodes[index];
                return node ? node.top : -1;
            }

            return getIndexTop;
        }()

        /**
         * Returns the scrollTop of the scrollable element
         *
         * @return returns -1 if the elem does not exist.
         */

    }, {
        key: 'getScrollTop',
        value: function () {
            function getScrollTop() {
                return this.elem ? this.elem.scrollTop : -1;
            }

            return getScrollTop;
        }()

        /**
         * Sets the scrollTop position of the scrollable element.
         * @param scrollTop
         */

    }, {
        key: 'setScrollTop',
        value: function () {
            function setScrollTop(scrollTop) {
                if (!isNaN(scrollTop)) {
                    this.setScrollTopAndClosestNode(scrollTop, this.state.currNodePos, SCROLL_REASON.REQUESTED);
                }
            }

            return setScrollTop;
        }()

        /**
         * Scrolls the node into view so that it is visible.
         *
         * @param nodeId The node id of the node to scroll into view.
         * @param alignToTop if true, the node will aligned to the top of viewport, or sticky parent. If false, the bottom of the node will
         * be aligned with the bottom of the viewport.
         */

    }, {
        key: 'scrollNodeIntoView',
        value: function () {
            function scrollNodeIntoView(nodeId) {
                var alignToTop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                this.scrollIndexIntoView(this.getNodeIndex(nodeId), alignToTop);
            }

            return scrollNodeIntoView;
        }()

        /**
         * Scrolls the node into view so that it is visible.
         *
         * @param index The index of the node.
         * @param alignToTop if true, the node will aligned to the top of viewport, or sticky parent. If false, the bottom of the node will
         * be aligned with the bottom of the viewport.
         */

    }, {
        key: 'scrollIndexIntoView',
        value: function () {
            function scrollIndexIntoView(index) {
                var alignToTop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                var node = this.nodes[index];
                if (node !== undefined) {
                    var scrollTop = void 0;
                    if (alignToTop) {
                        if (node.isSticky) {
                            scrollTop = node.top - node.stickyTop;
                        } else {
                            var path = this.getParentPath(index, false);
                            for (var i = 0; i < path.length; i++) {
                                var ancestor = path[i];
                                if (ancestor.isSticky) {
                                    scrollTop = node.top - ancestor.stickyTop - ancestor.height;
                                    break;
                                }
                            }
                            if (scrollTop === undefined) {
                                // Fallback if nothing is sticky.
                                scrollTop = node.top;
                            }
                        }
                    } else {
                        scrollTop = node.top - this.props.height + node.height;
                    }
                    this.setScrollTop(scrollTop);
                }
            }

            return scrollIndexIntoView;
        }()
    }, {
        key: 'componentDidUpdate',
        value: function () {
            function componentDidUpdate(prevProps, prevState) {
                if (this.state.scrollReason === SCROLL_REASON.REQUESTED) {
                    if (this.state.scrollTop >= 0 && this.state.scrollTop !== this.elem.scrollTop) {
                        this.elem.scrollTop = this.state.scrollTop;
                    }
                }

                if (this.props.onRowsRendered !== undefined && (prevState.currNodePos !== this.state.currNodePos || this.treeDataUpdated(prevProps))) {
                    var range = this.rowRenderRange;
                    var visibleStartInfo = this.nodes[range.visibleStart];
                    var visibleEndInfo = this.nodes[range.visibleEnd];

                    this.props.onRowsRendered({
                        overscanStartIndex: range.start,
                        overscanStopIndex: range.end,
                        startIndex: range.visibleStart,
                        stopIndex: range.visibleEnd,
                        startNode: visibleStartInfo && visibleStartInfo.id,
                        endNode: visibleEndInfo && visibleEndInfo.id,
                        nodes: this.nodes
                    });
                }
            }

            return componentDidUpdate;
        }()
    }, {
        key: 'refreshCachedMetadata',
        value: function () {
            function refreshCachedMetadata(props) {
                this.structureChanged = false;
                this.nodes = this.flattenTree(props.root, props);

                if (this.structureChanged) {
                    // Need to re-render as the curr node may not be in view
                    if (this.elem) {
                        // We need to find the the closest node to where we are scrolled to since the structure of the
                        // the tree probably has changed.
                        this.setScrollTopAndClosestNode(this.pendingScrollTop || this.elem.scrollTop, 0, SCROLL_REASON.REQUESTED);
                    }
                }
            }

            return refreshCachedMetadata;
        }()
    }, {
        key: 'recomputeTree',
        value: function () {
            function recomputeTree() {
                if (this.props.root !== undefined && this.props.getChildren !== undefined) {
                    this.refreshCachedMetadata(this.props);
                    this.forceUpdate();
                }
            }

            return recomputeTree;
        }()
    }, {
        key: 'storeRenderTree',
        value: function () {
            function storeRenderTree(props, state) {
                this.treeToRender = this.renderParentTree(props, state);
            }

            return storeRenderTree;
        }()
    }, {
        key: 'forceUpdate',
        value: function () {
            function forceUpdate() {
                this.getChildrenCache = {};
                this.rowRenderCache = {};
                this.storeRenderTree(this.props, this.state);
                _get(StickyTree.prototype.__proto__ || Object.getPrototypeOf(StickyTree.prototype), 'forceUpdate', this).call(this);
            }

            return forceUpdate;
        }()
    }, {
        key: 'renderParentTree',
        value: function () {
            function renderParentTree(props, state) {
                this.rowRenderRange = this.getRenderRowRange(props, state);
                var path = this.getParentPath(this.rowRenderRange.start);

                // Parent nodes to the current range.
                var indexesToRender = new Set();
                for (var i = 0; i < path.length; i++) {
                    indexesToRender.add(path[i].index);
                }

                // The rest of the nodes within the range.
                for (var _i = this.rowRenderRange.start; _i <= this.rowRenderRange.end; _i++) {
                    indexesToRender.add(this.nodes[_i].index);
                }

                if (this.props.renderRoot) {
                    return _react2['default'].createElement(
                        'div',
                        { className: 'rv-sticky-node-list', style: { width: '100%', position: 'absolute', top: 0 } },
                        this.renderChildWithChildren(props, state, this.nodes[0], 0, indexesToRender)
                    );
                }
                return this.renderParentContainer(props, state, this.nodes[0], indexesToRender);
            }

            return renderParentTree;
        }()
    }, {
        key: 'renderParentContainer',
        value: function () {
            function renderParentContainer(props, state, parent, indexesToRender) {
                return _react2['default'].createElement(
                    'div',
                    {
                        className: 'rv-sticky-node-list',
                        style: { position: 'absolute', width: '100%', height: parent.totalHeight - parent.height }
                    },
                    this.renderChildren(props, state, parent, indexesToRender)
                );
            }

            return renderParentContainer;
        }()
    }, {
        key: 'getChildContainerStyle',
        value: function () {
            function getChildContainerStyle(child, top) {
                return { position: 'absolute', top: top, height: child.totalHeight, width: '100%' };
            }

            return getChildContainerStyle;
        }()
    }, {
        key: 'renderChildWithChildren',
        value: function () {
            function renderChildWithChildren(props, state, child, top, indexesToRender) {
                return _react2['default'].createElement(
                    'div',
                    { key: 'rv-node-' + child.id, className: 'rv-sticky-parent-node',
                        style: this.getChildContainerStyle(child, top) },
                    this.renderNode(props, state, child, this.getClientNodeStyle(child)),
                    this.renderParentContainer(props, state, child, indexesToRender)
                );
            }

            return renderChildWithChildren;
        }()
    }, {
        key: 'getClientNodeStyle',
        value: function () {
            function getClientNodeStyle(node) {
                var style = { height: node.height };
                if (node.isSticky) {
                    style.position = (0, _vendorSticky2['default'])();
                    style.top = node.stickyTop;
                    style.zIndex = node.zIndex;
                }

                return style;
            }

            return getClientNodeStyle;
        }()
    }, {
        key: 'getClientLeafNodeStyle',
        value: function () {
            function getClientLeafNodeStyle(node, top) {
                return {
                    position: 'absolute',
                    top: top,
                    height: node.height,
                    width: '100%'
                };
            }

            return getClientLeafNodeStyle;
        }()
    }, {
        key: 'renderChildren',
        value: function () {
            function renderChildren(props, state, parent, indexesToRender) {
                var _this4 = this;

                var nodes = [];
                var top = 0;
                parent.children.forEach(function (index) {
                    var child = _this4.nodes[index];

                    if (indexesToRender.has(index)) {
                        if (child.children && child.children.length > 0) {
                            nodes.push(_this4.renderChildWithChildren(props, state, child, top, indexesToRender));
                        } else {
                            // Sticky nodes will need a container so that their top is correct. The sticky node itself will have a top
                            // of the offset where it should stick, which would conflict with the absolute position of the node.
                            if (child.isSticky || props.wrapAllLeafNodes) {
                                nodes.push(_react2['default'].createElement(
                                    'div',
                                    {
                                        className: 'rv-sticky-leaf-node',
                                        key: 'rv-node-' + child.id,
                                        style: _this4.getChildContainerStyle(child, top) },
                                    _this4.renderNode(props, state, child, _this4.getClientNodeStyle(child))
                                ));
                            } else {
                                nodes.push(_this4.renderNode(props, state, child, _this4.getClientLeafNodeStyle(child, top)));
                            }
                        }
                    }
                    // Needs to be on the outside so that we add the the top even if
                    // this node is not visible
                    top += child.totalHeight;
                });
                return nodes;
            }

            return renderChildren;
        }()
    }, {
        key: 'renderNode',
        value: function () {
            function renderNode(props, state, nodeInfo, style) {
                // If they have not mutated their getChildren, then no need to call them again for the same structure.
                if (props.isModelImmutable && this.rowRenderCache[nodeInfo.id]) {
                    return this.rowRenderCache[nodeInfo.id];
                }

                var renderedRow = props.rowRenderer({ id: nodeInfo.id, nodeInfo: nodeInfo, style: style });

                if (props.isModelImmutable) {
                    this.rowRenderCache[nodeInfo.id] = renderedRow;
                }

                return renderedRow;
            }

            return renderNode;
        }()

        /**
         * Determines the start and end number of the range to be rendered.
         * @returns {{start: number, end: number}} Indexes within nodes
         */

    }, {
        key: 'getRenderRowRange',
        value: function () {
            function getRenderRowRange(props, state) {
                // Needs to be at least 1
                var overscanRowCount = props.overscanRowCount > 0 ? props.overscanRowCount : 1;
                var start = state.currNodePos - overscanRowCount;
                if (start < 0) {
                    start = 0;
                }
                var visibleEnd = state.currNodePos + 1;

                while (this.nodes[visibleEnd] && this.nodes[visibleEnd].top < state.scrollTop + props.height) {
                    visibleEnd++;
                }

                var end = visibleEnd + overscanRowCount;
                if (end > this.nodes.length - 1) {
                    end = this.nodes.length - 1;
                }

                return { start: start, end: end, visibleStart: state.currNodePos, visibleEnd: visibleEnd };
            }

            return getRenderRowRange;
        }()

        /**
         * Returns the parent path from nodes for the specified index within nodes.
         * @param nodeIndex
         * @param topDownOrder if true, the array with index 0 will be the root node, otherwise 0 will be the immediate parent.
         * @returns {Array<Node>}
         */

    }, {
        key: 'getParentPath',
        value: function () {
            function getParentPath(nodeIndex) {
                var topDownOrder = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

                var currNode = this.nodes[nodeIndex];
                var path = [];
                while (currNode) {
                    currNode = this.nodes[currNode.parentIndex];
                    if (currNode) {
                        path.push(currNode);
                    }
                }
                return topDownOrder ? path.reverse() : path;
            }

            return getParentPath;
        }()

        /**
         * Searches from the current node position downwards to see if the top of nodes above are greater
         * than or equal to the current scrollTop
         * @param scrollTop
         * @param searchPos
         * @returns {number}
         */

    }, {
        key: 'forwardSearch',
        value: function () {
            function forwardSearch(scrollTop, searchPos) {
                var nodes = this.nodes;
                for (var i = searchPos; i < nodes.length; i++) {
                    if (nodes[i].top >= scrollTop) {
                        return i;
                    }
                }
                return nodes.length - 1;
            }

            return forwardSearch;
        }()

        /**
         * Searches from the current node position upwards to see if the top of nodes above are less than
         * or equal the current scrollTop.
         * @param scrollTop
         * @param searchPos
         * @returns {number}
         */

    }, {
        key: 'backwardSearch',
        value: function () {
            function backwardSearch(scrollTop, searchPos) {
                var nodes = this.nodes;
                for (var i = searchPos; i >= 0; i--) {
                    if (nodes[i].top <= scrollTop) {
                        return i;
                    }
                }
                return 0;
            }

            return backwardSearch;
        }()

        /**
         * Sets the scroll top in state and finds and sets the closest node to that scroll top.
         */

    }, {
        key: 'setScrollTopAndClosestNode',
        value: function () {
            function setScrollTopAndClosestNode(scrollTop, currNodePos, scrollReason) {
                var _this5 = this;

                if (scrollTop === this.state.scrollTop) {
                    return;
                }

                if (scrollTop >= this.elem.scrollHeight - this.elem.offsetHeight) {
                    scrollTop = this.elem.scrollHeight - this.elem.offsetHeight;
                }

                var pos = void 0;
                if (scrollTop > this.state.scrollTop || currNodePos === 0) {
                    pos = this.forwardSearch(scrollTop, currNodePos);
                }
                if (scrollTop < this.state.scrollTop || pos === undefined) {
                    pos = this.backwardSearch(scrollTop, currNodePos);
                }

                this.pendingScrollTop = scrollTop;
                this.setState({ currNodePos: pos, scrollTop: scrollTop, scrollReason: scrollReason }, function () {
                    _this5.pendingScrollTop = undefined;
                });
            }

            return setScrollTopAndClosestNode;
        }()
    }, {
        key: 'onScroll',
        value: function () {
            function onScroll(e) {
                var _e$target = e.target,
                    scrollTop = _e$target.scrollTop,
                    scrollLeft = _e$target.scrollLeft;


                var scrollReason = this.state.scrollReason || SCROLL_REASON.OBSERVED;

                this.setScrollTopAndClosestNode(scrollTop, this.state.currNodePos, scrollTop, scrollReason);

                if (this.props.onScroll !== undefined) {
                    this.props.onScroll({ scrollTop: scrollTop, scrollLeft: scrollLeft, scrollReason: scrollReason });
                }

                this.setState({ scrollTick: !this.state.scrollTick, scrollReason: undefined });
            }

            return onScroll;
        }()
    }, {
        key: 'render',
        value: function () {
            function render() {
                var _this6 = this;

                var style = { overflow: 'auto', position: 'relative' };
                if (this.props.width) {
                    style.width = this.props.width;
                }
                if (this.props.height) {
                    style.height = this.props.height;
                }

                return _react2['default'].createElement(
                    'div',
                    { ref: function () {
                            function ref(elem) {
                                return _this6.elem = elem;
                            }

                            return ref;
                        }(), className: 'rv-sticky-tree', style: style, onScroll: this.onScroll },
                    this.treeToRender
                );
            }

            return render;
        }()
    }]);

    return StickyTree;
}(_react2['default'].PureComponent);

StickyTree.propTypes = {

    /**
     * Returns an array of child objects that represent the children of a particular node.
     * The returned object for each child should be in the form:
     *
     * { id: 'childId', height: [number], isSticky: [true|false], stickyTop: [number], zIndex: 0 }
     *
     * Where id and height are mandatory. If isSticky is true, stickyTop and zIndex should also be returned.
     *
     * Example:
     *
     * const getChildren = (id) => {
     *    return myTree[id].children.map(childId => ({
     *      id: childId
     *      isSticky: nodeIsSticky(childId),
     *      height: myTree[childId].height,
     *      ...
     *    }))
     * }
     */
    getChildren: _propTypes2['default'].func.isRequired,

    /**
     * Called to retrieve a row to render. The function should return a single React node.
     * The function is called with an object in the form:
     *
     * <pre>
     *     rowRenderer({ id, style, nodeInfo })
     * </pre>
     *
     * The id is the id from either the root property passed to the tree, or one returned in the getChildren call.
     */
    rowRenderer: _propTypes2['default'].func.isRequired,

    /**
     * An object which represents the root node in the form:
     *
     * {
     *   id: 'myRootNodeId',
     *   isSticky: true
     * }
     *
     * This will be the first node passed to rowRenderer({id: myRootNodeId, ...}). Your id might be an index in an array or map lookup.
     */
    root: _propTypes2['default'].object.isRequired,

    /**
     * Lets StickyTree know how many rows above and below the visible area should be rendered, to improve performance.
     */
    overscanRowCount: _propTypes2['default'].number.isRequired,

    /**
     * The height of the outer container.
     */
    height: _propTypes2['default'].number,

    /**
     * The width of the outer container
     */
    width: _propTypes2['default'].number,

    /**
     * if true, the root node will be rendered (by calling rowRenderer() for the root id). Otherwise no root node will be rendered.
     */
    renderRoot: _propTypes2['default'].bool,

    /**
     * Sets the position of the tree to the specified scrollTop. To reset
     * this, change this to -1 or undefined
     */
    scrollTop: _propTypes2['default'].number,

    /**
     * Sets the position of the tree to the specified scrollIndex. This is useful when
     * paired with onRowsRendered() which returns the startIndex and stopIndex.
     */
    scrollIndex: _propTypes2['default'].number,

    /**
     * Called whenever the scrollTop position changes.
     */
    onScroll: _propTypes2['default'].func,

    /**
     * Called to indicate that a new render range for rows has been rendered.
     */
    onRowsRendered: _propTypes2['default'].func,

    /**
     * Specifies the default row height which will be used if the child or root object do not have a height specified.
     */
    defaultRowHeight: _propTypes2['default'].number,

    /**
     * If true, all leaf nodes will be wrapped with a div, even when they are not sticky. this may help with certain tree structures where you need a constant key
     * for the element so that it is not recreated when React dom diffing occurs.
     */
    wrapAllLeafNodes: _propTypes2['default'].bool,

    /**
     * If true, we can make some assumptions about the results returned by getChildren() which improve rendering performance.
     */
    isModelImmutable: _propTypes2['default'].bool
};
StickyTree.defaultProps = {
    overscanRowCount: 10,
    renderRoot: true,
    wrapAllLeafNodes: false,
    isModelImmutable: false
};
exports['default'] = StickyTree;