class ContinuosReadsProps:

    def properties_continuosreads_with_alias():
        return {
            "Enable": "Checkbox",
            "MultiLanguageDescription": "TextMultilanguage",
            "TroubleSettings": "ListSettings",
            "Name": "TextReadOnly",
            "Alias": "TextReadOnly",
            "Description": "TextReadOnly",
            "Type": "Nothing",
            "Measurement": "Text",
            "ShowIndexPage": "Checkbox",
            "HTMLViewEnable": "Enumerator",
            "HTMLViewCategory": "TextMultilanguage",
            "HTMLViewIndexPosition": "Number",
            "HTMLMaskValue": "MaskValue"  
        }
    
    def properties_continuosreads_without_alias():
        return {
            "Enable": "Checkbox",
            "MultiLanguageDescription": "TextMultilanguage",
            "TroubleSettings": "ListSettings",
            "Name": "TextReadOnly",
            "Description": "TextReadOnly",
            "Type": "Nothing",
            "Measurement": "Text",
            "ShowIndexPage": "Checkbox",
            "HTMLViewEnable": "Enumerator",
            "HTMLViewCategory": "TextMultilanguage",
            "HTMLViewIndexPosition": "Number",
            "HTMLMaskValue": "MaskValue"
        }

    def build_continuos_read(enable, MultiLanguagedescription, TroubleSettings, name, alias, description, Type, measurement, ShowIndexPage, HTMLViewEnable, HTMLViewCategory, HTMLViewIndexPosition, HTMLMaskValue):
        # costruisce sezione continuos reads

        if alias is not None:
            return {
                "Enable": enable,
                "MultiLanguageDescription": MultiLanguagedescription,
                "TroubleSettings": TroubleSettings,
                "Name": name,
                "Alias": alias,
                "Description": description,
                "Type": Type,
                "Measurement": measurement,
                "ShowIndexPage": ShowIndexPage,
                "HTMLViewEnable": HTMLViewEnable,
                "HTMLViewCategory": HTMLViewCategory,
                "HTMLViewIndexPosition": HTMLViewIndexPosition,
                "HTMLMaskValue": HTMLMaskValue,
            }
        else:
            return {
                "Enable": enable,
                "MultiLanguageDescription": MultiLanguagedescription,
                "TroubleSettings": TroubleSettings,
                "Name": name,
                "Description": description,
                "Type": Type,
                "Measurement": measurement,
                "ShowIndexPage": ShowIndexPage,
                "HTMLViewEnable": HTMLViewEnable,
                "HTMLViewCategory": HTMLViewCategory,
                "HTMLViewIndexPosition": HTMLViewIndexPosition,
                "HTMLMaskValue": HTMLMaskValue,
            }
    
class ParametersProps:

    def properties_parameters_with_alias():
        return {
            "Label": "Text",
            "Category": "Text",
            "Default": "Text",
            "Visibility": "Text",
            "AccessLevel": "Number",
            "AccessWriteLevel": "Number",
            "Enable": "Checkbox",
            "MultiLanguageDescription": "TextMultilanguage",
            "TroubleSettings": "ListSettings",
            "Name": "TextReadOnly",
            "Alias": "TextReadOnly",
            "Description": "TextReadOnly",
            "Type": "Nothing",
            "Measurement": "Text",
            "ShowIndexPage": "Checkbox",
            "HTMLViewEnable": "Enumerator",
            "HTMLViewCategory": "TextMultilanguage",
            "HTMLViewIndexPosition": "Number",
            "HTMLMaskValue": "MaskValue"
        }

    def properties_parameters_without_alias():
        return {
            "Label": "Text",
            "Category": "Text",
            "Default": "Text",
            "Visibility": "Text",
            "AccessLevel": "Number",
            "AccessWriteLevel": "Number",
            "Enable": "Checkbox",
            "MultiLanguageDescription": "TextMultilanguage",
            "TroubleSettings": "ListSettings",
            "Name": "TextReadOnly",
            "Description": "TextReadOnly",
            "Type": "Nothing",
            "Measurement": "Text",
            "ShowIndexPage": "Checkbox",
            "HTMLViewEnable": "Enumerator",
            "HTMLViewCategory": "TextMultilanguage",
            "HTMLViewIndexPosition": "Number",
            "HTMLMaskValue": "MaskValue"
        }
    
    def build_parameters(label, category, default, visibility, accessLevel, accessWriteLevel, enable, MultiLanguagedescription, TroubleSettings, name, alias, description, Type, measurement, ShowIndexPage, HTMLViewEnable, HTMLViewCategory, HTMLViewIndexPosition, HTMLMaskValue):

        if alias is not None:
            return {
                "Label": label,
                "Category": category,
                "Default": default,
                "Visibility": visibility,
                "AccessLevel": accessLevel,
                "AccessWriteLevel": accessWriteLevel,
                "Enable": enable,
                "MultiLanguageDescription": MultiLanguagedescription,
                "TroubleSettings": TroubleSettings,
                "Name": name,
                "Alias": alias,
                "Description": description,
                "Type": Type,
                "Measurement": measurement,
                "ShowIndexPage": ShowIndexPage,
                "HTMLViewEnable": HTMLViewEnable,
                "HTMLViewCategory": HTMLViewCategory,
                "HTMLViewIndexPosition": HTMLViewIndexPosition,
                "HTMLMaskValue": HTMLMaskValue
            }
        else:
            return {
                "Label": label,
                "Category": category,
                "Default": default,
                "Visibility": visibility,
                "AccessLevel": accessLevel,
                "AccessWriteLevel": accessWriteLevel,
                "Enable": enable,
                "MultiLanguageDescription": MultiLanguagedescription,
                "TroubleSettings": TroubleSettings,
                "Name": name,
                "Description": description,
                "Type": Type,
                "Measurement": measurement,
                "ShowIndexPage": ShowIndexPage,
                "HTMLViewEnable": HTMLViewEnable,
                "HTMLViewCategory": HTMLViewCategory,
                "HTMLViewIndexPosition": HTMLViewIndexPosition,
                "HTMLMaskValue": HTMLMaskValue
            }
        
