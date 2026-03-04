import { useNavigate } from "react-router-dom";
import {
  SetUserInfoSlice,
  type UserInfoInterface,
} from "../../stores/slices/Base/userInfoSlice";
import { useDispatch } from "react-redux";
import { SetAuthCheckSlice } from "../../stores/slices/Auth/authCheckSlice";

const SetAuthHook = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  //Metodo per impostare SetAuthCheckSlice
  const SetAuth = (
    isAuth: boolean,
    userInfo: UserInfoInterface | null = null,
  ) => {
    dispatch(SetAuthCheckSlice(isAuth));

    //Controllo se isAuth è false
    if (!isAuth) {
      //Imposta userinfo null
      SetUserInfo(null);
      //Si ferma qua
      return;
    }

    //Se invece è valorizzato

    //Imposta userInfo
    SetUserInfo(userInfo);
    navigate("/");
  };

  //Metodo per impostare SetUserInfoSlice
  const SetUserInfo = (newUserInfo: UserInfoInterface | null) => {
    dispatch(SetUserInfoSlice(newUserInfo));
  };

  return { SetAuth };
};

export { SetAuthHook };
