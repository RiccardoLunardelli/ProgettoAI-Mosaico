import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRouteAdmin() {
  const userInfo = useSelector((state: any) => state.userInfoSlice);

  const isAdmin = userInfo?.role !== 1;
  // oppure:
  // const isAdmin = userInfo?.is_admin === true;

  if (!isAdmin) {
    return <Navigate to="/Home" replace />;
  }

  return <Outlet />;
}