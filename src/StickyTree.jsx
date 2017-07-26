import React from 'react';
import PropTypes from 'prop-types';

export default class StickyTree extends React.PureComponent {

    static propTypes = {
        getChildren: PropTypes.func.isRequired,
        getHeight: PropTypes.func.isRequired,
        rowRenderer: PropTypes.func.isRequired,
        root: PropTypes.any.isRequired,
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
     *    { node: 'root', top: 0, index: 0, height: 100 },
     *    { node: 'child1', top: 10, index: 0, parentIndex: 0 height: 10 },
     *    ...
     *  ]
     */
    flattenTree(node, nodes = [], context = { totalHeight: 0, parentIndex: undefined }) {
        const index = nodes.length;
        const nodeInfo = { node, top: context.totalHeight, parentIndex: context.parentIndex, index };
        nodes.push(nodeInfo);

        if (context.parentIndex !== undefined) {
            nodes[context.parentIndex].children.push(index);
        }

        context.totalHeight += this.props.getHeight(node);

        const children = this.props.getChildren(node);
        if (Array.isArray(children)) {
            nodeInfo.children = [];
            for (let i = 0; i < children.length; i++) {
                // Need to reset parentIndex here as we are recursive.
                context.parentIndex = index;
                const child = children[i];
                this.flattenTree(child, nodes, context);
            }
        }
        nodeInfo.height = context.totalHeight - nodeInfo.top;

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
            if (this.nodePosCache[newProps.scrollIndex] !== undefined) {
                this.elem.scrollTop = this.nodePosCache[newProps.scrollIndex].scrollTop;
            }
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
                startNode: visibleStartInfo && visibleStartInfo.node,
                endNode: visibleEndInfo && visibleEndInfo.node
            });
        }
    }

    recomputeTree() {
        if (this.props.root !== undefined) {
            this.nodePosCache = this.flattenTree(this.props.root);
            this.forceUpdate();
        }
    }

    getChildContainerStyle(child, top) {
        return { position: 'absolute', top: top, height: child.height, width: '100%' };
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
            <div key={parent.node} className="rv-sticky-node-list" style={{ position: 'absolute', width: '100%' }}>
                {this.renderChildren(parent, indexesToRender)}
            </div>
        );
    }

    renderChildWithChildren(child, top, indexesToRender) {
        return (
            <div className="rv-sticky-parent-node" key={child.node} style={this.getChildContainerStyle(child, top)}>
                {this.props.rowRenderer(child.node)}
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
                            className="rv-sticky-leaf-node" key={child.node}
                            style={this.getChildContainerStyle(child, top)}>
                            {this.props.rowRenderer(child.node)}
                        </div>
                    );
                }
            }
            // Needs to be on the outside so that we add the the top even if
            // this node is not visible
            top += child.height;
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
     * @returns {number}
     */
    forwardSearch(scrollTop) {
        const nodePosCache = this.nodePosCache;
        for (let i = this.state.currNodePos; i < nodePosCache.length; i++) {
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
     * @returns {number}
     */
    backwardSearch(scrollTop) {
        const nodePosCache = this.nodePosCache;
        for (let i = this.state.currNodePos; i >= 0; i--) {
            if (nodePosCache[i].top <= scrollTop) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Returns the closest node within nodePosCache.
     * @param scrollTop
     */
    findClosestNode(scrollTop) {
        let pos;
        if (scrollTop > this.scrollTop) {
            pos = this.forwardSearch(scrollTop);
        } else if (scrollTop < this.scrollTop) {
            pos = this.backwardSearch(scrollTop);
        }
        if (pos !== this.state.currNodePos) {
            this.setState({ currNodePos: pos });
        }
    }

    onScroll(e) {
        const scrollTop = e.target.scrollTop;
        this.findClosestNode(scrollTop);
        this.scrollTop = scrollTop;

        if (this.props.onScroll !== undefined) {
            this.props.onScroll({ scrollTop: this.scrollTop });
        }
    }

    getStyle() {
        let style = { overflow: 'auto', position: 'relative' };
        if (this.props.width) {
            style.width = this.props.width;
        }
        if (this.props.height) {
            style.height = this.props.height;
        }
        return style;
    }

    render() {
        return (
            <div ref={elem => this.elem = elem} className="rv-sticky-tree" style={this.getStyle()} onScroll={this.onScroll}>
                {this.renderParentTree()}
            </div>
        );
    }
}
