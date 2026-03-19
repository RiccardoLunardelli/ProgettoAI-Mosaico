import { useState } from "react";
import GraphHomePageTag from "./GraphHomePage";
import GraphPageTag from "./GraphPage";

export type WhatGraphSelected = "metrics" | "llm" | "";

function GraphPageManager() {
  const [whatIsSelected, setWhatIsSelected] = useState<WhatGraphSelected>("");

  return (
    <>
      {whatIsSelected === "" ? (
        <GraphHomePageTag
          clickCallBack={(whereImGoing: WhatGraphSelected) => {
            setWhatIsSelected(whereImGoing);
          }}
        />
      ) : (
        <GraphPageTag
          whatIsSelected={whatIsSelected}
          goBackCallBack={() => {
            setWhatIsSelected("");
          }}
        />
      )}
    </>
  );
}

export default GraphPageManager;