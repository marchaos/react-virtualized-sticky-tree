import React, { useCallback, useState } from 'react';
import Measure from 'react-measure';
import countries from './countries.json';
import StickyTree from "../src/StickyTree";
const backgroundColors = [
    '#45b3e0',
    '#5bbce4',
    '#71c5e7',
    '#87ceeb'
];
const CountriesTree = () => {
    const [dimensions, setDimensions] = useState({});
    const rowRenderer = useCallback(({ id, style }) => {
        const node = countries[id];
        style = Object.assign(Object.assign({}, style), { backgroundColor: backgroundColors[node.depth] });
        return (React.createElement("div", { className: "my-sticky-row", style: style }, node.name));
    }, []);
    const getChildren = useCallback((id) => {
        var _a;
        if (countries[id].children) {
            return (_a = countries[id].children) === null || _a === void 0 ? void 0 : _a.map(childId => ({
                id: childId,
                height: 30,
                isSticky: !!countries[childId].children,
                stickyTop: 30 * countries[childId].depth,
                zIndex: 4 - countries[childId].depth,
            }));
        }
    }, []);
    return (React.createElement(Measure, { bounds: true, onResize: (contentRect) => {
            var _a, _b;
            setDimensions({ width: (_a = contentRect.bounds) === null || _a === void 0 ? void 0 : _a.width, height: (_b = contentRect.bounds) === null || _b === void 0 ? void 0 : _b.height });
        } }, ({ measureRef }) => {
        return (React.createElement("div", { ref: measureRef, className: "sticky-tree-wrapper" },
            React.createElement(StickyTree, { width: dimensions.width, height: dimensions.height, root: { id: 0, height: 30, isSticky: true, top: 0, zIndex: 4 }, renderRoot: true, rowRenderer: rowRenderer, getChildren: getChildren, overscanRowCount: 20 })));
    }));
};
export default CountriesTree;
