import { lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SetInputSlice } from "../../../../stores/slices/Base/inputSlice";

const InputTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Input })),
);
const PanelTag = lazy(() =>
  import("rsuite").then((module) => ({ default: module.Panel })),
);

const inputPrefix = "CreateTemplate";

interface InputSliceInterface {
  [key: string]: string;
}

function TemplateInfoTabTag() {
  const dispatch = useDispatch();

  const inputSlice: { value: InputSliceInterface } = useSelector(
    (state: { inputSlice: { value: InputSliceInterface } }) => state.inputSlice,
  );

  function HandleSetInput(inputId: string, value: string) {
    dispatch(
      SetInputSlice({
        id: inputId,
        value: value,
      }),
    );
  }

  return (
    <div style={{ paddingTop: "18px" }}>
      <Suspense fallback={<></>}>
        <PanelTag bordered header="Informazioni template">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <div style={labelStyle}>Author</div>
              <InputTag
                value={inputSlice.value[`${inputPrefix}-TemplateInfo-Author`] ?? ""}
                onChange={(value) =>
                  HandleSetInput(`${inputPrefix}-TemplateInfo-Author`, value)
                }
              />
            </div>

            <div>
              <div style={labelStyle}>Category</div>
              <InputTag
                value={inputSlice.value[`${inputPrefix}-TemplateInfo-Category`] ?? ""}
                onChange={(value) =>
                  HandleSetInput(`${inputPrefix}-TemplateInfo-Category`, value)
                }
              />
            </div>

            <div>
              <div style={labelStyle}>Name</div>
              <InputTag
                value={inputSlice.value[`${inputPrefix}-TemplateInfo-Name`] ?? ""}
                onChange={(value) =>
                  HandleSetInput(`${inputPrefix}-TemplateInfo-Name`, value)
                }
              />
            </div>

            <div>
              <div style={labelStyle}>Product</div>
              <InputTag
                value={inputSlice.value[`${inputPrefix}-TemplateInfo-Product`] ?? ""}
                onChange={(value) =>
                  HandleSetInput(`${inputPrefix}-TemplateInfo-Product`, value)
                }
              />
            </div>

            <div>
              <div style={labelStyle}>Version</div>
              <InputTag
                value={inputSlice.value[`${inputPrefix}-TemplateInfo-Version`] ?? ""}
                onChange={(value) =>
                  HandleSetInput(`${inputPrefix}-TemplateInfo-Version`, value)
                }
              />
            </div>
          </div>
        </PanelTag>
      </Suspense>
    </div>
  );
}

const labelStyle = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 500,
  marginBottom: "8px",
};

export default TemplateInfoTabTag;