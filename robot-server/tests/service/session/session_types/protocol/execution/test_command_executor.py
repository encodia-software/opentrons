from dataclasses import asdict
from unittest.mock import MagicMock, patch
import pytest

from robot_server.service.session.command_execution.command import Command,\
    CommandContent
from robot_server.service.session.errors import UnsupportedCommandException
from robot_server.service.session.models import ProtocolCommand, EmptyModel
from robot_server.service.session.session_types.protocol.execution.command_executor import ProtocolCommandExecutor  # noqa: E501
from robot_server.service.session.session_types.protocol.execution.worker import _Worker  # noqa:


@pytest.fixture()
def mock_worker():
    async def async_mock():
        pass

    m = MagicMock(spec=_Worker)
    m.handle_run.side_effect = async_mock
    m.handle_simulate.side_effect = async_mock
    m.handle_cancel.side_effect = async_mock
    m.handle_pause.side_effect = async_mock
    m.handle_resume.side_effect = async_mock
    m.close.side_effect = async_mock
    return m


@pytest.fixture
def protocol_command_executor(mock_worker):
    ProtocolCommandExecutor.create_worker = MagicMock(return_value=mock_worker)
    return ProtocolCommandExecutor(None, None)


@pytest.mark.parametrize(argnames="current_state,accepted_commands",
                         argvalues=[
                             ['loaded',
                              {ProtocolCommand.start_simulate,
                               ProtocolCommand.start_run}
                              ],
                             ['running',
                              {ProtocolCommand.cancel, ProtocolCommand.pause}
                              ],
                             ['finished',
                              {ProtocolCommand.start_simulate,
                               ProtocolCommand.start_run}
                              ],
                             ['stopped', {}],
                             ['paused',
                              {ProtocolCommand.cancel,
                               ProtocolCommand.resume}],
                             ['error', {}]
                         ])
async def test_command_state_reject(loop,
                                    current_state, accepted_commands,
                                    protocol_command_executor):
    """Test that commands are rejected based on state"""
    protocol_command_executor.current_state = current_state

    for protocol_command in ProtocolCommand:
        command = Command(content=CommandContent(
            name=protocol_command,
            data=EmptyModel())
        )
        if protocol_command in accepted_commands:
            # Will not raise if in accepted commands
            await protocol_command_executor.execute(command)
        else:
            with pytest.raises(UnsupportedCommandException):
                await protocol_command_executor.execute(command)


@pytest.mark.parametrize(argnames="command,worker_method_name",
                         argvalues=[
                             [ProtocolCommand.start_run, "handle_run"],
                             [ProtocolCommand.start_simulate, "handle_simulate"],  # noqa:
                             [ProtocolCommand.cancel, "handle_cancel"],
                             [ProtocolCommand.pause, "handle_pause"],
                             [ProtocolCommand.resume, "handle_resume"]
                         ])
async def test_execute(loop, command, worker_method_name,
                       protocol_command_executor, mock_worker):
    # Patch the state command filter to allow all commands
    with patch.object(ProtocolCommandExecutor,
                      "STATE_COMMAND_MAP",
                      new={protocol_command_executor.current_state: ProtocolCommand}):  # noqa:
        protocol_command = Command(content=CommandContent(
            name=command,
            data=EmptyModel())
        )
        await protocol_command_executor.execute(protocol_command)
        # Worker handler was called
        getattr(mock_worker, worker_method_name).assert_called_once()
        # Command is added to command list
        assert protocol_command_executor.commands == [asdict(protocol_command)]
