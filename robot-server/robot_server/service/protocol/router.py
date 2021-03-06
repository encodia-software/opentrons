import logging
import typing

from starlette import status as http_status_codes
from fastapi import APIRouter, UploadFile, File, Depends, Body

from robot_server.service.protocol import models as route_models
from robot_server.service.dependencies import get_protocol_manager
from robot_server.service.protocol.manager import ProtocolManager
from robot_server.service.protocol.protocol import UploadedProtocol

log = logging.getLogger(__name__)


router = APIRouter()


@router.post("/protocols",
             description="Create a protocol",
             response_model_exclude_unset=True,
             response_model=route_models.ProtocolResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol(
        protocol_file: UploadFile = File(..., description="The protocol file"),
        support_files: typing.List[UploadFile] = Body(
            default=list(),
            description="Any support files needed by the protocol (ie data "
                        "files, additional python files)"),
        protocol_manager=Depends(get_protocol_manager)):
    """Create protocol from proto file plus optional support files"""
    new_proto = protocol_manager.create(protocol_file=protocol_file,
                                        support_files=support_files,)
    return route_models.ProtocolResponse(data=_to_response(new_proto))


@router.get("/protocols",
            description="Get all protocols",
            response_model_exclude_unset=True,
            response_model=route_models.MultiProtocolResponse)
async def get_protocols(
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    return route_models.MultiProtocolResponse(
        data=[_to_response(u) for u in protocol_manager.get_all()]
    )


@router.get("/protocols/{protocol_id}",
            description="Get a protocol",
            response_model_exclude_unset=True,
            response_model=route_models.ProtocolResponse)
async def get_protocol(
        protocol_id: str,
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    proto = protocol_manager.get(protocol_id)
    return route_models.ProtocolResponse(data=_to_response(proto))


@router.delete("/protocols/{protocol_id}",
               description="Delete a protocol",
               response_model_exclude_unset=True,
               response_model=route_models.ProtocolResponse)
async def delete_protocol(
        protocol_id: str,
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    proto = protocol_manager.remove(protocol_id)
    return route_models.ProtocolResponse(data=_to_response(proto))


@router.post("/protocols/{protocol_id}",
             description="Add a file to protocol",
             response_model_exclude_unset=True,
             response_model=route_models.ProtocolResponse,
             status_code=http_status_codes.HTTP_201_CREATED)
async def create_protocol_file(
        protocol_id: str,
        file: UploadFile = File(...),
        protocol_manager: ProtocolManager = Depends(get_protocol_manager)):
    proto = protocol_manager.get(protocol_id)
    proto.add(file)
    return route_models.ProtocolResponse(data=_to_response(proto))


def _to_response(uploaded_protocol: UploadedProtocol) \
        -> route_models.ProtocolResponseDataModel:
    """Create ProtocolResponse from an UploadedProtocol"""
    meta = uploaded_protocol.meta
    return route_models.ProtocolResponseDataModel.create(
        attributes=route_models.ProtocolResponseAttributes(
            protocolFile=route_models.FileAttributes(
                basename=meta.protocol_file.path.name
            ),
            supportFiles=[route_models.FileAttributes(
                basename=s.path.name
            ) for s in meta.support_files],
            lastModifiedAt=meta.last_modified_at,
            createdAt=meta.created_at
        ),
        resource_id=meta.identifier
    )
