# react-virtualized-sticky-tree
A React component for efficiently rendering tree like structures with support for position: sticky. `react-virtualized-sticky-tree` uses a similar API to [react-virtualized](https://github.com/bvaughn/react-virtualized).

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
    getChildren={getChildren}
    getHeight={getHeight}
    rowRenderer={rowRenderer}
    renderRoot={true}
    overscanRowCount={20}
  />
);
```

## Dynamic Height Container

If the containing element of your tree has a dynamic height, you can use [react-measure](https://github.com/souporserious/react-measure) to provide the width and height to sticky-tree so that it can resize to the available width.

`npm install react-measure --save`

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

## Supported Browsers

Rendering tree structures is supported in all modern browsers. position: sticky has only been tested in Chrome 59 and Firefox 54, but should work in Edge, Safari and Opera. See http://caniuse.com/#search=position%3Asticky
