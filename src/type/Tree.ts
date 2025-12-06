export type Leaf = {
    functionName: string;
    functionCodeLine: string;
    originalFilePath: string;
    id: string;
    functionCodeContent?: string;
    comment?: string;
}

export type Tree = {
    content: Leaf;
    children: Tree[];   
}
