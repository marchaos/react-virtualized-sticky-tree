import { expect } from 'chai';

import { StickyTree } from '../src/index';

describe('StickyTree test', () => {
    let tree;
    let props;

    it('flattenTree returns a cache of all required info', () => {
        const treeNodes = [
            { name: 'root', children: [1, 4] },
            { name: 'node1', children: [2, 3] },
            { name: 'node1-1' },
            { name: 'node1-2' },
            { name: 'node2', children: [5, 6, 7] },
            { name: 'node2-1' },
            { name: 'node2-2' },
            { name: 'node2-3' }
        ];

        props = {
            getChildren: pos => treeNodes[pos].children,
            getHeight: pos => 10

        };
        tree = new StickyTree(props);
        const nodePosCache = tree.flattenTree(0);

        expect(nodePosCache[0]).to.deep.equal({
            node: 0,
            top: 0,
            parentIndex: undefined,
            index: 0,
            children: [1, 4],
            height: 80
        });

        expect(nodePosCache[1]).to.deep.equal({
            node: 1,
            top: 10,
            parentIndex: 0,
            index: 1,
            children: [2, 3],
            height: 30
        });

        expect(nodePosCache[2]).to.deep.equal({ node: 2, top: 20, parentIndex: 1, index: 2, height: 10 });

        expect(nodePosCache[4]).to.deep.equal({
            node: 4,
            top: 40,
            parentIndex: 0,
            index: 4,
            children: [5, 6, 7],
            height: 40
        });
    });
});
