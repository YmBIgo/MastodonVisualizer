import { useMediaQuery } from "@mui/material";
import type { Info } from "../type/Info";
import TreeIndexSP from "./TreeIndexSP";
import TreeIndex from "./TreeIndex";

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
                ? <TreeIndex info={info}/>
                : <TreeIndexSP info={info}/>
            }
        </>
    )
}

export default TreeIndexMain;