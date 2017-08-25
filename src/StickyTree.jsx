import React from 'react';
import PropTypes from 'prop-types';

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
         *     rowRenderer({ id, style })
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
        defaultRowHeight: PropTypes.number
    };

    static defaultProps = {
        overscanRowCount: 10,
        renderRoot: true
    };

    constructor(props) {
        super(props);
        this.onScroll = this.onScroll.bind(this);

        this.state = {
            currNodePos: 0
        };

        this.scrollTop = 0;
        this.nodePosCache = [];
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
    flattenTree(node, props = this.props, nodes = [], context = { totalHeight: 0, parentIndex: undefined }) {
        const index = nodes.length;
        const height = (node.height !== undefined) ? node.height : props.defaultRowHeight;

        const nodeInfo = {
            id: node.id,
            isSticky: node.isSticky || false,
            stickyTop: node.stickyTop || 0,
            zIndex: node.zIndex || 0,
            top: context.totalHeight,
            parentIndex: context.parentIndex,
            height,
            index
        };

        nodes.push(nodeInfo);

        if (context.parentIndex !== undefined) {
            nodes[context.parentIndex].children.push(index);
        }

        context.totalHeight += height;

        const children = props.getChildren(node.id);
        if (Array.isArray(children)) {
            nodeInfo.children = [];
            for (let i = 0; i < children.length; i++) {
                // Need to reset parentIndex here as we are recursive.
                context.parentIndex = index;
                const child = children[i];
                this.flattenTree(child, props, nodes, context);
            }
        }

        nodeInfo.totalHeight = context.totalHeight - nodeInfo.top;

        return nodes;
    }

    componentWillMount() {
        this.recomputeTree();
    }

    componentWillReceiveProps(newProps) {
        // These two properties will change when the structure changes, so we need to re-build the tree when this happens.
        if (newProps.root !== this.props.root ||
            newProps.getChildren !== this.props.getChildren ||
            newProps.defaultRowHeight !== this.props.defaultRowHeight) {
            this.refreshCachedMetadata(newProps);
        }

        if (newProps.scrollTop !== undefined && newProps.scrollTop >= 0 && newProps.scrollTop !== this.scrollTop) {
            this.elem.scrollTop = newProps.scrollTop;
        }

        if (newProps.scrollIndex !== undefined && newProps.scrollIndex >= 0) {
            this.scrollIndexIntoView(newProps.scrollIndex);
        }
    }

    /**
     * Returns the index of the node in a flat list tree (post-order traversal).
     *
     * @param nodeId The node index to get the index for.
     * @returns {number}
     */
    getNodeIndex(nodeId) {
        // TODO: Might be best to create a lookup to support this.
        for (let i = 0, l = this.nodePosCache.length; i < l; ++i) {
            if (this.nodePosCache[i].id === nodeId) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Returns true if the node is completely visible and is not obscured.
     * This will return false when the node is partially obscured.
     *
     * @param nodeId The id of the node to check
     * @returns {boolean}
     */
    isNodeVisible(nodeId) {
        return this.isIndexVisible(this.getNodeIndex(nodeId));
    }

    /**
     * Returns true if the node is completely visible and is not obscured.
     * This will return false when the node is partially obscured.
     *
     * @param index The index of the node to check, generally retrieved via getNodeIndex()
     * @returns {boolean}
     */
    isIndexVisible(index) {
        const inView = this.isIndexInViewport(index);
        if (inView) {
            const node = this.nodePosCache[index];
            // If this node is in view, new need to check to see if it is obscured by a sticky parent.
            // Note that this does not handle weird scenarios where the node's parent has a sticky top which is less than other ancestors.
            // Or any z-index weirdness.
            const path = this.getParentPath(index, false);
            for (let i = 0; i < path.length; i++) {
                const ancestor = path[i];
                // If the ancestor is sticky and the node is in view, then it must be stuck to the top
                if (ancestor.isSticky) {
                    if (ancestor.stickyTop + ancestor.height > node.top - this.elem.scrollTop) {
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
        let node = this.nodePosCache[index];
        return this.elem.scrollTop <= node.top - node.stickyTop && this.elem.scrollTop + this.props.height >= node.top + node.height;
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
        let node = this.nodePosCache[index];
        if (node !== undefined) {
            if (alignToTop) {
                if (node.isSticky) {
                    this.elem.scrollTop = node.top - node.stickyTop;
                } else {
                    const path = this.getParentPath(index, false);
                    for (let i = 0; i < path.length; i++) {
                        const ancestor = path[i];
                        if (ancestor.isSticky) {
                            this.elem.scrollTop = node.top - ancestor.stickyTop - ancestor.height;
                            return;
                        }
                    }
                    // Fallback if nothing is sticky.
                    this.elem.scrollTop = node.top;
                }
            } else {
                this.elem.scrollTop = (node.top - this.props.height) + node.height;
            }
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.onRowsRendered !== undefined && prevState.currNodePos !== this.state.currNodePos) {
            const range = this.rowRenderRange;
            const visibleStartInfo = this.nodePosCache[range.visibleStart];
            const visibleEndInfo = this.nodePosCache[range.visibleEnd];

            this.props.onRowsRendered({
                overscanStartIndex: range.start,
                overscanStopIndex: range.end,
                startIndex: range.visibleStart,
                stopIndex: range.visibleEnd,
                startNode: visibleStartInfo && visibleStartInfo.id,
                endNode: visibleEndInfo && visibleEndInfo.id
            });
        }
    }

    refreshCachedMetadata(props) {
        this.nodePosCache = this.flattenTree(props.root, props);
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

    renderParentTree() {
        this.rowRenderRange = this.getRenderRowRange();
        const path = this.getParentPath(this.rowRenderRange.start);

        // Parent nodes to the current range.
        const indexesToRender = new Set();
        for (let i = 0; i < path.length; i++) {
            indexesToRender.add(path[i].index);
        }

        // The rest of the nodes within the range.
        for (let i = this.rowRenderRange.start; i <= this.rowRenderRange.end; i++) {
            indexesToRender.add(this.nodePosCache[i].index);
        }

        if (this.props.renderRoot) {
            return (
                <div className="rv-sticky-node-list" style={{ width: '100%', position: 'absolute', top: 0 }}>
                    {this.renderChildWithChildren(this.nodePosCache[0], 0, indexesToRender)}
                </div>
            );
        }
        return this.renderParentContainer(this.nodePosCache[0], indexesToRender);
    }

    renderParentContainer(parent, indexesToRender) {
        return (
            <div
                key={`rv-sticky-node-list-${parent.id}`}
                className="rv-sticky-node-list"
                style={{ position: 'absolute', width: '100%', height: parent.totalHeight - parent.height }}
            >
                {this.renderChildren(parent, indexesToRender)}
            </div>
        );
    }

    getChildContainerStyle(child, top) {
        return { position: 'absolute', top: top, height: child.totalHeight, width: '100%' };
    }

    renderChildWithChildren(child, top, indexesToRender) {
        return (
            <div key={`rv-sticky-parent-node-${child.id}`} className="rv-sticky-parent-node"
                 style={this.getChildContainerStyle(child, top)}>
                {this.props.rowRenderer({ id: child.id, style: this.getClientNodeStyle(child) })}
                {this.renderParentContainer(child, indexesToRender)}
            </div>
        );
    }

    getClientNodeStyle(node) {
        const style = { height: node.height };
        if (node.isSticky) {
            style.position = 'sticky';
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

    renderChildren(parent, indexesToRender) {
        const nodes = [];
        let top = 0;
        parent.children.forEach(index => {
            const child = this.nodePosCache[index];

            if (indexesToRender.has(index)) {
                if (child.children && child.children.length > 0) {
                    nodes.push(this.renderChildWithChildren(child, top, indexesToRender));
                } else {
                    // Sticky nodes will need a container so that their top is correct. The sticky node itself will have a top
                    // of the offset where it should stick, which would conflict with the absolute position of the node.
                    if (child.isSticky) {
                        nodes.push(
                            <div
                                className="rv-sticky-leaf-node"
                                key={child.id}
                                style={this.getChildContainerStyle(child, top)}>
                                {this.props.rowRenderer({ id: child.id, style: this.getClientNodeStyle(child) })}
                            </div>
                        );
                    } else {
                        nodes.push(this.props.rowRenderer({ id: child.id, style: this.getClientLeafNodeStyle(child, top) }));
                    }
                }
            }
            // Needs to be on the outside so that we add the the top even if
            // this node is not visible
            top += child.totalHeight;
        });
        return nodes;
    }

    /**
     * Determines the start and end number of the range to be rendered.
     * @returns {{start: number, end: number}} Indexes within nodePosCache
     */
    getRenderRowRange() {
        // Needs to be at least 1
        let overscanRowCount = (this.props.overscanRowCount > 0) ? this.props.overscanRowCount : 1;
        let start = this.state.currNodePos - overscanRowCount;
        if (start < 0) {
            start = 0;
        }
        let visibleEnd = this.state.currNodePos + 1;

        while (this.nodePosCache[visibleEnd] && this.nodePosCache[visibleEnd].top < this.scrollTop + this.props.height) {
            visibleEnd++;
        }

        let end = visibleEnd + overscanRowCount;
        if (end > this.nodePosCache.length - 1) {
            end = this.nodePosCache.length - 1;
        }

        return { start, end, visibleStart: this.state.currNodePos, visibleEnd };
    }

    /**
     * Returns the parent path from nodePosCache for the specified index within nodePosCache.
     * @param nodeIndex
     * @param topDownOrder if true, the array with index 0 will be the root node, otherwise 0 will be the immediate parent.
     * @returns {Array<Node>}
     */
    getParentPath(nodeIndex, topDownOrder = true) {
        let currNode = this.nodePosCache[nodeIndex];
        const path = [];
        while (currNode) {
            currNode = this.nodePosCache[currNode.parentIndex];
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
        const nodePosCache = this.nodePosCache;
        for (let i = searchPos; i < nodePosCache.length; i++) {
            if (nodePosCache[i].top >= scrollTop) {
                return i;
            }
        }
        return nodePosCache.length - 1;
    }

    /**
     * Searches from the current node position upwards to see if the top of nodes above are less than
     * or equal the current scrollTop.
     * @param scrollTop
     * @param searchPos
     * @returns {number}
     */
    backwardSearch(scrollTop, searchPos) {
        const nodePosCache = this.nodePosCache;
        for (let i = searchPos; i >= 0; i--) {
            if (nodePosCache[i].top <= scrollTop) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Returns the closest node within nodePosCache.
     * @param scrollTop
     * @param currNodePos
     */
    findClosestNode(scrollTop, currNodePos) {
        let pos;
        if (scrollTop > this.scrollTop || currNodePos === 0) {
            pos = this.forwardSearch(scrollTop, currNodePos);
        }
        if (scrollTop < this.scrollTop || pos === undefined) {
            pos = this.backwardSearch(scrollTop, currNodePos);
        }
        this.setState({ currNodePos: pos });
    }

    onScroll(e) {
        const scrollTop = e.target.scrollTop;
        this.findClosestNode(scrollTop, this.state.currNodePos);
        this.scrollTop = scrollTop;

        if (this.props.onScroll !== undefined) {
            this.props.onScroll({ scrollTop: this.scrollTop });
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
                {this.renderParentTree()}
            </div>
        );
    }
}
