import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar } from "@mui/material";
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { useEffect, useMemo, useState } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import type { Leaf, Tree } from "../type/Tree";
import { convertOneLeaf, convertTree } from "../util/convertTree";
import { traverseDepthTree, traverseTreeAndGetLeaf, traverseTreeAndGetRoute, traverseTreeAndSearch } from "../util/traverseTree";
import { Link, useParams, useSearchParams } from "react-router";
import type { Info } from "../type/Info";

import "./TreeShow.css";

type Props = {
    info: Info;
}

const TreeShowSP: React.FC<Props> = ({
    info
}) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { treeId } = useParams<{ treeId: string }>();
    const [code, setCode] = useState("");
    const [codeMarker, setCodeMarker] = useState<any[]>([]);
    const [inputTree, setInputTree] = useState<Tree>({
        content: convertOneLeaf(null),
        children: []
    });
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [currentLeaf, setCurrentLeaf] = useState<Leaf>({
        functionName: "",
        functionCodeLine: "",
        originalFilePath: "",
        id: "",
        functionCodeContent: "",
        comment: "",
    });
    const [purpose, setPurpose] = useState<string>("");
    const [foldedLeaves, setFoldedLeaves] = useState<string[]>([]);
    const [searchLeaves, setsearchLeaves] = useState<string[]>([]);
    const [replayQueue, setReplayQueue] = useState<Leaf[]>([]);
    const [chatQueue, setChatQueue] = useState<Leaf[]>([]);
    const [isReplaying, setIsReplaying] = useState<boolean>(false);
    // functions
    const onChangeFile = async (newTreeId: string) => {
        const path = `${newTreeId}.json`;
        const url = `https://qeoe3eoz3baxqcez4gw5ucmydm0svbve.lambda-url.us-west-1.on.aws/?key=${path}`
        const fileContent = await fetch(url).then((r) => r.text())
        const file = new Blob([fileContent], { type: "application/json" });
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            let jsonContent = (e.target?.result || "{}") as string;
            if (!jsonContent) {
                setSnackbarMessage("アップロードできませんでした...");
                new Promise((resolve) => setTimeout(resolve, 5000))
                    .then(() => setSnackbarMessage(""));
                return;
            }
            try {
                const parsedJsonContent = JSON.parse(jsonContent);
                const convertedTreeContent = convertTree(parsedJsonContent);
                const treeIds = traverseDepthTree(convertedTreeContent, 1, []);
                const deepIds = treeIds.filter((t) => t.depth > 2).map((di) => String(di.id));
                setsearchLeaves(info
                    ?.filter((i) => i.json === treeId)
                    ?.flatMap((ifi) => ifi.details) ?? []
                );
                setPurpose(parsedJsonContent.purpose);
                setFoldedLeaves(deepIds);
                setInputTree(convertedTreeContent);
            } catch (e) {
                console.error(e);
                setInputTree(convertTree({}))
            }
        }
        fileReader.readAsText(file)
    }
    const downloadTree = () => {
        const blob = new Blob([JSON.stringify(inputTree, null, 2)], { type: 'application/json' });
        const url = (window.URL || window.webkitURL).createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${treeId}.json`;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    }
    const searchById = (searchId: string) => {
        if (!inputTree.content.id) return;
        resetReplay();
        const posArray = traverseTreeAndSearch(inputTree, searchId);
        const showIds = posArray?.map((p) => p[2]);
        const lastId = showIds ? showIds[showIds.length - 1] as string : null;
        if (lastId) {
            const leafContent = traverseTreeAndGetLeaf(inputTree, lastId);
            if (leafContent) {
                setCurrentLeaf(leafContent);
                setCode(leafContent.functionCodeContent || "\n続きは、VSCode拡張のRuby Readerで見てください\nhttps://marketplace.visualstudio.com/items?itemName=coffeecupjapan.ruby-reader-ja&ssr=false\n")
            }
            new Promise((resolve) => setTimeout(resolve, 500)).then(() => {
                if (!leafContent) return;
                const functionTree = document.getElementById("function-tree");
                const element = Array.from(functionTree?.querySelectorAll("*") ?? []).filter((f) => {
                    const isIncludes = f.textContent.includes(leafContent?.functionName) && f.textContent.includes(leafContent?.comment?.slice(0, 20) ?? "no comment");
                    if (isIncludes) console.log("isIncludes");
                    return isIncludes;
                });
                if (!element || !element.length) return;
                element[element.length - 1]?.scrollIntoView({ behavior: "smooth" });
            });
        }
        setFoldedLeaves((f) => f.filter((fc) => {
            return !showIds?.includes(fc);
        }));
        startReplaying(searchId);
    }
    const startReplaying = (leafId: string) => {
        const queue = traverseTreeAndGetRoute(inputTree, leafId, [], []);
        if (!queue.length) return;
        document.getElementById("function-tree-start")?.scrollIntoView();
        setIsReplaying(true);
        setReplayQueue(queue.slice(1));
        setCurrentLeaf(queue[0]);
        setCode(queue[0]?.functionCodeContent || "\n続きは、VSCode拡張のRuby Readerで見てください\nhttps://marketplace.visualstudio.com/items?itemName=coffeecupjapan.ruby-reader-ja&ssr=false\n");
        if (queue[0]?.functionCodeContent && queue[1]?.functionCodeLine) {
            const splitedCode = queue[0].functionCodeContent.split("\n");
            const searchLine = queue[1].functionCodeLine;
            const searchLineExistIndex = splitedCode.findIndex((c) => c === searchLine);
            if (searchLineExistIndex === -1) return;
            setCodeMarker([{ startRow: searchLineExistIndex, startCol: 0, endRow: searchLineExistIndex + 2, endCol: 0, type: 'text', className: 'replacement_marker' }]);
        }
    }
    const nextReplay = () => {
        if (replayQueue.length === 0) {
            if (!snackbarMessage) {
                setSnackbarMessage("コード経路はここまでです");
                new Promise((resolve) => setTimeout(resolve, 5000))
                    .then(() => setSnackbarMessage(""));
            }
            setIsReplaying(false);
            setCodeMarker([]);
            return;
        }
        setReplayQueue(replayQueue.slice(1));
        setCurrentLeaf(replayQueue[0])
        setCode(replayQueue[0].functionCodeContent || "\n続きは、VSCode拡張のRuby Readerで見てください\nhttps://marketplace.visualstudio.com/items?itemName=coffeecupjapan.ruby-reader-ja&ssr=false\n");
        if (replayQueue[0]?.functionCodeContent && replayQueue[1]?.functionCodeLine) {
            const splitedCode = replayQueue[0].functionCodeContent.split("\n");
            const searchLine = replayQueue[1].functionCodeLine.replace(/\t/g, "").replace(/\s/g, "");
            const searchLineExistIndex = splitedCode.findIndex((c) => c.replace(/\t/g, "").replace(/\s/g, "") === searchLine);
            if (searchLineExistIndex === -1) return;
            setCodeMarker([{ startRow: searchLineExistIndex, startCol: 0, endRow: searchLineExistIndex + 2, endCol: 0, type: 'text', className: 'replacement_marker' }]);
        }
    }
    const resetReplay = () => {
        setIsReplaying(false);
        setReplayQueue([]);
        setCodeMarker([]);
    }
    const openChatDialog = (leafId: string) => {
        const queue = traverseTreeAndGetRoute(inputTree, leafId, [], []);
        if (!queue.length) return;
        setChatQueue(queue);
    }
    const generateChat = useMemo(() => {
        if (!chatQueue.length) return "";
        const title = `あなたは「Rubyコードリーディングアシスタント」多くのプログラミング言語、フレームワーク、設計パターン、そしてベストプラクティスに精通した、非常に優秀なソフトウェア開発者です

===

できること

- あなたはRubyのC言語のコードベースを読み分析し、与えられた関数の内容をまとめたレポートを出力することができます

===

ルール

- ユーザーはあなたに「Rubyコードリーディングの目的」「今まで見た関数たちの履歴」を提供します。それに対してあなたは、それらの関数履歴たちが何をしているかを自然言語で説明してください。
- 日本語で答えてください。

`
        const chatContent = chatQueue.map((c, index) => `${index + 1} 関数名：${c.functionName} | ${c.originalFilePath}\n${c.functionCodeContent}`).join("\n\n--------\n\n");
        return title + chatContent;
    }, [chatQueue.length]);
    useEffect(() => {
        if (!treeId) return;
        onChangeFile(treeId);
    }, [treeId]);
    useEffect(() => {
        async function doJump() {
            await new Promise((resolve) => setTimeout(resolve, 500));
            searchById(searchParams.get("id") || "");
            setSearchParams("");
        }
        if (searchParams.get("id") && inputTree.content.id) {
            doJump();
        }
    }, [searchParams, inputTree]);
    return (
        <Box sx={{
            minWidth: "300px"
        }}>
            <Box sx={{
                display: "block",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
            }}>
                <h3 style={{ margin: "0px 0px 5px" }}>{treeId}の詳細</h3>
                {/* <h3 style={{
          margin: "0px 0px 10px",
        }}>
          JSONファイルを１つ入力{"　"}
        </h3>
        <Input
          type="file"
          onChange={onChangeFile}
        /> */}
                <Box
                    sx={{
                        display: "flex",
                        gap: "10px"
                    }}
                >
                    <Link to="/">
                        <Button
                            color="info"
                            variant="contained"
                            sx={{
                                marginBottom: "10px"
                            }}
                        >
                            トップに戻る
                        </Button>
                    </Link>
                    <Link to={`/explore/${treeId}`}>
                        <Button
                            color="success"
                            variant="contained"
                            sx={{
                                marginBottom: "10px"
                            }}
                        >
                            教材モードに移動
                        </Button>
                    </Link>
                </Box>
            </Box>
            <Box sx={{
                backgroundColor: "#AAAAAA40",
                padding: "10px 0px"
            }}>
                <Box sx={{
                    border: "1px solid #CCC",
                    borderRadius: "10px",
                    margin: "10px",
                    padding: "10px",
                    backgroundColor: "white",
                }}>
                    <h3 style={{ margin: "0px 0px 5px" }}>
                        この関数探索の目的
                        {"　"}
                        <Button
                            color="success"
                            onClick={downloadTree}
                        >
                            JSON形式の木構造をダウンロード
                        </Button>
                    </h3>
                    <hr />
                    <p>{purpose ?? "目的は書いていません"}</p>
                    <h5 style={{ margin: "0px 0px 5px" }}>主な関数経路</h5>
                    <ol>
                        {!!foldedLeaves.length &&
                            searchLeaves.map((r, i) => {
                                return (
                                    <li
                                        style={{ marginBottom: "5px", marginRight: "5px", color: "#001699", cursor: "pointer" }}
                                        onClick={() => searchById(r[0])}
                                        key={r[0] + "_" + i}
                                    >
                                        {r[1]}
                                    </li>
                                )
                            })
                        }
                    </ol>
                </Box>
                <Box sx={{
                    display: "block",
                    minWidth: "300px",
                    alignItems: "space-between"
                }}>
                    <Box
                        id="left-section"
                        sx={{
                            padding: "10px",
                        }}
                    >
                        <Box sx={{
                            border: "1px solid #CCC",
                            height: "auto",
                            padding: "10px",
                            borderRadius: "10px",
                            backgroundColor: "white",
                        }}>
                            <h3 style={{ margin: "0px 0px 5px" }}>
                                コメント
                                {isReplaying &&
                                    <>
                                        <br />
                                        <Button
                                            color="warning"
                                            variant="contained"
                                            onClick={resetReplay}
                                            size="small"
                                            sx={{ marginBottom: "5px" }}
                                        >
                                            リプレイを止める
                                        </Button>
                                        {"　"}
                                        <Button
                                            color="primary"
                                            variant="contained"
                                            onClick={nextReplay}
                                            size="small"
                                            sx={{ marginBottom: "5px" }}
                                        >
                                            次のコードに進む
                                        </Button>
                                        {"　"}
                                        <Button
                                            color="success"
                                            variant="contained"
                                            onClick={() => openChatDialog(replayQueue[replayQueue.length - 1].id)}
                                            size="small"
                                            sx={{ marginBottom: "5px" }}
                                        >
                                            ChatGPTに聞く
                                        </Button>
                                    </>
                                }
                            </h3>
                            <hr />
                            <p style={{ fontSize: "12px" }}>
                                {currentLeaf.comment ? currentLeaf.comment : "コメントはありません..."}
                            </p>
                        </Box>
                        <br />
                        <Box sx={{
                            border: "1px solid #CCC",
                            height: "auto",
                            padding: "10px",
                            borderRadius: "10px",
                            backgroundColor: "white",
                        }}>
                            <h3 style={{ margin: "0px 0px 5px" }}>
                                コード
                                <br />
                                <small style={{ fontSize: "12px" }}>
                                    {!!currentLeaf.originalFilePath &&
                                        <>
                                            <a href={"https://github.com/mastodon/mastodon" + currentLeaf.originalFilePath.replace("/Users/kazuyakurihara/Documents/open_source/ruby/mastodon", "")}>
                                                {currentLeaf.originalFilePath.replace("/Users/kazuyakurihara/Documents/open_source/ruby/mastodon", "")}
                                            </a>
                                            {"　"}
                                            (クリックするとGithubのMastodonの該当ファイルまで飛びます)
                                        </>
                                    }
                                </small>
                            </h3>
                            <hr />
                            <AceEditor
                                mode="ruby"
                                theme="github"
                                markers={codeMarker}
                                editorProps={{ $blockScrolling: true }}
                                value={code}
                                style={{
                                    height: "250px",
                                    width: "auto",
                                    overflow: "scroll",
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Snackbar
                open={!!snackbarMessage}
                autoHideDuration={5000}
                onClose={() => setSnackbarMessage("")}
                message={snackbarMessage}
            // action={<>{snackbarMessage}</>}
            />
            <Dialog
                open={!!chatQueue.length}
            >
                {!!chatQueue.length &&
                    <>
                        <DialogTitle sx={{ borderBottom: "1px solid #33333340" }}>
                            関数 {chatQueue[0].functionName} から {chatQueue[chatQueue.length - 1].functionName} までをChatGPTで聞く
                        </DialogTitle>
                        <DialogContent>
                            <p>プロンプトを提供しますので、ご自身のChatGPTで検索してください。</p>
                            <TextareaAutosize
                                minRows={10}
                                maxRows={10}
                                style={{
                                    width: "100%"
                                }}
                                value={generateChat}
                                onClick={() => {
                                    navigator.clipboard.writeText(generateChat);
                                    setSnackbarMessage("コピーしました");
                                    new Promise((resolve) => setTimeout(resolve, 5000))
                                        .then(() => setSnackbarMessage(""));
                                }}
                            />
                            <DialogActions>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generateChat);
                                        setSnackbarMessage("コピーしました");
                                        new Promise((resolve) => setTimeout(resolve, 5000))
                                            .then(() => setSnackbarMessage(""));
                                    }}
                                    variant="contained"
                                    color="info"
                                >
                                    プロンプトをコピーする
                                </Button>
                                <Button
                                    onClick={() => setChatQueue([])}
                                    variant="contained"
                                    color="error"
                                >
                                    閉じる
                                </Button>
                            </DialogActions>
                        </DialogContent>
                    </>
                }
            </Dialog>
        </Box>
    )
}

export default TreeShowSP;
