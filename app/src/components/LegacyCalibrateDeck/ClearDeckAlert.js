// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { push } from 'connected-react-router'
import { deckCalibrationCommand as dcCommand } from '../../http-api-client'
import { ClearDeckAlertModal } from '../ClearDeckAlertModal'

import type { Dispatch } from '../../types'
import type { CalibrateDeckProps } from './types'

type OP = CalibrateDeckProps

type DP = {|
  onContinue: () => mixed,
  onCancel: () => mixed,
|}

type Props = {| ...OP, ...DP |}

export const ClearDeckAlert: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  _,
  DP,
  _,
  _
>(
  null,
  mapDispatchToProps
)(ClearDeckAlertComponent)

function ClearDeckAlertComponent(props: Props) {
  return (
    <ClearDeckAlertModal
      parentUrl={props.parentUrl}
      cancelText="cancel"
      continueText="move pipette to front"
      onCancelClick={props.onCancel}
      onContinueClick={props.onContinue}
    />
  )
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const {
    robot,
    match: { url },
  } = ownProps

  return {
    onContinue: () => {
      dispatch(dcCommand(robot, { command: 'move', point: 'attachTip' }))
      dispatch(push(`${url}/step-1`))
    },
    onCancel: () => dispatch(dcCommand(robot, { command: 'release' })),
  }
}
