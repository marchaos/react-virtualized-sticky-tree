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

        console.time('flatten');
        const innerScrollHeight = this.calculateHeight(this.props.tree.root);
        const nodes = [{ id: 'root', top: 0, node: this.props.tree.root, index: 0, height: innerScrollHeight, children: [] }];
        this.nodePosCache = this.flattenTree(this.props.tree, this.props.tree.root, nodes);
        console.timeEnd('flatten');
        console.info(this.nodePosCache);
    }

    flattenTree(tree, parent, nodes = [], params = { totalHeight: 0 }) {
        const parentIndex = nodes.length - 1;
        for (let i = 0; i < parent.children.length; i++) {
            const child = tree[parent.children[i]];
            const childInfo = { id: child.id, top: params.totalHeight, parentIndex, index: nodes.length, children: [] };
            params.totalHeight += this.props.getHeight(child.id);

            nodes.push(childInfo);
            nodes[parentIndex].children.push(childInfo.index);

            if (child.children.length > 0) {
                this.flattenTree(tree, child, nodes, params);
            }
            childInfo.height = params.totalHeight - childInfo.top;
        }
        return nodes;
    }

    shouldComponentUpdate(newProps, newState) {
        return (
            this.state.currNodePos !== newState.currNodePos ||
            this.props.width !== newProps.width ||
            this.props.height !== newProps.height ||
            this.props.tree !== newProps.tree
        );
    }

    componentWillReceiveProps(newProps) {
        if (newProps.tree !== this.props.tree) {
            console.info('new Tree');
        }
    }

    calculateHeight(parent) {
        let height = 0;
        parent.children.forEach(id => {
            height += this.props.getHeight(parent.id);
            if (this.props.tree[id].children.length > 0) {
                height += this.calculateHeight(this.props.tree[id]);
            }
        });

        return height;
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
            <ul key={parent.id} className={className} style={{ position: 'absolute', width: '100%' }}>
                {this.renderChildren(parent, indexesToRender)}
            </ul>
        );
    }

    renderChildWithChildren(child, top, indexesToRender) {
        return (
            <li key={child.id} style={this.getChildContainerStyle(child, top)}>
                {this.props.rowRenderer(child.id)}
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
                if (child.children && child.children.length > 0) {
                    nodes.push(this.renderChildWithChildren(child, top, indexesToRender));
                } else {
                    nodes.push(<li key={child.id} style={this.getChildContainerStyle(child, top)}>{this.props.rowRenderer(child.id)}</li>);
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
