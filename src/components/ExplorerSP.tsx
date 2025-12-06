// import { useEffect, useState } from "react";
import type { Info } from "../type/Info";
// import { convertOneLeaf, convertTree } from "../util/convertTree";
// import { traverseDepthTree } from "../util/traverseTree";
import { Link, useParams } from "react-router-dom";
// import type { Tree } from "../type/Tree";
import { Box, Button } from "@mui/material";

type Props = {
    info: Info;
}

const ExplorerSP: React.FC<Props> = ({
    // info
}) => {
    const { treeId } = useParams<{ treeId: string }>();
    // const [searchLeaves, setsearchLeaves] = useState<string[]>([]);
    // const [purpose, setPurpose] = useState<string>("");
    // const [inputTree, setInputTree] = useState<Tree>({
    //     content: convertOneLeaf(null),
    //     children: []
    // });
    // const [snackbarMessage, setSnackbarMessage] = useState("");
    // const [searchLeavesSummary, setSearchLeavesSummary] = useState<string>("");
    // const [foldedLeaves, setFoldedLeaves] = useState<string[]>([]);

    // functions
    // const onChangeFile = async (newTreeId: string) => {
    //     const path = `${newTreeId}.json`;
    //     const url = `https://qeoe3eoz3baxqcez4gw5ucmydm0svbve.lambda-url.us-west-1.on.aws/?key=${path}`
    //     const fileContent = await fetch(url).then((r) => r.text())
    //     const file = new Blob([fileContent], { type: "application/json" });
    //     const fileReader = new FileReader();
    //     fileReader.onload = (e) => {
    //         let jsonContent = (e.target?.result || "{}") as string;
    //         if (!jsonContent) {
    //             setSnackbarMessage("アップロードできませんでした...");
    //             new Promise((resolve) => setTimeout(resolve, 5000))
    //                 .then(() => setSnackbarMessage(""));
    //             return;
    //         }
    //         try {
    //             const parsedJsonContent = JSON.parse(jsonContent);
    //             const convertedTreeContent = convertTree(parsedJsonContent);
    //             const treeIds = traverseDepthTree(convertedTreeContent, 1, []);
    //             const deepIds = treeIds.filter((t) => t.depth > 2).map((di) => String(di.id));
    //             setsearchLeaves(info
    //                 ?.filter((i) => i.json === treeId)
    //                 ?.flatMap((ifi) => ifi.details) ?? []
    //             );
    //             setSearchLeavesSummary(info
    //                 ?.find((i) => i.json === treeId)
    //                 ?.summary
    //                 || "サマリーは作成されていません..."
    //             )
    //             setPurpose(parsedJsonContent.purpose);
    //             setFoldedLeaves(deepIds);
    //             setInputTree(convertedTreeContent);
    //         } catch (e) {
    //             console.error(e);
    //             setInputTree(convertTree({}))
    //         }
    //     }
    //     fileReader.readAsText(file)
    // }
    // useEffect(() => {
    //     if (!treeId) return;
    //     onChangeFile(treeId);
    // }, [treeId]);
    return (
        <Box sx={{
            minWidth: "800px",
        }}>
            <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid black",
            }}>
                <h3 style={{ margin: "0px 0px 5px" }}>{treeId}の詳細</h3>
                <Link to="/">
                    <Button
                        color="info"
                        variant="contained"
                        sx={{
                            marginBottom: "10px"
                        }}
                    >
                        戻る
                    </Button>
                </Link>
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
                    <p>
                        スマホは小さすぎるので、教材対応していません...
                        <br/>
                        PCで見てください。
                    </p>
                </Box>
            </Box>
        </Box>
    )
}

export default ExplorerSP;