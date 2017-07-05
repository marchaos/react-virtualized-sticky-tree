

const file = require('./cities.json');

const root = file.SimpleGeoName;

const nodes = [];

const process = (node, parentIndex) => {

    const index = nodes.length;
    const nodeInfo = { name: node.Name, index };
    nodes.push(nodeInfo);
    if (parentIndex !== undefined) {
        nodes[parentIndex].children.push(index);
        nodeInfo.depth = nodes[parentIndex].depth + 1;
    } else {
        nodeInfo.depth = 0;
    }

    if (node.Children && node.Children.SimpleGeoName) {
        const parentIndex = index;
        nodeInfo.children = [];
        if (!Array.isArray(node.Children.SimpleGeoName)) {
            process(node.Children.SimpleGeoName, parentIndex);
        } else {
            node.Children.SimpleGeoName.forEach((child) => {
                process(child, parentIndex);
            })
        }
    }
};

process(root);

console.info(JSON.stringify(nodes));
