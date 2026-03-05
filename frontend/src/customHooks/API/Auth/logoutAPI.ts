import { useDispatch } from "react-redux";

import { apiDomainString } from "../../../commons/commonsVariables";
import type {
  ResponseMessageInterface,
} from "../../../commons/commonsInterfaces";
import {
  FetchMethodEnum,
  FetchResponseTypeEnum,
  ResultTypeEnum,
} from "../../../commons/commonsEnums";
import {
  CloseLoader,
} from "../../../stores/slices/Base/loaderSlice";
import { SetAuthHook } from "../SetAuthHook";

const LogoutAPIHook = () => {
  const dispatch = useDispatch();

  const { SetAuth } = SetAuthHook();

  const LogoutAPI = async (infoObj: {
    EndCallback?: (returnValue?: ResponseMessageInterface) => void;
    showLoader?: boolean;
  }) => {
    try {
      await fetch(apiDomainString + "/logout", {
        method: FetchMethodEnum.Post,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      SetAuth(false);
      
    } catch (err) {
      console.error("CheckAuth error:", err);

      SetAuth(false);

      if (infoObj.EndCallback) {
        infoObj.EndCallback({
          result: ResultTypeEnum.Error,
          message: err,
          messageType: FetchResponseTypeEnum.Json,
          otherResponseInfo: "",
        });
      }
    } finally {
      if (infoObj.showLoader) dispatch(CloseLoader());
    }
  };

  return [LogoutAPI];
};

export { LogoutAPIHook };
