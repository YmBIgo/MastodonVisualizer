import { BrowserRouter, Route, Routes } from "react-router";
import TreeShowMain from "./components/TreeShowMain";

import main from "./json/info.json";
import { convertInfo } from "./util/convertInfo";
import TreeIndexMain from "./components/TreeIndexMain";
import ExplorerMain from "./components/ExplorerMain";

const convertedInfo = convertInfo(main);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TreeIndexMain info={convertedInfo}/>}></Route>
        <Route path="/trees/:treeId" element={<TreeShowMain info={convertedInfo}/>}></Route>
        <Route path="/explore/:treeId" element={<ExplorerMain info={convertedInfo}/>}></Route>
      </Routes>
      <p>© 2025, <a href="https://x.com/mugcup55929" target="_blank">Kurihara Kazuya</a></p>
    </BrowserRouter>
  )
}

export default App
