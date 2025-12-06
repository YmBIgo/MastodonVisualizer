import { useMediaQuery } from "@mui/material";
import type { Info } from "../type/Info";
import TreeShowSP from "./TreeShowSP";
import TreeShow from "./TreeShow";

type Props = {
    info: Info;
}


const TreeIndexMain: React.FC<Props> = ({
    info
}) => {
    const isPC: boolean = useMediaQuery("(min-width:800px)");
    return (
        <>
            { isPC
                ? <TreeShow info={info}/>
                : <TreeShowSP info={info}/>
            }
        </>
    )
}

export default TreeIndexMain;