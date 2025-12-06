import type { Leaf, Tree } from "../type/Tree"

export function convertTree(tree: any): Tree {
    if (!tree) {
        return {
            content: convertOneLeaf(null),
            children: []
        }
    }
    return {
        content: convertOneLeaf(tree.content),
        children: (tree.children ?? []).map((c: any) => {
            return convertTree(c);
        })
    };
}

export function convertOneLeaf(leaf: any): Leaf {
    if (!leaf) {
        return {
            functionName: "",
            functionCodeLine: "",
            originalFilePath: "",
            id: "",
            functionCodeContent: "",
            comment: "",
        };
    }
    return {
        functionName: leaf.functionName ?? "",
        functionCodeLine: leaf.functionCodeLine ?? "",
        originalFilePath: leaf.originalFilePath ?? "",
        id: leaf.id ?? "",
        functionCodeContent: leaf.functionCodeContent ?? "",
        comment: leaf.comment ?? ""
    };
}