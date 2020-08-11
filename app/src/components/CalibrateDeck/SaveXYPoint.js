// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'

import * as Sessions from '../../sessions'
import type { JogAxis, JogDirection, JogStep } from '../../http-api-client'
import type { CalibrateDeckChildProps } from './types'
import { JogControls } from '../JogControls'
import { formatJogVector } from './utils'
import styles from './styles.css'

import slot1LeftMultiDemoAsset from './videos/SLOT_1_LEFT_MULTI_X-Y.webm'
import slot1LeftSingleDemoAsset from './videos/SLOT_1_LEFT_SINGLE_X-Y.webm'
import slot1RightMultiDemoAsset from './videos/SLOT_1_RIGHT_MULTI_X-Y.webm'
import slot1RightSingleDemoAsset from './videos/SLOT_1_RIGHT_SINGLE_X-Y.webm'
import slot3LeftMultiDemoAsset from './videos/SLOT_3_LEFT_MULTI_X-Y.webm'
import slot3LeftSingleDemoAsset from './videos/SLOT_3_LEFT_SINGLE_X-Y.webm'
import slot3RightMultiDemoAsset from './videos/SLOT_3_RIGHT_MULTI_X-Y.webm'
import slot3RightSingleDemoAsset from './videos/SLOT_3_RIGHT_SINGLE_X-Y.webm'
import slot7LeftMultiDemoAsset from './videos/SLOT_7_LEFT_MULTI_X-Y.webm'
import slot7LeftSingleDemoAsset from './videos/SLOT_7_LEFT_SINGLE_X-Y.webm'
import slot7RightMultiDemoAsset from './videos/SLOT_7_RIGHT_MULTI_X-Y.webm'
import slot7RightSingleDemoAsset from './videos/SLOT_7_RIGHT_SINGLE_X-Y.webm'

const assetMap = {
  '1': {
    left: {
      multi: slot1LeftMultiDemoAsset,
      single: slot1LeftSingleDemoAsset,
    },
    right: {
      multi: slot1RightMultiDemoAsset,
      single: slot1RightSingleDemoAsset,
    },
  },
  '3': {
    left: {
      multi: slot3LeftMultiDemoAsset,
      single: slot3LeftSingleDemoAsset,
    },
    right: {
      multi: slot3RightMultiDemoAsset,
      single: slot3RightSingleDemoAsset,
    },
  },
  '7': {
    left: {
      multi: slot7LeftMultiDemoAsset,
      single: slot7LeftSingleDemoAsset,
    },
    right: {
      multi: slot7RightMultiDemoAsset,
      single: slot7RightSingleDemoAsset,
    },
  },
}

const SAVE_XY_POINT_HEADER = 'Save X and Y-axis offset in'
const SLOT = 'slot'
const JOG_UNTIL = 'Jog the robot until the tip is'
const PRECISELY_CENTERED = 'precisely centered'
const ABOVE_THE_CROSS = 'above the cross in'
const THEN = 'Then press the'
const SAVE_POINT = 'save x and y-axis'
const TO_SAVE =
  'button to determine how this position compares to the previously-saved x and y-axis calibration coordinates.'

export function SaveXYPoint(props: CalibrateDeckChildProps): React.Node {
  const { isMulti, mount, sendSessionCommand } = props

  // TODO: IMMEDIATELY figure out whether to map step to slots here or in parent
  const slotNumber = '1'
  // TODO: IMMEDIATELY similarly to map step to proceed command here or in parent
  const proceedCommand = Sessions.deckCalCommands.MOVE_TO_POINT_TWO

  const demoAsset = React.useMemo(
    () =>
      slotNumber && assetMap[slotNumber][mount][isMulti ? 'multi' : 'single'],
    [slotNumber, mount, isMulti]
  )

  const jog = (axis: JogAxis, dir: JogDirection, step: JogStep) => {
    sendSessionCommand(
      Sessions.deckCalCommands.JOG,
      {
        vector: formatJogVector(axis, dir, step),
      },
      false
    )
  }

  const savePoint = () => {
    sendSessionCommand(Sessions.deckCalCommands.SAVE_OFFSET)
    sendSessionCommand(proceedCommand)
  }

  return (
    <>
      <div className={styles.modal_header}>
        <h3>
          {SAVE_XY_POINT_HEADER}
          &nbsp;
          {`${SLOT} ${slotNumber || ''}`}
        </h3>
      </div>
      <div className={styles.step_check_wrapper}>
        <div className={styles.step_check_body_wrapper}>
          <p className={styles.tip_pick_up_demo_body}>
            {JOG_UNTIL}
            <b>&nbsp;{PRECISELY_CENTERED}&nbsp;</b>
            {ABOVE_THE_CROSS}
            <b>&nbsp;{`${SLOT} ${slotNumber || ''}`}.&nbsp;</b>
            <br />
            <br />
            {THEN}
            <b>&nbsp;{SAVE_POINT}&nbsp;</b>
            {TO_SAVE}
          </p>
        </div>
        <div className={styles.step_check_video_wrapper}>
          <video
            key={String(demoAsset)}
            className={styles.step_check_video}
            autoPlay={true}
            loop={true}
            controls={false}
          >
            <source src={demoAsset} />
          </video>
        </div>
      </div>
      <div className={styles.tip_pick_up_controls_wrapper}>
        <JogControls jog={jog} stepSizes={[0.1, 1]} axes={['x', 'y']} />
      </div>
      <div className={styles.button_row}>
        <PrimaryButton onClick={savePoint} className={styles.command_button}>
          {SAVE_POINT}
        </PrimaryButton>
      </div>
    </>
  )
}
