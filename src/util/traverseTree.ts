import type { Leaf, Tree } from "../type/Tree";

type DepthTree = {
    depth: number;
    id: string;
}

export function traverseDepthTree(tree: Tree, depth: number, result: DepthTree[]) {
    let nextResult = [...result, {
        depth: depth,
        id: tree.content.id
    }];
    tree.children.forEach((c) => {
        nextResult = traverseDepthTree(c, depth + 1, nextResult);
    });
    return nextResult;
}

export function traverseTreeAndSearch(tree: Tree, searchId: string, depth: number = 0, width: number = 0, pos: (number | string)[][] = []) {
    const currentId = tree.content.id;
    const currentPos: (number | string)[][] = [...pos, [depth, width, currentId]];
    let nextPos: (number | string)[][] = []
    if (currentId === searchId) {
        return currentPos;
    }
    tree.children.forEach((c, i) => {
        let nextPos2 = traverseTreeAndSearch(c, searchId, depth + 1, i, currentPos) ?? [];
        if (nextPos2.length) nextPos = nextPos2
    });
    if (depth === 0 && width === 0 && nextPos.length === 0) {
        return null;
    }
    return nextPos;
}

export function traverseTreeAndGetLeaf(tree: Tree, searchId: string) {
    const currentId = tree.content.id;
    let nextLeaf = {} as Leaf;
    if (currentId === searchId) {
        return tree.content;
    }
    tree.children.forEach((c) => {
        let nextLeaf2 = traverseTreeAndGetLeaf(c, searchId);
        if (nextLeaf2?.id) nextLeaf = nextLeaf2;
    });
    if (!nextLeaf.id){
        return null;
    }
    return nextLeaf;
}

export function traverseTreeAndGetRoute(
    tree: Tree,
    searchId: string,
    result: string[],
    currentResult: Leaf[],
    isFirst: boolean = true,
): Leaf[] {
    let nowResult = isFirst ? [tree.content] : [...currentResult, tree.content];
    let finalResult: Leaf[] = [];
    if (tree.content.id === searchId) return nowResult;
    tree.children.forEach((c: Tree) => {
        const childrenResult = traverseTreeAndGetRoute(c, searchId, result, nowResult, false);
        if (childrenResult && childrenResult.length) finalResult = childrenResult;
    });
    return finalResult
}

export function getExploredTreeByTraverseIds(
    tree: Tree,
    ids: string[],
    searchId: string,
): Tree | null {
    if (ids.length === 0) return null;
    let newTree: Tree =  tree;
    for (const id of ids) {
        const searchedTree = newTree.children.find((c) => c.content.id === id);
        if (!searchedTree) break;
        if (searchedTree.children.length === 0) break;
        newTree = searchedTree;
        if (searchedTree.content.id === searchId) break;
    }
    return newTree;
}