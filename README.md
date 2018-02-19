# react-virtualized-sticky-tree
A React component for efficiently rendering tree like structures with support for position: sticky. `react-virtualized-sticky-tree` uses a similar API to [react-virtualized](https://github.com/bvaughn/react-virtualized).

## Demo

https://marchaos.github.io/react-virtualized-sticky-tree/

## Getting Started

`npm install react-virtualized-sticky-tree --save`

## Usage

## Basic Example

```js
import { StickyTree } from 'react-virtualized-sticky-tree';

const tree = {
  root: { name: 'Root', children: ['child1', 'child2', 'child3'], depth: 0 },
  child1: { name: 'Child 1', children: ['child4'], depth: 1 },
  child2: { name: 'Child 2', depth: 2 },
  child3: { name: 'Child 3', depth: 2 },
  child4: { name: 'Child 4', depth: 3 },
};

const getChildren = (id) => {
  return tree[id].children.map(id => ({ id, height: 30 }));
};

const rowRenderer = ({ id, style }) => {
  const node = tree[id];
  return <div style={style}>{node.name}</div>
};

render(
  <StickyTree
    root={{ id: 'root', height: 30 }}
    width={width}
    height={height}
    getChildren={getChildren}
    rowRenderer={rowRenderer}
    renderRoot={true}
    overscanRowCount={20}
  />
);
```

## Nested Sticky Header Styles

StickyTree renders the component within a nested structure so that the header's position may be 'stuck' at different levels (see [demo](https://marchaos.github.io/react-virtualized-sticky-tree/)). When passing the root node or items in the children array, specifying isSticky: true will make the item sticky.

Every nested sticky level should have a top which is at the bottom of the sticky level above it. For example. If your root node is 30px high and has a top of 0, the next sticky node should have a top of 30px. The z-index of the node should also be lower than the nodes above it (so that it is scrolled out of view underneath its parent node). If your root node is z-index 4, then the node below could be 3, below that 2 and so on.

An implementation of this would look like:

```js
const getChildren = (id) => {
    if (shouldBeSticky(id)) {
      return tree[id].children.map(childId => ({
         id: childId, 
         isSticky: true,
         stickyTop: tree[childId].depth * 10,
         zIndex: 30 - tree[childId].depth, 
         height: 10
      }))
    }
    return tree[id].children.map(childId => ({ id: childId, isSticky: false, height: 10 }))
};

/**
 * Here, style will include the styles to make the node sticky in the right position. 
 */
const rowRenderer = ({ id, style }) => {
  return <div className="row" style={style}>{mytree[id].name}</div>;
};
```

Be sure to pass a sticky root node to StickyTree if it should be sticky

```js
<StickyTree
    className="treee"
    root={{ id: 'root', isSticky: true, stickyTop: 0, zIndex: 3, height: 10 }}
    rowRenderer={rowRenderer}
    getChildren={getChildren}
/>
```

## Dynamic Height Container

If the containing element of your tree has a dynamic height, you can use [react-measure](https://github.com/souporserious/react-measure) to provide the width and height to sticky-tree so that it can resize to the available width.

For Simplicity, `react-virtualized-sticky-tree` includes a component which uses react-measure to achieve this:

```js
import { AutoSizedStickyTree } from 'react-virtualized-sticky-tree';

<AutoSizedStickyTree
    className="tree"
    root={{ id: 'root', isSticky: true, stickyTop: 0, zIndex: 3, height: 30 }}
    rowRenderer={rowRenderer}
    getChildren={getChildren}
    ...
/>
```

If you want to do this yourself, you can install react-measure:

`npm install react-measure --save`

as a HOC:
```js
const MeasuredTree = withContentRect('bounds')(({ measureRef, measure, contentRect }) => (
  <div ref={measureRef} className="sticky-wrapper">
    <StickyTree
      root={{id: 0}}
      getChildren={getChildren}
      rowRenderer={rowRenderer}
      renderRoot={true}
      width={contentRect.bounds.width}
      height={contentRect.bounds.height}
      overscanRowCount={20}
    />
  </div>
));
```
or within render()

```js
<Measure
    bounds={true}
    onResize={(contentRect) => {this.setState({ dimensions: contentRect.bounds });}}
>
    {({ measureRef }) => 
          <div ref={measureRef} className="sticky-tree-wrapper">
              <StickyTree
                  width={this.state.dimensions.width}
                  height={this.state.dimensions.height}
                  root={{id: 0 }}
                  renderRoot={true}
                  rowRenderer={this.rowRenderer}
                  getChildren={this.getChildren}
                  overscanRowCount={20}
              />
          </div>
    }
</Measure>
```

## Supported Browsers

* Tested with Chrome 59+
* Tested with Safari 11+
* Tested with Firefox 54+

Rendering tree structures is supported in all modern browsers. For position: sticky, See http://caniuse.com/#search=position%3Asticky
