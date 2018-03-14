import React from 'react';
import PropTypes from 'prop-types';
import vendorSticky from './vendorSticky';

const SCROLL_REASON = {
    OBSERVED: 'observed',
    REQUESTED: 'requested'
};

export default class StickyTree extends React.PureComponent {

    static propTypes = {

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
        getChildren: PropTypes.func.isRequired,

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
        rowRenderer: PropTypes.func.isRequired,

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
        root: PropTypes.object.isRequired,

        /**
         * Lets StickyTree know how many rows above and below the visible area should be rendered, to improve performance.
         */
        overscanRowCount: PropTypes.number.isRequired,

        /**
         * The height of the outer container.
         */
        height: PropTypes.number,

        /**
         * The width of the outer container
         */
        width: PropTypes.number,

        /**
         * if true, the root node will be rendered (by calling rowRenderer() for the root id). Otherwise no root node will be rendered.
         */
        renderRoot: PropTypes.bool,

        /**
         * Sets the position of the tree to the specified scrollTop. To reset
         * this, change this to -1 or undefined
         */
        scrollTop: PropTypes.number,

        /**
         * Sets the position of the tree to the specified scrollIndex. This is useful when
         * paired with onRowsRendered() which returns the startIndex and stopIndex.
         */
        scrollIndex: PropTypes.number,

        /**
         * Called whenever the scrollTop position changes.
         */
        onScroll: PropTypes.func,

        /**
         * Called to indicate that a new render range for rows has been rendered.
         */
        onRowsRendered: PropTypes.func,

        /**
         * Specifies the default row height which will be used if the child or root object do not have a height specified.
         */
        defaultRowHeight: PropTypes.number,

        /**
         * If true, all leaf nodes will be wrapped with a div, even when they are not sticky. this may help with certain tree structures where you need a constant key
         * for the element so that it is not recreated when React dom diffing occurs.
         */
        wrapAllLeafNodes: PropTypes.bool
    };

    static defaultProps = {
        overscanRowCount: 10,
        renderRoot: true,
        wrapAllLeafNodes: false
    };

