// @flow
import * as React from 'react'

import { AlertModal } from '@opentrons/components'

export type ConfirmExitModalProps = {|
  back: () => mixed,
  exit: () => mixed,
|}

const HEADING = 'Are you sure you want to exit?'
const GO_BACK = 'go back'
const EXIT = 'continue'
const WARNING =
  'Doing so will return the pipette tip and exit deck calibration.'

export function ConfirmExitModal(props: ConfirmExitModalProps): React.Node {
  const { back, exit } = props

  return (
    <AlertModal
      heading={HEADING}
      buttons={[
        { children: GO_BACK, onClick: back },
        { children: EXIT, onClick: exit },
      ]}
      alertOverlay
    >
      {WARNING}
    </AlertModal>
  )
}
