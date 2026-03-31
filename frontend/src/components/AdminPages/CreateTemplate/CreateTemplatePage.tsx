import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DynamicTemplateFormTag from "../../DynamicTemplateForm/DynamicTemplateForm";
import SelectSchemaBeforeSaveModalTag from "./SelectSchemaBeforeSaveModal";

import {
  CreateTemplateAPIHook,
  GetSchemasListAPIHook,
} from "../../../customHooks/API/CreateTemplate/CreateTemplateAPI";

import { SetInputSlice } from "../../../stores/slices/Base/inputSlice";
import {
  GetLastTemplateBaseAPIHook,
  UpdateTemplateBasePatchAPIHook,
} from "../../../customHooks/API/TemplateBase/templateBaseAPI";
import type { SchemasListSliceInterface } from "../../../stores/slices/Base/createTemplateSlice";

function CreateTemplatePageTag() {
  const dispatch = useDispatch();

  const [CreateTemplateAPI] = CreateTemplateAPIHook();
  const [GetSchemasListAPI] = GetSchemasListAPIHook();
  const [GetLastTemplateBaseAPI] = GetLastTemplateBaseAPIHook();
  const [UpdateTemplateBasePatchAPI] = UpdateTemplateBasePatchAPIHook();

  const [templateValue, setTemplateValue] = useState<Record<string, any>>({});

  const [componentState, setComponentState] = useState<{
    showSchemaModal: boolean;
    pendingTemplateValue: Record<string, any> | null;
  }>({
    showSchemaModal: false,
    pendingTemplateValue: null,
  });

  const createTemplateSlice: {
    schema: any;
    list: SchemasListSliceInterface[];
  } = useSelector(
    (state: {
      createTemplateSlice: { schema: any; list: SchemasListSliceInterface[] };
    }) => state.createTemplateSlice,
  );

  const inputSliceValue: Record<string, string> = useSelector((state: any) => {
    return state.inputSlice?.value ?? {};
  });

  useEffect(() => {
    dispatch(SetInputSlice({ id: "TemplateBasePatch-TextArea", value: "" }));

    GetSchemasListAPI({
      showLoader: true,
      saveResponse: true,
    });
  }, []);

  const handleOpenSchemaModal = (val: Record<string, any>) => {
    setComponentState({
      showSchemaModal: true,
      pendingTemplateValue: val,
    });
  };

  const handleCloseSchemaModal = () => {
    setComponentState({
      showSchemaModal: false,
      pendingTemplateValue: null,
    });
  };

  const handleCreateTemplate = (
    templateToSave: Record<string, any>,
    schemaId: string,
  ) => {
    CreateTemplateAPI({
      showLoader: true,
      showToast: true,
      saveResponse: false,
      data: {
        Template: templateToSave,
        Schema_id: schemaId,
      },
      EndCallback: () => {
        handleCloseSchemaModal();
      },
    });
  };

  const handleConfirmSchemaSelection = (schemaId: string) => {
    if (!componentState.pendingTemplateValue) return;

    const patchRawValue = inputSliceValue["TemplateBasePatch-TextArea"] ?? "";
    const hasPatch = patchRawValue.trim() !== "";

    const runCreate = () => {
      handleCreateTemplate(
        componentState.pendingTemplateValue as Record<string, any>,
        schemaId,
      );
    };

    if (!hasPatch) {
      runCreate();
      return;
    }

    let parsedPatchJson: Record<string, any> = {};

    try {
      parsedPatchJson = JSON.parse(patchRawValue);
    } catch {
      console.error("Patch JSON non valido");
      runCreate(); // fallback comunque crea
      return;
    }

    GetLastTemplateBaseAPI({
      showLoader: true,
      saveResponse: false,
      EndCallback: (returnValue) => {
        const lastId = returnValue?.message;

        if (!lastId) {
          runCreate();
          return;
        }

        UpdateTemplateBasePatchAPI({
          showLoader: true,
          showToast: true,
          saveResponse: false,
          data: {
            id: lastId,
            validate_only: false,
            patch_json: parsedPatchJson,
          },
          EndCallback: () => {
            runCreate(); 
          },
        });
      },
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <DynamicTemplateFormTag
        schema={createTemplateSlice.schema}
        value={templateValue}
        onChange={(newValue) => {
          setTemplateValue(newValue);
        }}
        onSave={(val) => {
          handleOpenSchemaModal(val);
        }}
      />

      <SelectSchemaBeforeSaveModalTag
        open={componentState.showSchemaModal}
        schemasList={createTemplateSlice?.list ?? []}
        onClose={handleCloseSchemaModal}
        onConfirm={handleConfirmSchemaSelection}
      />
    </div>
  );
}

export default CreateTemplatePageTag;