    constructor(props) {
        super(props);
        this.onScroll = this.onScroll.bind(this);

        this.state = {
            scrollTop: 0,
            currNodePos: 0,
            // used to know when an update was caused by a scroll so that we don't unnecessarily re-render.
            scrollTick: false
        };

        /**
         * A flattened node array created using post-traversal order.
         * @type {Array}
         */
        this.nodes = [];
        this.rowRenderRange = undefined;
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
    flattenTree(node, props = this.props, nodes = [], isFirstChild = false, isLastChild = false, parentIndex = undefined, context = { totalHeight: 0 }) {
        const index = nodes.length;
        const height = (node.height !== undefined) ? node.height : props.defaultRowHeight;

        const parentInfo = nodes[parentIndex];
        const nodeInfo = {
            id: node.id,
            isSticky: node.isSticky || false,
            stickyTop: node.stickyTop || 0,
            zIndex: node.zIndex || 0,
            top: context.totalHeight,
            parentIndex,
            parentInfo: parentInfo,
            depth: parentIndex !== undefined ? parentInfo.depth + 1 : 0,
            height,
            index,
            isFirstChild,
            isLastChild
        };

        nodes.push(nodeInfo);

        if (parentIndex !== undefined) {
            parentInfo.children.push(index);
        }

        context.totalHeight += height;

        const children = props.getChildren(node.id, nodeInfo);
        if (Array.isArray(children)) {
            nodeInfo.children = [];
            for (let i = 0; i < children.length; i++) {
                // Need to reset parentIndex here as we are recursive.
                const child = children[i];
                this.flattenTree(child, props, nodes, i === 0, i === children.length - 1, index, context);
            }
        }

        nodeInfo.totalHeight = context.totalHeight - nodeInfo.top;

        return nodes;
    }

    componentWillMount() {
        this.refreshCachedMetadata(this.props);
        this.storeRenderTree(this.props, this.state);
    }

    hasStructureChanged(newProps) {
        return (newProps.root !== this.props.root ||
            newProps.getChildren !== this.props.getChildren ||
            newProps.defaultRowHeight !== this.props.defaultRowHeight);

    }

    componentWillReceiveProps(newProps) {
        // These two properties will change when the structure changes, so we need to re-build the tree when this happens.
        if (this.hasStructureChanged(newProps)) {
            this.refreshCachedMetadata(newProps);
        }

        if (newProps.scrollIndex !== undefined && newProps.scrollIndex >= 0) {
            this.scrollIndexIntoView(newProps.scrollIndex);
        }
    }

    componentWillUpdate(newProps, newState) {
        if (newState.scrollTick === this.state.scrollTick || newState.currNodePos !== this.state.currNodePos) {
            this.storeRenderTree(newProps, newState);
        }
    }

    /**
     * Returns the index of the node in a flat list tree (post-order traversal).
     *
     * @param nodeId The node index to get the index for.
     * @returns {number}
     */
    getNodeIndex(nodeId) {
        return this.nodes.findIndex(node => node.id === nodeId);
    }

    /**
     * Returns the node that appears higher than this node (either a parent, sibling or child of the sibling above).
     * @param nodeId The node to get the previous node of.
     * @returns {*}
     */
    getPreviousNodeId(nodeId) {
        const index = this.getNodeIndex(nodeId);
        if (index !== -1) {
            return this.nodes[index - 1];
        }
        return undefined;
    }

    /**
     * Returns the node that appears lower than this node (sibling or sibling of the node's parent).
     * @param nodeId The node to get the next node of.
     * @returns {*}
     */
    getNextNodeId(nodeId) {
        const index = this.getNodeIndex(nodeId);
        if (index !== -1) {
            return this.nodes[index + 1];
        }
        return undefined;
    }

    /**
     * Returns true if the node is completely visible and is not obscured.
     * This will return false when the node is partially obscured.
     *
     * @param nodeId The id of the node to check
     * @param includeObscured if true, this method will return true for partially visible nodes.
     * @returns {boolean}
     */
    isNodeVisible(nodeId, includeObscured = false) {
        return this.isIndexVisible(this.getNodeIndex(nodeId), includeObscured);
    }

    /**
     * Returns true if the node is completely visible and is not obscured.
     * This will return false when the node is partially obscured, unless includeObscured is set to true.
     *
     * @param index The index of the node to check, generally retrieved via getNodeIndex()
     * @param includeObscured if true, this method will return true for partially visible nodes.
     * @returns {boolean}
     */
    isIndexVisible(index, includeObscured = false) {
        let inView;
        const node = this.nodes[index];

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
            const path = this.getParentPath(index, false);
            // If this node is in view, new need to check to see if it is obscured by a sticky parent.
            // Note that this does not handle weird scenarios where the node's parent has a sticky top which is less than other ancestors.
            // Or any z-index weirdness.
            for (let i = 0; i < path.length; i++) {
                const ancestor = path[i];
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

    /**
     * Returns true if the node is within the view port window. Note this this will return FALSE for visible sticky nodes that are
     * partially out of view disregarding sticky, which is useful when the node will become unstuck. This may occur when the node is
     * collapsed in a tree. In this case, you want to scroll this node back into view so that the collapsed node stays in the same position.
     *
     * @param nodeId The id of the node to check
     * @returns {boolean}
     */
    isNodeInViewport(nodeId) {
        return this.isIndexInViewport(this.getNodeIndex(nodeId));
    }

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
    isIndexInViewport(index) {
        let node = this.nodes[index];
        return this.elem.scrollTop <= node.top - node.stickyTop && this.elem.scrollTop + this.props.height >= node.top + node.height;
    }


    /**
     * Returns the top of the node with the specified id.
     * @param nodeId
     */
    getNodeTop(nodeId) {
        return this.getIndexTop(this.getNodeIndex(nodeId));
    }

    /**
     * Returns the top of the node with the specified index.
     * @param index
     */
    getIndexTop(index) {
        return this.nodes[index].top;
    }

    /**
     * Returns the scrollTop of the scrollable element
     */
    getScrollTop() {
        return this.elem.scrollTop;
    }


    /**
     * Sets the scrollTop position of the scrollable element.
     * @param scrollTop
     */
    setScrollTop(scrollTop) {
        if (!isNaN(scrollTop)) {
            this.setState({ scrollTop, scrollReason: SCROLL_REASON.REQUESTED });
        }
    }

    /**
     * Scrolls the node into view so that it is visible.
     *
     * @param nodeId The node id of the node to scroll into view.
     * @param alignToTop if true, the node will aligned to the top of viewport, or sticky parent. If false, the bottom of the node will
     * be aligned with the bottom of the viewport.
     */
    scrollNodeIntoView(nodeId, alignToTop = true) {
        this.scrollIndexIntoView(this.getNodeIndex(nodeId), alignToTop);
    }

    /**
     * Scrolls the node into view so that it is visible.
     *
     * @param index The index of the node.
     * @param alignToTop if true, the node will aligned to the top of viewport, or sticky parent. If false, the bottom of the node will
     * be aligned with the bottom of the viewport.
     */
    scrollIndexIntoView(index, alignToTop = true) {
        let node = this.nodes[index];
        if (node !== undefined) {
            let scrollTop;
            if (alignToTop) {
                if (node.isSticky) {
                    scrollTop = node.top - node.stickyTop;
                } else {
                    const path = this.getParentPath(index, false);
                    for (let i = 0; i < path.length; i++) {
                        const ancestor = path[i];
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
                scrollTop = (node.top - this.props.height) + node.height;
            }
            this.setScrollTop(scrollTop);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.scrollReason === SCROLL_REASON.REQUESTED) {
            if (this.state.scrollTop >= 0 && this.state.scrollTop !== this.elem.scrollTop) {
                this.elem.scrollTop = this.state.scrollTop;
            }
        }

        if (this.props.onRowsRendered !== undefined && (prevState.currNodePos !== this.state.currNodePos || this.hasStructureChanged(prevProps))) {
            const range = this.rowRenderRange;
            const visibleStartInfo = this.nodes[range.visibleStart];
            const visibleEndInfo = this.nodes[range.visibleEnd];

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

    refreshCachedMetadata(props) {
        this.nodes = this.flattenTree(props.root, props);
        // Need to re-render as the curr node may not be in view
        if (this.elem) {
            // We need to find the the closest node to where we are scrolled to since the structure of the
            // the tree probably has changed.
            this.findClosestNode(this.elem.scrollTop, 0);
        }
    }

    recomputeTree() {
        if (this.props.root !== undefined && this.props.getChildren !== undefined) {
            this.refreshCachedMetadata(this.props);
            this.forceUpdate();
        }
    }

    storeRenderTree(props, state) {
        this.treeToRender = this.renderParentTree(props, state);
    }

    forceUpdate() {
        this.storeRenderTree(this.props, this.state);
        super.forceUpdate();
    }

    renderParentTree(props, state) {
        this.rowRenderRange = this.getRenderRowRange(props, state);
        const path = this.getParentPath(this.rowRenderRange.start);

        // Parent nodes to the current range.
        const indexesToRender = new Set();
        for (let i = 0; i < path.length; i++) {
            indexesToRender.add(path[i].index);
        }

        // The rest of the nodes within the range.
        for (let i = this.rowRenderRange.start; i <= this.rowRenderRange.end; i++) {
            indexesToRender.add(this.nodes[i].index);
        }

        if (this.props.renderRoot) {
            return (
                <div className="rv-sticky-node-list" style={{ width: '100%', position: 'absolute', top: 0 }}>
                    {this.renderChildWithChildren(props, state, this.nodes[0], 0, indexesToRender)}
                </div>
            );
        }
        return this.renderParentContainer(props, state, this.nodes[0], indexesToRender);
    }

    renderParentContainer(props, state, parent, indexesToRender) {
        return (
            <div
                className="rv-sticky-node-list"
                style={{ position: 'absolute', width: '100%', height: parent.totalHeight - parent.height }}
            >
                {this.renderChildren(props, state, parent, indexesToRender)}
            </div>
        );
    }

    getChildContainerStyle(child, top) {
        return { position: 'absolute', top: top, height: child.totalHeight, width: '100%' };
    }

    renderChildWithChildren(props, state, child, top, indexesToRender) {
        return (
            <div key={`rv-node-${child.id}`} className="rv-sticky-parent-node"
                 style={this.getChildContainerStyle(child, top)}>
                {this.renderNode(props, state, child, this.getClientNodeStyle(child))}
                {this.renderParentContainer(props, state, child, indexesToRender)}
            </div>
        );
    }

    getClientNodeStyle(node) {
        const style = { height: node.height };
        if (node.isSticky) {
            style.position = vendorSticky();
            style.top = node.stickyTop;
            style.zIndex = node.zIndex;
        }

        return style;
    }

    getClientLeafNodeStyle(node, top) {
        return {
            position: 'absolute',
            top,
            height: node.height,
            width: '100%'
        };
    }

    renderChildren(props, state, parent, indexesToRender) {
        const nodes = [];
        let top = 0;
        parent.children.forEach(index => {
            const child = this.nodes[index];

            if (indexesToRender.has(index)) {
                if (child.children && child.children.length > 0) {
                    nodes.push(this.renderChildWithChildren(props, state, child, top, indexesToRender));
                } else {
                    // Sticky nodes will need a container so that their top is correct. The sticky node itself will have a top
                    // of the offset where it should stick, which would conflict with the absolute position of the node.
                    if (child.isSticky || props.wrapAllLeafNodes) {
                        nodes.push(
                            <div
                                className="rv-sticky-leaf-node"
                                key={`rv-node-${child.id}`}
                                style={this.getChildContainerStyle(child, top)}>
                                {this.renderNode(props, state, child, this.getClientNodeStyle(child))}
                            </div>
                        );
                    } else {
                        nodes.push(this.renderNode(props, state, child, this.getClientLeafNodeStyle(child, top)));
                    }
                }
            }
            // Needs to be on the outside so that we add the the top even if
            // this node is not visible
            top += child.totalHeight;
        });
        return nodes;
    }

    renderNode(props, state, nodeInfo, style) {
        return props.rowRenderer({ id: nodeInfo.id, nodeInfo, style });
    }

    /**
     * Determines the start and end number of the range to be rendered.
     * @returns {{start: number, end: number}} Indexes within nodes
     */
    getRenderRowRange(props, state) {
        // Needs to be at least 1
        let overscanRowCount = (props.overscanRowCount > 0) ? props.overscanRowCount : 1;
        let start = state.currNodePos - overscanRowCount;
        if (start < 0) {
            start = 0;
        }
        let visibleEnd = state.currNodePos + 1;

        while (this.nodes[visibleEnd] && this.nodes[visibleEnd].top < state.scrollTop + props.height) {
            visibleEnd++;
        }

        let end = visibleEnd + overscanRowCount;
        if (end > this.nodes.length - 1) {
            end = this.nodes.length - 1;
        }

        return { start, end, visibleStart: state.currNodePos, visibleEnd };
    }

    /**
     * Returns the parent path from nodes for the specified index within nodes.
     * @param nodeIndex
     * @param topDownOrder if true, the array with index 0 will be the root node, otherwise 0 will be the immediate parent.
     * @returns {Array<Node>}
     */
    getParentPath(nodeIndex, topDownOrder = true) {
        let currNode = this.nodes[nodeIndex];
        const path = [];
        while (currNode) {
            currNode = this.nodes[currNode.parentIndex];
            if (currNode) {
                path.push(currNode);
            }
        }
        return (topDownOrder) ? path.reverse() : path;
    }

    /**
     * Searches from the current node position downwards to see if the top of nodes above are greater
     * than or equal to the current scrollTop
     * @param scrollTop
     * @param searchPos
     * @returns {number}
     */
    forwardSearch(scrollTop, searchPos) {
        const nodes = this.nodes;
        for (let i = searchPos; i < nodes.length; i++) {
            if (nodes[i].top >= scrollTop) {
                return i;
            }
        }
        return nodes.length - 1;
    }

    /**
     * Searches from the current node position upwards to see if the top of nodes above are less than
     * or equal the current scrollTop.
     * @param scrollTop
     * @param searchPos
     * @returns {number}
     */
    backwardSearch(scrollTop, searchPos) {
        const nodes = this.nodes;
        for (let i = searchPos; i >= 0; i--) {
            if (nodes[i].top <= scrollTop) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Returns the closest node within nodes.
     * @param scrollTop
     * @param currNodePos
     */
    findClosestNode(scrollTop, currNodePos) {
        let pos;
        if (scrollTop > this.state.scrollTop || currNodePos === 0) {
            pos = this.forwardSearch(scrollTop, currNodePos);
        }
        if (scrollTop < this.state.scrollTop || pos === undefined) {
            pos = this.backwardSearch(scrollTop, currNodePos);
        }
        this.setState({ currNodePos: pos });
    }

    onScroll(e) {
        const { scrollTop, scrollLeft } = e.target;
        this.findClosestNode(scrollTop, this.state.currNodePos);

        this.setState({ scrollTop, scrollReason: SCROLL_REASON.OBSERVED, scrollTick: !this.state.scrollTick });

        if (this.props.onScroll !== undefined) {
            this.props.onScroll({ scrollTop, scrollLeft, scrollReason: SCROLL_REASON.OBSERVED });
        }
    }

    render() {
        let style = { overflow: 'auto', position: 'relative' };
        if (this.props.width) {
            style.width = this.props.width;
        }
        if (this.props.height) {
            style.height = this.props.height;
        }

        return (
            <div ref={elem => this.elem = elem} className="rv-sticky-tree" style={style} onScroll={this.onScroll}>
                {this.treeToRender}
            </div>
        );
    }
}
