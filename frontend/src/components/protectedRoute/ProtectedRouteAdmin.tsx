import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { SetCurrentPathSlice } from "../../stores/slices/Base/currentPath";

function ProtectedRouteAdmin() {
  const dispatch = useDispatch();
  
  const userInfo = useSelector((state: any) => state.userInfoSlice.value);

  const authCheck: string | null = useSelector(
    (state: {
      authCheckSlice: {
        value: string | null;
      };
    }) => state.authCheckSlice.value,
  );

  const isAdmin = userInfo?.role == 1;



  console.log("sono admin", isAdmin)

  if (!isAdmin) {
    dispatch(SetCurrentPathSlice(null));

    if(authCheck == "") {
        return <Navigate to="/Login" replace />;
    }

    return <Navigate to="/Home" replace />;
  }

  return <Outlet />;
}

export default ProtectedRouteAdmin