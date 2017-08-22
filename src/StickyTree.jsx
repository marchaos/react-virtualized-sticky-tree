import React from 'react';
import PropTypes from 'prop-types';

export default class StickyTree extends React.PureComponent {

    static propTypes = {
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
        overscanRowCount: PropTypes.number.isRequired,
        height: PropTypes.number,
        width: PropTypes.number,
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
        onRowsRendered: PropTypes.func
    };

    static defaultProps = {
        overscanRowCount: 0,
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
     *    { id: 'root', top: 0, index: 0, height: 100 },
     *    { id: 'child1', top: 10, index: 0, parentIndex: 0 height: 10 },
     *    ...
     *  ]
     */
    flattenTree(node, nodes = [], context = { totalHeight: 0, parentIndex: undefined }) {
        const index = nodes.length;
        const height = node.height;

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

        const children = this.props.getChildren(node.id);
        if (Array.isArray(children)) {
            nodeInfo.children = [];
            for (let i = 0; i < children.length; i++) {
                // Need to reset parentIndex here as we are recursive.
                context.parentIndex = index;
                const child = children[i];
                this.flattenTree(child, nodes, context);
            }
        }

        nodeInfo.totalHeight = context.totalHeight - nodeInfo.top;


        return nodes;
    }

    componentWillMount() {
        this.recomputeTree();
    }

    componentWillReceiveProps(newProps) {
        if (newProps.root !== this.props.root) {
            this.nodePosCache = this.flattenTree(newProps.root);
        }

        if (newProps.scrollTop !== undefined && newProps.scrollTop >= 0 && newProps.scrollTop !== this.scrollTop) {
            this.elem.scrollTop = newProps.scrollTop;
        }

        if (newProps.scrollIndex !== undefined && newProps.scrollIndex >= 0) {
            this.scrollIndexIntoView(newProps.scrollIndex);
        }
    }

    getNodeIndex(id) {
        // TODO: Might be best to create a lookup to support this.
        for (let i = 0, l = this.nodePosCache.length; i < l; ++i) {
            if (this.nodePosCache[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    isNodeInView(node) {
        return this.isIndexInView(this.getNodeIndex(node));
    }

    /**
     * Returns true if the node is within the view. Note this this will return FALSE for visible sticky nodes that are partially out of
     * view disregarding sticky, which is useful when the node will become unstuck. This may occur when the node is collapsed in a tree.
     * In this case, you want to scroll this node back into view so that the collapsed node stays in the same position.
     *
     * @param index
     * @returns {boolean}
     */
    isIndexInView(index) {
        let node = this.nodePosCache[index];
        return this.elem.scrollTop <= node.top - node.stickyTop;
    }

    scrollNodeIntoView(node) {
        this.scrollIndexIntoView(this.getNodeIndex(node));
    }

    scrollIndexIntoView(scrollIndex) {
        let node = this.nodePosCache[scrollIndex];
        if (node !== undefined) {
            this.elem.scrollTop = node.top - node.stickyTop;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.onRowsRendered !== undefined && prevState.currNodePos !== this.props.currNodePos) {
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

    recomputeTree() {
        if (this.props.root !== undefined) {
            this.nodePosCache = this.flattenTree(this.props.root);
            // Need to re-render as the curr node may not be in view
            if (this.elem) {
                // We need to find the the closest node to where we are scrolled to since the structure of the
                // the tree probably has changed.
                this.findClosestNode(this.elem.scrollTop, 0);
            }
            this.forceUpdate();
        }
    }

    getChildContainerStyle(child, top) {
        return { position: 'absolute', top: top, height: child.totalHeight, width: '100%' };
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
                    {this.renderChildWithChildren(path[0], 0, indexesToRender)}
                </div>
            );
        }
        return this.renderParentContainer(path[0], indexesToRender);
    }

    renderParentContainer(parent, indexesToRender) {
        return (
            <div key={parent.id} className="rv-sticky-node-list" style={{ position: 'absolute', width: '100%' }}>
                {this.renderChildren(parent, indexesToRender)}
            </div>
        );
    }

    renderChildWithChildren(child, top, indexesToRender) {
        return (
            <div className="rv-sticky-parent-node" key={child.id} style={this.getChildContainerStyle(child, top)}>
                {this.props.rowRenderer({ id: child.id, style: this.getClientNodeStyle(child) })}
                {this.renderParentContainer(child, indexesToRender)}
            </div>
        );
    }

    renderChildren(parent, indexesToRender) {
        const nodes = [];
        let top = 0;
        parent.children.forEach(index => {
            const child = this.nodePosCache[index];

            if (indexesToRender.has(index)) {
                if (child.children) {
                    nodes.push(this.renderChildWithChildren(child, top, indexesToRender));
                } else {
                    nodes.push(
                        <div
                            className="rv-sticky-leaf-node" key={child.id}
                            style={this.getChildContainerStyle(child, top)}>
                            {this.props.rowRenderer({ id: child.id, style: this.getClientNodeStyle(child) })}
                        </div>
                    );
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
        let start = this.state.currNodePos - this.props.overscanRowCount;
        if (start < 0) {
            start = 0;
        }
        let visibleEnd = this.state.currNodePos + 1;

        while (this.nodePosCache[visibleEnd] && this.nodePosCache[visibleEnd].top < this.scrollTop + this.props.height) {
            visibleEnd++;
        }

        let end = visibleEnd + this.props.overscanRowCount;
        if (end > this.nodePosCache.length - 1) {
            end = this.nodePosCache.length - 1;
        }

        return { start, end, visibleStart: this.state.currNodePos, visibleEnd };
    }

    /**
     * Returns the parent path from nodePosCache for the specified index within nodePosCache.
     * @param nodeIndex
     * @returns {Array<Node>}
     */
    getParentPath(nodeIndex) {
        let currNode = this.nodePosCache[nodeIndex];
        const path = [currNode];
        while (currNode) {
            currNode = this.nodePosCache[currNode.parentIndex];
            if (currNode) {
                path.push(currNode);
            }
        }
        return path.reverse();
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