class CommandsProps:
    
    def commands_parameters_with_alias():
        return {
            "ValueCommand": "Text",
            "AccessWriteLevel": "Number",
            "Enable": "Checkbox",
            "MultiLanguageDescription": "TextMultilanguage",
            "TroubleSettings": "ListSettings",
            "Name": "TextReadOnly",
            "Alias": "TextReadOnly",
            "Description": "TextReadOnly",
            "Type": "Nothing",
            "Measurement": "Text",
            "ShowIndexPage": "Checkbox",
            "HTMLViewEnable": "Enumerator",
            "HTMLViewCategory": "TextMultilanguage",
            "HTMLViewIndexPosition": "Number",
            "HTMLMaskValue": "MaskValue"
        }

    def commands_parameters_without_alias():
        return {
            "ValueCommand": "Text",
            "AccessWriteLevel": "Number",
            "Enable": "Checkbox",
            "MultiLanguageDescription": "TextMultilanguage",
            "TroubleSettings": "ListSettings",
            "Name": "TextReadOnly",
            "Description": "TextReadOnly",
            "Type": "Nothing",
            "Measurement": "Text",
            "ShowIndexPage": "Checkbox",
            "HTMLViewEnable": "Enumerator",
            "HTMLViewCategory": "TextMultilanguage",
            "HTMLViewIndexPosition": "Number",
            "HTMLMaskValue": "MaskValue"
        }
    
    def build_commands(valueCommand, accessWriteLevel, enable, MultiLanguagedescription, TroubleSettings, name, alias, description, Type, measurement, ShowIndexPage, HTMLViewEnable, HTMLViewCategory, HTMLViewIndexPosition, HTMLMaskValue):
        if alias is not None:
            return {    
                "ValueCommand": valueCommand,
                "AccessWriteLevel": accessWriteLevel,
                "Enable": enable,
                "MultiLanguageDescription": MultiLanguagedescription,
                "TroubleSettings": TroubleSettings,
                "Name": name,
                "Alias": alias,
                "Description": description,
                "Type": Type,
                "Measurement": measurement,
                "ShowIndexPage": ShowIndexPage,
                "HTMLViewEnable": HTMLViewEnable,
                "HTMLViewCategory": HTMLViewCategory,
                "HTMLViewIndexPosition": HTMLViewIndexPosition,
                "HTMLMaskValue": HTMLMaskValue
            }
        else:
            return {
                "ValueCommand": valueCommand,
                "AccessWriteLevel": accessWriteLevel,
                "Enable": enable,
                "MultiLanguageDescription": MultiLanguagedescription,
                "TroubleSettings": TroubleSettings,
                "Name": name,
                "Description": description,
                "Type": Type,
                "Measurement": measurement,
                "ShowIndexPage": ShowIndexPage,
                "HTMLViewEnable": HTMLViewEnable,
                "HTMLViewCategory": HTMLViewCategory,
                "HTMLViewIndexPosition": HTMLViewIndexPosition,
                "HTMLMaskValue": HTMLMaskValue
            }