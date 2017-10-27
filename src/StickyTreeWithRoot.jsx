import React from 'react';
import { StickyTree } from 'react-virtualized-sticky-tree';
import Measure from 'react-measure';

export default class StickyTreeWithRoot extends React.PureComponent {

    constructor(props) {
        super(props);

        this.getChildren = this.getChildren.bind(this);
        this.rowRenderer = this.rowRenderer.bind(this);

        this.nodes = require('./countries.json');

        this.backgroundColors = [
            '#45b3e0',
            '#5bbce4',
            '#71c5e7',
            '#87ceeb'
        ];
        this.state = {
            dimensions: {}
        }
    }

    rowRenderer({ id, style }) {
        const node = this.nodes[id];
        style = { ...style, backgroundColor: this.backgroundColors[node.depth] };

        return (
            <div className="my-sticky-row" style={style}>{node.name}</div>
        );
    }

    getChildren(id) {
        if (this.nodes[id].children) {
            return this.nodes[id].children.map(childId => ({
                id: childId,
                height: 30,
                isSticky: !!this.nodes[childId].children,
                stickyTop: 30 * this.nodes[childId].depth,
                zIndex: 4 - this.nodes[childId].depth,
            }));
        }
    }

    render() {
        return (
            <Measure
                bounds
                onResize={(contentRect) => {
                    this.setState({ dimensions: contentRect.bounds });
                }}
            >
                {({ measureRef }) => {

                    return (<div ref={measureRef} className="sticky-tree-wrapper">
                        <StickyTree
                            width={this.state.dimensions.width}
                            height={this.state.dimensions.height}
                            root={{id: 0, height: 30, isSticky: true, top: 0, zIndex: 4}}
                            renderRoot={true}
                            rowRenderer={this.rowRenderer}
                            getChildren={this.getChildren}
                            overscanRowCount={20}
                        />
                    </div>)
                }
                }
            </Measure>
        );
    }
}