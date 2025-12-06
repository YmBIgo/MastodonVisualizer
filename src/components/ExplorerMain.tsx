import { useMediaQuery } from "@mui/material";
import type { Info } from "../type/Info";
import Explorer from "./Explorer";
import ExplorerSP from "./ExplorerSP";

type Props = {
    info: Info;
}

const ExplorerMain: React.FC<Props> = ({
    info
}) => {
    const isPC: boolean = useMediaQuery("(min-width:800px)");
    return (
        <>
            { isPC
                ? <Explorer info={info}/>
                : <ExplorerSP info={info}/>
            }
        </>
    )
}

export default ExplorerMain;