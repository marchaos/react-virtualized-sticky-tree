export const tree = {
    root: { name: "Root", children: ["child1", "child2", "child3"], depth: 0 },
    child1: {
        name: "Child 1",
        children: ["child4", "child5", "child6"],
        depth: 1
    },
    child2: {
        name: "Child 2",
        children: ["child7", "child8", "child9"],
        depth: 1
    },
    child3: {
        name: "Child 3",
        children: ["child10", "child11", "child12"],
        depth: 1
    },
    child4: { name: "Child 4", depth: 2 },
    child5: { name: "Child 5", depth: 2 },
    child6: { name: "Child 6", depth: 2 },
    child7: { name: "Child 7", depth: 2 },
    child8: { name: "Child 8", depth: 2 },
    child9: { name: "Child 9", depth: 2 },
    child10: { name: "Child 10", depth: 2 },
    child11: { name: "Child 11", depth: 2 },
    child12: { name: "Child 12", depth: 2 }
};
