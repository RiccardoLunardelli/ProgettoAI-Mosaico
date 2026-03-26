from abc import ABC, abstractmethod
from typing import Any, Dict

from backend_api.schemas.admin import CreateTemplateAdmin
from backend_api.routes.admin.builder import builder_section

class TemplateBuilderBase(ABC):

    def build(self, payload: CreateTemplateAdmin) -> dict:
        sections = self.build_section(payload)
        return self.assemble(sections)

    @abstractmethod
    def build_section(self, payload: CreateTemplateAdmin) -> Dict[str, Any]:
        ...

    def assemble(self, sections: Dict[str, Any]) -> dict:
        return {**sections}
    
class DefaultTemplateBuilder(TemplateBuilderBase):
    
    def build_section(self, payload: CreateTemplateAdmin) -> Dict[str, Any]:
        return builder_section(payload)
