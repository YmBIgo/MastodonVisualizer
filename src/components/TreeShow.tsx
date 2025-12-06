import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Tooltip } from "@mui/material";
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
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

const INDENT_SPACE = "　".repeat(1);

type TreeVisualizerProps = {
  tree: Tree;
  setLeaf: Dispatch<SetStateAction<Leaf>>;
  setCode: Dispatch<SetStateAction<string>>;
  foldedLeaves: string[];
  setFoldedLeaves: Dispatch<SetStateAction<string[]>>;
  isFolded: boolean;
  currentLeaf: Leaf;
  parentLeaf: Leaf;
  indent: number;
  isReplaying: boolean;
  startReplaying: (leafId: string) => void;
  openChatDialog: (Leaf: string) => void;
}

const TreeVisualizer: React.FC<TreeVisualizerProps> = ({
  tree,
  setLeaf,
  setCode,
  currentLeaf,
  foldedLeaves,
  setFoldedLeaves,
  isFolded,
  parentLeaf,
  indent,
  isReplaying,
  startReplaying,
  openChatDialog
}) => {
  const onClickId = () => {
    if (foldedLeaves.includes(tree.content.id)) {
      removeFolded();
    }
    setLeaf(tree.content);
    setCode(tree.content.functionCodeContent || "\n続きは、VSCode拡張のRuby Readerで見てください\nhttps://marketplace.visualstudio.com/items?itemName=coffeecupjapan.ruby-reader-ja&ssr=false\n");
  }
  const isLeafIdenticalToCurrent = tree.content.id === currentLeaf.id;
  const isRootLeafFolded = foldedLeaves.includes(tree.content.id);
  const isContainFunctionContentAndNotCurrent = tree.content.functionCodeContent || (parentLeaf.id === currentLeaf.id) || (tree.content.id === currentLeaf.id)
  const addFolded = () => {
    setFoldedLeaves((f) => [...f, tree.content.id]);
  };
  const removeFolded = () => {
    setFoldedLeaves((f) => {
      return f.filter((fchild) => fchild !== tree.content.id);
    });
  }
  if (!tree.content) return <p>JSONが入力されていません...</p>
  return (
    <Box style={{
      display: !isContainFunctionContentAndNotCurrent || isFolded ? "none" : "inherit"
    }}>
      <p
        style={{
          fontSize: "12px",
          color: isLeafIdenticalToCurrent && !tree.content.functionCodeContent
            ? "#FF000070"
            : isLeafIdenticalToCurrent && tree.content.functionCodeContent
            ? "red"
            : !tree.content.functionCodeContent
            ? "#AAAAAA"
            : "black",
        }}
      >
        { isRootLeafFolded
          ? <Box onClick={removeFolded}>
              {INDENT_SPACE.repeat(indent)}
              <span style={{fontSize: "20px"}}>+</span>
            </Box>
          : isFolded
          ? <></>
          : <Box onClick={addFolded}>
              {INDENT_SPACE.repeat(indent)}
              <span style={{fontSize: "20px"}}>-</span>
            </Box>
        }
        <Box
          onClick={onClickId}
          sx={{
            scrollMarginTop: "80px"
          }}
        >
          {INDENT_SPACE.repeat(indent)}{tree.content.functionName}
          <br/>
          {INDENT_SPACE.repeat(indent)}{tree.content.id}
          <br/>
          {INDENT_SPACE.repeat(indent)}{tree.content.comment?.slice(0, 20)}...
        </Box>
        { isLeafIdenticalToCurrent &&
          <>
            {INDENT_SPACE.repeat(indent)}
            <Button
              color="info"
              variant="contained"
              size="small"
              disabled={isReplaying}
              onClick={() => {
                startReplaying(tree.content.id);
              }}
              sx={{margin: "10px 0", zIndex: 1}}
            >
              ルートノードから再現する
            </Button>
            <br/>
            {INDENT_SPACE.repeat(indent)}
            <Button
              color="success"
              variant="contained"
              size="small"
              onClick={() => {
                openChatDialog(tree.content.id);
              }}
              sx={{margin: "10px 0", zIndex: 1}}
            >
              ChatGPTで内容を聞く
            </Button>
          </>
        }
      </p>
      <>
        { tree.children.map((c) => {
          if (!c) {
            return null;
          }
          return (
            <TreeVisualizer
              tree={c}
              indent={indent + 1}
              setCode={setCode}
              setLeaf={setLeaf}
              currentLeaf={currentLeaf}
              foldedLeaves={foldedLeaves}
              setFoldedLeaves={setFoldedLeaves}
              parentLeaf={tree.content}
              isFolded={isRootLeafFolded}
              key={c.content.id}
              isReplaying={isReplaying}
              startReplaying={startReplaying}
              openChatDialog={openChatDialog}
            />
          )
        })
        }
      </>
    </Box>
  )
}

