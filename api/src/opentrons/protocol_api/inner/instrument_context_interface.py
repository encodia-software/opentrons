from abc import ABC, abstractmethod
from typing import (Any, Dict, List, Sequence, Union)


from opentrons import types
from opentrons.protocol_api.util import (FlowRates, PlungerSpeeds, Clearances)
from opentrons.protocols.types import APIVersion
from opentrons.protocol_api.labware import (Labware, Well)


AdvancedLiquidHandling = Union[
    Well,
    types.Location,
    List[Union[Well, types.Location]],
    List[List[Well]]]


VALID_PIP_TIPRACK_VOL = {
    'p10': [10, 20],
    'p20': [10, 20],
    'p50': [200, 300],
    'p300': [200, 300],
    'p1000': [1000]
}


class InstrumentContextInterface(ABC):
    """ A context for a specific pipette or instrument.

    This can be used to call methods related to pipettes - moves or
    aspirates or dispenses, or higher-level methods.

    Instances of this class bundle up state and config changes to a
    pipette - for instance, changes to flow rates or trash containers.
    Action methods (like :py:meth:`aspirate` or :py:meth:`distribute`) are
    defined here for convenience.

    In general, this class should not be instantiated directly; rather,
    instances are returned from :py:meth:`ProtocolContext.load_instrument`.

    .. versionadded:: 2.0

    """

    @property
    @abstractmethod
    def api_version(self) -> APIVersion:
        ...

    @property
    @abstractmethod
    def starting_tip(self) -> Union[Well, None]:
        ...

    @starting_tip.setter
    @abstractmethod
    def starting_tip(self, location: Union[Well, None]):
        ...

    @abstractmethod
    def reset_tipracks(self):
        ...

    @property
    @abstractmethod
    def default_speed(self) -> float:
        ...

    @default_speed.setter
    @abstractmethod
    def default_speed(self, speed: float):
        ...

    @abstractmethod
    def aspirate(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def dispense(self,
                 volume: float = None,
                 location: Union[types.Location, Well] = None,
                 rate: float = 1.0) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def mix(self,
            repetitions: int = 1,
            volume: float = None,
            location: Union[types.Location, Well] = None,
            rate: float = 1.0) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def blow_out(self,
                 location: Union[types.Location, Well] = None
                 ) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def touch_tip(self,
                  location: Well = None,
                  radius: float = 1.0,
                  v_offset: float = -1.0,
                  speed: float = 60.0) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def air_gap(self,
                volume: float = None,
                height: float = None) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def return_tip(self, home_after: bool = True) -> \
            'InstrumentContextInterface':
        ...

    @abstractmethod
    def pick_up_tip(self,
                    location: Union[types.Location, Well] = None,
                    presses: int = None,
                    increment: float = None) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def drop_tip(self,
                 location: Union[types.Location, Well] = None,
                 home_after: bool = True)\
            -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def home(self) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def home_plunger(self) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def distribute(self,
                   volume: float,
                   source: Well,
                   dest: List[Well],
                   *args, **kwargs) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def consolidate(self,
                    volume: float,
                    source: List[Well],
                    dest: Well,
                    *args, **kwargs) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def transfer(self,
                 volume: Union[float, Sequence[float]],
                 source: AdvancedLiquidHandling,
                 dest: AdvancedLiquidHandling,
                 trash=True,
                 **kwargs) -> 'InstrumentContextInterface':
        ...

    @abstractmethod
    def delay(self):
        ...

    @abstractmethod
    def move_to(self, location: types.Location, force_direct: bool = False,
                minimum_z_height: float = None,
                speed: float = None
                ) -> 'InstrumentContextInterface':
        ...

    @property
    @abstractmethod
    def mount(self) -> str:
        ...

    @property
    @abstractmethod
    def speed(self) -> 'PlungerSpeeds':
        ...

    @property
    @abstractmethod
    def flow_rate(self) -> 'FlowRates':
        ...

    @property
    @abstractmethod
    def type(self) -> str:
        ...

    @property
    @abstractmethod
    def tip_racks(self) -> List[Labware]:
        ...

    @tip_racks.setter
    @abstractmethod
    def tip_racks(self, racks: List[Labware]):
        ...

    @property
    @abstractmethod
    def trash_container(self) -> Labware:
        ...

    @trash_container.setter
    @abstractmethod
    def trash_container(self, trash: Labware):
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def model(self) -> str:
        ...

    @property
    @abstractmethod
    def min_volume(self) -> float:
        ...

    @property
    @abstractmethod
    def max_volume(self) -> float:
        ...

    @property
    @abstractmethod
    def current_volume(self) -> float:
        ...

    @property
    @abstractmethod
    def hw_pipette(self) -> Dict[str, Any]:
        ...

    @property
    @abstractmethod
    def channels(self) -> int:
        ...

    @property
    @abstractmethod
    def return_height(self) -> int:
        ...

    @property
    @abstractmethod
    def well_bottom_clearance(self) -> 'Clearances':
        ...
