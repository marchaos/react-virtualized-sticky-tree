# react-virtualized-sticky-tree
A React component for efficiently rendering tree like structures with support for position: sticky. `react-virtualized-sticky-tree` uses a similar API to [react-virtualized](https://github.com/bvaughn/react-virtualized).

## Demo

https://marchaos.github.io/react-virtualized-sticky-tree/

## Getting Started

`npm install react-virtualized-sticky-tree --save`

## Usage

## Basic Example

```js
import StickyTree from 'react-virtualized-sticky-tree';

const tree = {
  root: { name: 'Root', children: ['child1', 'child2', 'child3'], depth: 0 },
  child1: { name: 'Child 1', children: ['child4'], depth: 1 },
  child2: { name: 'Child 2', depth: 2 },
  child3: { name: 'Child 3', depth: 2 },
  child4: { name: 'Child 4', depth: 3 },
};

const getChildren = (id) => {
  return tree[id].children;
};

const rowRenderer = (id) => {
  const node = tree[id];
  return <div>{node.name}</div>
};

const getHeight = () => 30;

render(
  <StickyTree
    root="root"
    width={width}
    height={height}
    getChildren={getChildren}
    getHeight={getHeight}
    rowRenderer={rowRenderer}
    renderRoot={true}
    overscanRowCount={20}
  />
);
```

## Nested Sticky Header Styles

sticky header components are rendered directly via your rowRenderer() function where styles are used to make the component sticky. StickyTree renders the component within a nested structure so that the header's position may be 'stuck' at different levels (see [demo](https://marchaos.github.io/react-virtualized-sticky-tree/)). 

Every nested sticky level should have a top which is at the bottom of the sticky level above it. For example. If your root node is 30px high and has a top of 0, the next sticky node should have a top of 30px. The z-index of the node should also be lower than the nodes above it. If your root node is z-index 4, then the node below could be 3, below that 2 and so on.

An implementation of this would look like:

```js
const rowRenderer = (id) => {
  let style = {};
  if (nodeShouldBeSticky(id)) {
    const depth = mytree[id].depth;
    const nodeHeight = 30;
    style = { position: 'sticky', top: depth * nodeHeight, zIndex: 4 - depth };
  }
  return <div className="row" style={style}>{mytree[id].name}</div>;
};
```

## Dynamic Height Container

If the containing element of your tree has a dynamic height, you can use [react-measure](https://github.com/souporserious/react-measure) to provide the width and height to sticky-tree so that it can resize to the available width.

`npm install react-measure --save`

as a HOC:
```js
const MeasuredTree = withContentRect('bounds')(({ measureRef, measure, contentRect }) => (
  <div ref={measureRef} className="sticky-wrapper">
    <StickyTree
      root="root"
      getChildren={getChildren}
      getHeight={getHeight}
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
                  root={0}
                  renderRoot={true}
                  rowRenderer={this.rowRenderer}
                  getChildren={this.getChildren}
                  getHeight={() => 30}
                  overscanRowCount={20}
              />
          </div>
    }
</Measure>
```

## Supported Browsers

Rendering tree structures is supported in all modern browsers. position: sticky has only been tested in Chrome 59 and Firefox 54, but should work in Edge, Safari and Opera. See http://caniuse.com/#search=position%3Asticky
