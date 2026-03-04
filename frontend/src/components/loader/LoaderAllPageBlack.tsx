import { memo } from "react";
import "../../css/loader.css";

const LoaderAllPageBlackTag = memo(function LoaderAllPageBlackTag() {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner"></div>
    </div>
  );
});

export default LoaderAllPageBlackTag;