type Props = {
    info: Info;
}

const TreeShow: React.FC<Props> = ({
    info
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {treeId} = useParams<{treeId: string}>();
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
  const searchLeavesBreakCount = Math.ceil(searchLeaves.length / 3);
  const [searchLeavesSummary, setSearchLeavesSummary] = useState<string>("");
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayQueue, setReplayQueue] = useState<Leaf[]>([]);
  const [chatQueue, setChatQueue] = useState<Leaf[]>([]);
  // functions
  const onChangeFile = async (newTreeId: string) => {
    const path = `${newTreeId}.json`;
    const url = `https://qeoe3eoz3baxqcez4gw5ucmydm0svbve.lambda-url.us-west-1.on.aws/?key=${path}`
    const fileContent = await fetch(url).then((r) => r.text())
    const file = new Blob([fileContent], {type: "application/json"});
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      let jsonContent = (e.target?.result || "{}") as string;
      if (!jsonContent){
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
        setSearchLeavesSummary(info
          ?.find((i) => i.json === treeId)
          ?.summary
          || "サマリーは作成されていません..."
        )
        setPurpose(parsedJsonContent.purpose);
        setFoldedLeaves(deepIds);
        setInputTree(convertedTreeContent);
      } catch(e) {
        console.error(e);
        setInputTree(convertTree({}))
      }
    }
    fileReader.readAsText(file)
  }
  const resetTree = () => {
    const treeIds = traverseDepthTree(inputTree, 1, []);
    const deepIds = treeIds.filter((t) => t.depth > 2).map((di) => String(di.id));
    setsearchLeaves(info
      ?.filter((i) => i.json === treeId)
      ?.flatMap((ifi) => ifi.details) ?? []
    );
    setFoldedLeaves(deepIds);
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
        const element = Array.from(functionTree?.querySelectorAll("*")??[]).filter((f) => {
          const isIncludes = f.textContent.includes(leafContent?.functionName) && f.textContent.includes(leafContent?.comment?.slice(0,20)??"no comment");
          return isIncludes;
        });
        if (!element || !element.length) return;
        element[element.length - 1]?.scrollIntoView({behavior: "smooth"});
      });
    }
    setFoldedLeaves((f) => f.filter((fc) => {
      return !showIds?.includes(fc);
    }));
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
      setCodeMarker([{startRow: searchLineExistIndex, startCol: 0, endRow: searchLineExistIndex, endCol: 100, type: 'text', className: 'replacement_marker'}]);
    }
  }
  const nextReplay = () => {
    if (replayQueue.length === 0) {
      if (!snackbarMessage){
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
      setCodeMarker([{startRow: searchLineExistIndex, startCol: 0, endRow: searchLineExistIndex + 2, endCol: 0, type: 'text', className: 'replacement_marker'}]);
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

- あなたはRuby言語のコードベースを読み分析し、与えられた関数の内容をまとめたレポートを出力することができます

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
      minWidth: "800px",
    }}>
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid black",
      }}>
        <h3 style={{margin: "0px 0px 5px"}}>{treeId}の詳細</h3>
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
        {/* <h3 style={{
          margin: "0px 0px 10px",
        }}>
          JSONファイルを１つ入力{"　"}
        </h3>
        <Input
          type="file"
          onChange={onChangeFile}
        /> */}
      </Box>
      <Box sx={{
        backgroundColor: "#AAAAAA40",
        padding: "10px"
      }}>
        <Box sx={{
          border: "1px solid #CCC",
          borderRadius: "10px",
          margin: "10px",
          padding: "10px",
          backgroundColor: "white",
        }}>
          <h3 style={{margin: "0px 0px 5px"}}>
            この関数探索の目的
            {"　"}
            <Button
              color="success"
              onClick={downloadTree}
            >
              JSON形式の木構造をダウンロード
            </Button>
          </h3>
          <hr/>
          <p>{purpose ?? "目的は書いていません"}</p>
          <Box sx={{
            display: "flex",
            gap: "20px"
          }}>
            <Box>
              <h5 style={{margin: "0px 0px 15px"}}>主な関数経路（各経路の関係性は右のサマリを参照）</h5>
              <ol
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${searchLeavesBreakCount}, minmax(0, 1fr))`,
                  gridAutoFlow: "column",
                  rowGap: ".3rem",
                  columnGap: "2rem",
                }}
              >
              { !!foldedLeaves.length && 
                searchLeaves.map((r, i) => {
                  return(
                    <Tooltip key={r[0] + "_" + i} title={r[1]}>
                      <Button
                          size="small"
                          variant="contained"
                          color="info"
                          style={{
                            fontSize: "10px"
                          }}
                          onClick={() => searchById(r[0])}
                      >
                        step{i + 1} : {r[1].slice(0, 30)}...
                      </Button>
                    </Tooltip>
                  )
                })
              }
              </ol>
            </Box>
            <Box>
              {searchLeavesSummary &&
                <>
                  <h5 style={{margin: "0px 0px 5px"}}>関数経路のサマリ</h5>
                  <p style={{
                    backgroundColor: "#333333",
                    color: "#CCCCCC",
                    padding: "10px",
                    whiteSpace: "break-spaces",
                    fontSize: "10px",
                    width: "250px",
                    maxHeight: "350px",
                    overflow: "scroll",
                    borderRadius: "10px"
                  }}>
                    {searchLeavesSummary}
                  </p>
                </>
              }
            </Box>
          </Box>
        </Box>
        <Box sx={{
          display: "flex",
          flexFlow: "row",
          gap: "10px",
          margin: "0 10px",
          minWidth: "800px",
          alignItems: "space-between"
        }}>
          <Box
            id="left-section"
            sx={{
              padding: "10px",
              flex: "1",
            }}
          >
            <Box sx={{
              border: "1px solid #CCC",
              height: "auto",
              padding: "10px",
              borderRadius: "10px",
              backgroundColor: "white",
            }}>
              <h3 style={{margin: "0px 0px 5px"}}>コメント</h3>
              <hr/>
              <p style={{fontSize: "12px"}}>
                { currentLeaf.comment ? currentLeaf.comment : "コメントはありません..." }
              </p>
            </Box>
            <br/>
            <Box sx={{
              border: "1px solid #CCC",
              height: "auto",
              padding: "10px",
              borderRadius: "10px",
              backgroundColor: "white",
            }}>
              <h3 style={{margin: "0px 0px 5px"}}>
                コード
                <br/>
                <small style={{fontSize: "12px"}}>
                  { !!currentLeaf.originalFilePath &&
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
              <hr/>
              <AceEditor
                mode="ruby"
                theme="github"
                markers={codeMarker}
                editorProps={{ $blockScrolling: true }}
                value={code}
                style={{
                  height: "250px",
                  overflow: "scroll",
                  minWidth: "100%"
                }}
              />
            </Box>
          </Box>
          <Box
            id="right-section"
            sx={{
              padding: "10px",
              flex: "1",
            }}
          >
            <CircularProgress
              sx={{
                display: inputTree.content.functionName !== "" ? "none" : "block",
              }}
            />
            <Box
            id="function-tree"
            sx={{
              display: inputTree.content.functionName === "" ? "none" : "block",
              border: "1px solid #CCC",
              height: "450px",
              overflow: isReplaying ? "hidden" : "scroll",
              padding: "10px",
              borderRadius: "10px",
              backgroundColor: "white",
              position: "relative"
            }}>
              <span id="function-tree-start">{"　"}</span>
              <Box
                sx={{
                  display: isReplaying ? "flex" : "none",
                  flexFlow: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "absolute",
                  backgroundColor: "#33333390",
                  top: "0px",
                  left: "0px",
                  height: "calc(100% + 50px)",
                  width: "100%",
                  zIndex: "100"
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "white",
                    margin: "10px",
                    padding: "10px",
                    borderRadius: "10px"
                  }}
                >
                  { replayQueue.length
                  ?
                    <>
                      残りコード
                      <br/>
                      {replayQueue.map((r) => "「" + r.functionName + "」").join(" -> ")}
                    </>
                  : <>最後のコードです</>
                  }
                </Box>
                <Box>
                  <Button
                    color="warning"
                    variant="contained"
                    onClick={resetReplay}
                  >
                    リプレイを止める
                  </Button>
                  {"　"}
                  <Button
                    color="primary"
                    variant="contained"
                    onClick={nextReplay}
                  >
                    次のコードに進む
                  </Button>
                </Box>
              </Box>
              <h3 style={{
                margin: "0px 0px 5px",
                position: "sticky",
                top: "0px",
                backgroundColor: "white",
              }}>
                関数探索の木構造
                {"　"}
                <Button
                  color="error"
                  onClick={resetTree}
                >
                  木構造をリセット
                </Button>
                <hr/>
              </h3>
              <TreeVisualizer
                tree={inputTree}
                setLeaf={setCurrentLeaf}
                setCode={setCode}
                indent={0}
                currentLeaf={currentLeaf}
                foldedLeaves={foldedLeaves}
                isFolded={false}
                parentLeaf={inputTree.content}
                setFoldedLeaves={setFoldedLeaves}
                isReplaying={isReplaying}
                startReplaying={startReplaying}
                openChatDialog={openChatDialog}
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
        { !!chatQueue.length &&
          <>
            <DialogTitle sx={{borderBottom: "1px solid #33333340"}}>
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

export default TreeShow;
