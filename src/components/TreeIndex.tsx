import { Box, Button } from "@mui/material";
import type { Info } from "../type/Info";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import type { QuestionFailedHistory, QuestionSuccessHistory } from "../type/QuestionHistory";
import { MATSODON_LOCALSTORAGE_FAILED_KEY, MATSODON_LOCALSTORAGE_SUCCESS_KEY } from "../const/localstorage";
import { convertQuestionHistory, convertQuestionSuccessHistory } from "../util/convertQuestionHistory";

type Props = {
    info: Info;
}

const TreeIndex: React.FC<Props> = ({
    info
}) => {
  const [questionHistory, setQuestionHistory] = useState<QuestionFailedHistory>([]);
  const [questionSuccessHistory, setQuestionSuccessHistory] = useState<QuestionSuccessHistory>([]);
  useEffect(() => {
    const localStorageContent = localStorage.getItem(MATSODON_LOCALSTORAGE_FAILED_KEY);
    const localStorageSuccessContent = localStorage.getItem(MATSODON_LOCALSTORAGE_SUCCESS_KEY);
    try {
      if (!localStorageSuccessContent) return;
      const parsedContent = convertQuestionSuccessHistory(JSON.parse(localStorageSuccessContent)) as QuestionSuccessHistory;
      setQuestionSuccessHistory(parsedContent);
    } catch (e) {
      console.error(e);
    }
    try {
      if (!localStorageContent) return;
      const parsedContent = convertQuestionHistory(JSON.parse(localStorageContent)) as QuestionFailedHistory;
      setQuestionHistory(parsedContent);
    } catch (e) {
      console.error(e);
    }
  }, []);
    return (
    <Box sx={{
      minWidth: "800px",
    }}>
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid black",
      }}>
        <h3 style={{margin: "0px 0px 5px"}}>mastodon visualizer</h3>
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
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{margin: "10px", flexGrow: 0.5}}>
                <h3 style={{margin: "0px 0px 5px"}}>このサイトは何か？</h3>
                <hr/>
                Mastodonのソースコードを解析して、各機能がどのように実装されているかを可視化したサイトです。
                <br/>
                以下のVSCode拡張機能を使って、再現できるように可視化した。
                <br/>
                <Button
                    href="https://marketplace.visualstudio.com/items?itemName=coffeecupjapan.ruby-reader-ja"
                    variant="contained"
                    sx={{marginTop: "15px"}}
                >
                    Ruby Reader
                </Button>
                <br/>
                <p>
                私が使用している環境は以下ですので、ご承知おきください。
                </p>
                <ul>
                  <li>Mastodon commit (585545d0d5678a6ea4b958af4a3bc6593134d0f6)</li>
                  <li>Mac M4 (arm64)</li>
                </ul>
                <hr/>
                <p>何か問題がありましたら、メールアドレス coffeecupjapan[a]yahoo.co.jp まで連絡ください</p>
              </Box>
              <Box sx={{margin: "10px", flexGrow: 0.5}}>
                <h3 style={{margin: "0px 0px 5px"}}>過去に解いて正解した問題</h3>
                <hr/>
                { questionSuccessHistory.length === 0 && (<p>ありません。教材を解いてみてみましょう！</p>) }
                { questionSuccessHistory.length > 0 && (
                    <ul>
                        { questionSuccessHistory.slice(-6, -1).map((qh, i) => {
                            return (
                                <li key={`question_history_${i}`}>
                                    <Link to={`/explore/${qh.json}?questionId=${qh.questionId}`}>
                                        {qh.json} <br/> {qh.questionString} (正解した回数: {qh.successCount})
                                    </Link>
                                </li>
                            )
                        }) }
                    </ul>
                ) }
              </Box>
              <Box sx={{margin: "10px", flexGrow: 0.5}}>
                <h3 style={{margin: "0px 0px 5px"}}>過去に解いて間違えた問題</h3>
                <hr/>
                { questionHistory.length === 0 && (<p>ありません。教材を解いてみてみましょう！</p>) }
                { questionHistory.length > 0 && (
                    <ul>
                        { questionHistory.slice(-6, -1).map((qh, i) => {
                            return (
                                <li key={`question_history_${i}`}>
                                    <Link to={`/explore/${qh.json}?questionId=${qh.questionId}&id=${qh.id}`}>
                                        {qh.json} <br/> {qh.questionString} (間違えた回数: {qh.failCount})
                                    </Link>
                                </li>
                            )
                        }) }
                    </ul>
                ) }
              </Box>
            </Box>
        </Box>
        <Box sx={{
          border: "1px solid #CCC",
          borderRadius: "10px",
          margin: "10px",
          padding: "10px",
          backgroundColor: "white",
          /*
          
            3段の横並び
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            row-gap: .5rem;
            column-gap: 1.25rem;

            margin: 0;
            padding-left: 1.2em;
          
          */
        }}>
          <ul style={{
            display: "grid",
            gridTemplateRows: "repeat(2, minmax(0, 1fr))",
            gridAutoFlow: "column",
            rowGap: ".5rem",
            columnGap: "1.25rem",
          }}>
            { info.map((i) => {
                return (
                <li style={{
                  listStylePosition: "outside"
                }}
                    key={`info_${i.json}`}
                >
                    <Link to={`/explore/${i.json}`}>
                    {Math.floor(questionSuccessHistory.filter((q) => {
                      return i.details.map((d) => d[0]).includes(q.questionId);
                    }).length / i.details.length * 100)}% {i.name}</Link>
                </li>
                )
            }) }
          </ul>
        </Box>
      </Box>
    </Box>
    )
}

export default TreeIndex;