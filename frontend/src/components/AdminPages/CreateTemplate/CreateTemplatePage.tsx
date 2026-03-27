import { useState } from "react";
import DynamicTemplateFormTag from "../../DynamicTemplateForm/DynamicTemplateForm";
import { CreateTemplateAPIHook } from "../../../customHooks/API/CreateTemplate/CreateTemplateAPI";
import { useSelector } from "react-redux";

function CreateTemplatePageTag() {
  const [CreateTemplateAPI] = CreateTemplateAPIHook();

  const [templateValue, setTemplateValue] = useState({});

  const createTemplateSlice: { schema: any } = useSelector(
    (state: { createTemplateSlice: { schema: any[] } }) =>
      state.createTemplateSlice,
  );


  return (
    <div style={{ padding: "20px" }}>
      <DynamicTemplateFormTag
        schema={createTemplateSlice.schema}
        value={templateValue}
        onChange={(newValue) => {
          setTemplateValue(newValue);
        }}
        onSave={(val) => {
          CreateTemplateAPI({
            showLoader: true,
            showToast: true,
            saveResponse: false,
            data: { createTemplate: val },
          });
        }}
      />
    </div>
  );
}

export default CreateTemplatePageTag;
