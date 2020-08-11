import contextlib
import typing
from abc import ABC, abstractmethod

from opentrons import types
from opentrons.hardware_control import API
from opentrons.protocol_api import geometry, InstrumentContext
from opentrons.protocol_api.labware import Labware
from opentrons.protocol_api.module_geometry import ModuleGeometry
from opentrons.protocol_api.util import AxisMaxSpeeds
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api.module_contexts import (
    ModuleContext, MagneticModuleContext, TemperatureModuleContext,
    ThermocyclerContext)
from opentrons_shared_data.labware import LabwareDefinition

ModuleTypes = typing.Union[
    TemperatureModuleContext,
    MagneticModuleContext,
    ThermocyclerContext
]


class ProtocolContextInterface(ABC):

    @property
    @abstractmethod
    def api_version(self) -> APIVersion:
        ...

    @property
    @abstractmethod
    def bundled_data(self) -> typing.Dict[str, bytes]:
        ...

    @abstractmethod
    def cleanup(self):
        ...

    @property
    @abstractmethod
    def max_speeds(self) -> AxisMaxSpeeds:
        ...

    @abstractmethod
    def commands(self):
        ...

    @abstractmethod
    def clear_commands(self):
        ...

    @contextlib.contextmanager
    @abstractmethod
    def temp_connect(self, hardware: API):
        ...

    @abstractmethod
    def connect(self, hardware: API):
        ...

    @abstractmethod
    def disconnect(self):
        ...

    @abstractmethod
    def is_simulating(self) -> bool:
        ...

    @abstractmethod
    def load_labware_from_definition(self,
                                     labware_def: LabwareDefinition,
                                     location: types.DeckLocation,
                                     label: str = None,
                                     ) -> Labware:
        ...

    @abstractmethod
    def load_labware(self,
                     load_name: str,
                     location: types.DeckLocation,
                     label: str = None,
                     namespace: str = None,
                     version: int = None,
                     ) -> Labware:
        ...

    @abstractmethod
    def load_labware_by_name(self,
                             load_name: str,
                             location: types.DeckLocation,
                             label: str = None,
                             namespace: str = None,
                             version: int = 1
                             ) -> Labware:
        ...

    @property
    @abstractmethod
    def loaded_labwares(self) -> typing.Dict[int,
                                             typing.Union[
                                                 Labware,
                                                 ModuleGeometry
                                             ]]:
        ...

    @abstractmethod
    def load_module(self,
                    module_name: str,
                    location: typing.Optional[types.DeckLocation] = None,
                    configuration: str = None) -> ModuleTypes:
        ...

    @property
    @abstractmethod
    def loaded_modules(self) -> typing.Dict[int, ModuleContext]:
        ...

    @abstractmethod
    def load_instrument(self,
                        instrument_name: str,
                        mount: typing.Union[types.Mount, str],
                        tip_racks: typing.List[Labware] = None,
                        replace: bool = False) -> InstrumentContext:
        ...

    @property
    @abstractmethod
    def loaded_instruments(self) -> typing.Dict[str,
                                                typing.Optional[
                                                    InstrumentContext
                                                ]]:
        ...

    @abstractmethod
    def pause(self, msg=None):
        ...

    @abstractmethod
    def resume(self):
        ...

    @abstractmethod
    def comment(self, msg):
        ...

    @abstractmethod
    def delay(self, seconds=0, minutes=0, msg=None):
        ...

    @abstractmethod
    def home(self):
        ...

    @property
    @abstractmethod
    def location_cache(self) -> typing.Optional[types.Location]:
        ...

    @location_cache.setter
    @abstractmethod
    def location_cache(self, loc: typing.Optional[types.Location]):
        ...

    @property
    @abstractmethod
    def deck(self) -> geometry.Deck:
        ...

    @property
    @abstractmethod
    def fixed_trash(self) -> Labware:
        ...

    @abstractmethod
    def set_rail_lights(self, on: bool):
        ...

    @property
    @abstractmethod
    def rail_lights_on(self) -> bool:
        ...

    @property
    @abstractmethod
    def door_closed(self) -> bool:
        ...
