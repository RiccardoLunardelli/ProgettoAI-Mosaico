import { lazy, Suspense, useState } from "react";

const HomeManagerPageTag = lazy(() => import("./HomeManagerPage"))
const NoEnrichListPageTag = lazy(() => import("./NoEnrichListPage"))
const EnrichListPageTag = lazy(() => import("./EnrichListPage"))

export type WhatIsSelcted = "enrich" | "noEnrich" | "home";

interface ComponentStateInterface {
  whatIsSelected: WhatIsSelcted;
}

function DeviceListPageManagerTag() {
  const [componentState, setComponentState] = useState<ComponentStateInterface>(
    {
      whatIsSelected: "home",
    },
  );

  function WhereImGoingOnClickCallback(whereImGoing: WhatIsSelcted) {
    setComponentState((previousStateVal: ComponentStateInterface) => {
      return {
        ...previousStateVal,
        whatIsSelected: whereImGoing
      };
    });
  }

  return (
    <>
      {componentState.whatIsSelected == "home" ? (
        <Suspense fallback="">
          <HomeManagerPageTag clickCallBack={WhereImGoingOnClickCallback}/>
        </Suspense>
      ) : (
        <></>
      )}

      {componentState.whatIsSelected == "enrich" ? (
        <Suspense fallback="">
          <EnrichListPageTag clickCallBack={WhereImGoingOnClickCallback} />
        </Suspense>
      ) : (
        <></>
      )}

      {componentState.whatIsSelected == "noEnrich" ? (
        <Suspense fallback="">
          <NoEnrichListPageTag clickCallBack={WhereImGoingOnClickCallback}/>
        </Suspense>
      ) : (
        <></>
      )}
    </>
  );
}

export default DeviceListPageManagerTag;
