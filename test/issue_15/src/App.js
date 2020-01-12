import React from "react";
import  {StickyTree} from 'react-virtualized-sticky-tree';
import "./styles.css";
import { tree } from "./data";

console.info('yo')

const getChildren = id => {
    if (tree[id].children) {
        return tree[id].children.map(id => ({ id, height: 30, isSticky: true }));
    }
};

const rowRenderer = ({ id, style }) => {
    const node = tree[id];
    return <div style={style}>{node.name}</div>;
};

function App() {
    const refContainer = React.useRef(null);
    const jumpTo = () => {
        refContainer.current.scrollNodeIntoView("child3");
    };

    return (
        <>
        <button onClick={jumpTo} style={{ marginBottom: 50 }}>
    jump to child 10
    </button>
    <StickyTree
    ref={refContainer}
    root={{ id: "root", height: 30 }}
    width={200}
    height={200}
    getChildren={getChildren}
    rowRenderer={rowRenderer}
    renderRoot={true}
    overscanRowCount={1}
    />
    </>
);
}

export default App;