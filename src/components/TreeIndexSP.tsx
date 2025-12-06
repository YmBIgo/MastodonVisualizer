import { Box, Button } from "@mui/material";
import type { Info } from "../type/Info";
import { Link } from "react-router";

type Props = {
    info: Info;
}

const TreeIndex: React.FC<Props> = ({
    info
}) => {
    return (
    <Box sx={{
      minWidth: "300px",
      width: "auto"
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
            <h3 style={{margin: "0px 0px 5px"}}>このサイトは何か？</h3>
            <hr/>
            <p>
                Mastodonのソースコードを解析して、各機能がどのように実装されているかを可視化したサイトです。
                <br/>
                以下のVSCode拡張機能を使って、再現できるように可視化した。
                <br/>
                <Button
                    href="https://marketplace.visualstudio.com/items?itemName=coffeecupjapan.ruby-reader-ja&ssr=false#overview"
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
                <p>何か問題がありましたら、メールアドレス coffeecupjapan[a]yahoo.co.jp（[a]を@に変換してください）まで連絡ください</p>
            </p>
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
            gridTemplateRows: "repeat(1, minmax(0, 1fr))",
            gridAutoFlow: "row",
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
                    <Link to={`/trees/${i.json}`}>{i.name}</Link>
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