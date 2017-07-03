import React from 'react';

export default class StickyTree extends React.Component {

    static defaultProps = {
        overscanRowCount: 0,
        renderRoot: true
    };

    constructor(props) {
        super(props);
        this.onScroll = this.onScroll.bind(this);

        this.state = {
            scrollTop: 0,
            currNodePos: 0
        };

        this.nodePosCache = this.flattenTree(this.props.root);
        console.info(this.nodePosCache);
    }

    flattenTree(node, nodes = [], params = { totalHeight: 0, parentIndex: undefined }) {
        const index = nodes.length;
        const nodeInfo = { node, top: params.totalHeight, parentIndex: params.parentIndex, index };
        nodes.push(nodeInfo);

        if (params.parentIndex !== undefined) {
            nodes[params.parentIndex].children.push(index);
        }

        params.totalHeight += this.props.getHeight(node);

        const children = this.props.getChildren(node);
        if (Array.isArray(children)) {
            nodeInfo.children = [];

            for (let i = 0; i < children.length; i++) {
                // Need to reset parentIndex here as we are recursive.
                params.parentIndex = index;
                const child = children[i];
                this.flattenTree(child, nodes, params);
            }
        }
        nodeInfo.height = params.totalHeight - nodeInfo.top;

        return nodes;
    }


    shouldComponentUpdate(newProps, newState) {
        return (
            this.state.currNodePos !== newState.currNodePos ||
            this.props.width !== newProps.width ||
            this.props.height !== newProps.height ||
            this.props.root !== newProps.root
        );
    }

    componentWillReceiveProps(newProps) {
        if (newProps.root !== this.props.root) {
            console.info('new Tree');
        }
    }

    getChildContainerStyle(child, top) {
        return { position: 'absolute', top: top, height: child.height, width: '100%' };
    }

    renderParentTree() {
        const rowRenderRange = this.getRenderRowRange();
        const path = this.getParentPath(rowRenderRange.start);

        const indexesToRender = new Set();
        for (let i = 0; i < path.length; i++) {
            indexesToRender.add(path[i].index);
        }
        for (let i = rowRenderRange.start; i <= rowRenderRange.end; i++) {
            indexesToRender.add(this.nodePosCache[i].index);
        }

        if (this.props.renderRoot) {
            return (
                <ul className="sticky-tree-list">
                    {this.renderChildWithChildren(path[0], 0, indexesToRender)}
                </ul>
            );
        }
        return this.renderParentContainer(path[0], 'sticky-tree-list', indexesToRender);
    }

    renderParentContainer(parent, className, indexesToRender) {
        return (
            <ul key={parent.node} className={className} style={{ position: 'absolute', width: '100%' }}>
                {this.renderChildren(parent, indexesToRender)}
            </ul>
        );
    }

    renderChildWithChildren(child, top, indexesToRender) {
        return (
            <li key={child.node} style={this.getChildContainerStyle(child, top)}>
                {this.props.rowRenderer(child.node)}
                {this.renderParentContainer(child, 'parent-node', indexesToRender)}
            </li>
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
                    nodes.push(<li key={child.node} style={this.getChildContainerStyle(child, top)}>{this.props.rowRenderer(child.node)}</li>);
                }
            }
            // Needs to be on the outside so that we add the the top even if
            // this node is not visible
            top += child.height;
        });
        return nodes;
    }

    getRenderRowRange() {
        let start = this.state.currNodePos - this.props.overscanRowCount;
        if (start < 0) {
            start = 0;
        }
        let end = this.state.currNodePos + 1;

        while (this.nodePosCache[end] && this.nodePosCache[end].top < this.state.scrollTop + this.props.height) {
            end++;
        }

        end = end + this.props.overscanRowCount;
        if (end > this.nodePosCache.length - 1) {
            end = this.nodePosCache.length - 1;
        }

        return { start, end };
    }

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

    forwardSearch(scrollTop) {
        const nodePosCache = this.nodePosCache;
        for (let i = this.state.currNodePos; i < nodePosCache.length; i++) {
            if (nodePosCache[i].top >= scrollTop) {
                return i;
            }
        }
        return nodePosCache.length - 1;
    }

    backwardSearch(scrollTop) {
        const nodePosCache = this.nodePosCache;
        for (let i = this.state.currNodePos; i >= 0; i--) {
            if (nodePosCache[i].top <= scrollTop) {
                return i;
            }
        }
        return 0;
    }

    findClosestNode(scrollTop) {
        let pos;
        if (scrollTop > this.state.scrollTop) {
            pos = this.forwardSearch(scrollTop);
        } else if (scrollTop < this.state.scrollTop) {
            pos = this.backwardSearch(scrollTop);
        }
        if (pos !== this.state.currNodePos) {
            this.setState({ currNodePos: pos });
        }
    }

    onScroll(e) {
        const scrollTop = e.target.scrollTop;
        this.findClosestNode(scrollTop);
        this.setState({ scrollTop: scrollTop });
    }

    getStyle() {
        let style = {};
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
            <div className="sticky-tree" style={this.getStyle()} onScroll={this.onScroll}>
                {this.renderParentTree()}
            </div>
        );
    }
}
