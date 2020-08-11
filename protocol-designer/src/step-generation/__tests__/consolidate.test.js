// @flow
import { consolidate } from '../commandCreators/compound/consolidate'
import {
  ASPIRATE_OFFSET_FROM_BOTTOM_MM,
  blowoutHelper,
  DEFAULT_PIPETTE,
  delayWithOffset,
  DEST_LABWARE,
  DISPENSE_OFFSET_FROM_BOTTOM_MM,
  dropTipHelper,
  FIXED_TRASH_ID,
  getErrorResult,
  getFlowRateAndOffsetParams,
  getInitialRobotStateStandard,
  getRobotStatePickedUpTipStandard,
  getSuccessResult,
  makeAspirateHelper,
  makeContext,
  makeDispenseHelper,
  makeTouchTipHelper,
  pickUpTipHelper,
  SOURCE_LABWARE,
} from '../__fixtures__'
import type {
  AspirateParams,
  DispenseParams,
} from '@opentrons/shared-data/protocol/flowTypes/schemaV3'

const aspirateHelper = makeAspirateHelper()
const dispenseHelper = makeDispenseHelper()
const touchTipHelper = makeTouchTipHelper()
// TODO: Ian 2019-06-14 more elegant way to test the blowout offset calculation
const BLOWOUT_OFFSET_ANY: any = expect.any(Number)

function tripleMix(
  well: string,
  volume: number,
  params: $Shape<AspirateParams> | $Shape<DispenseParams>
) {
  return [
    aspirateHelper(well, volume, params),
    dispenseHelper(well, volume, params),
    aspirateHelper(well, volume, params),
    dispenseHelper(well, volume, params),
    aspirateHelper(well, volume, params),
    dispenseHelper(well, volume, params),
  ]
}

let invariantContext
let initialRobotState
let robotStatePickedUpOneTip
let mixinArgs

beforeEach(() => {
  invariantContext = makeContext()
  initialRobotState = getInitialRobotStateStandard(invariantContext)
  robotStatePickedUpOneTip = getRobotStatePickedUpTipStandard(invariantContext)

  mixinArgs = {
    // `volume` and `changeTip` should be explicit in tests,
    // those fields intentionally omitted from here
    ...getFlowRateAndOffsetParams(),
    stepType: 'consolidate',
    commandCreatorFnName: 'consolidate',
    name: 'Consolidate Test',
    description: 'test blah blah',
    pipette: DEFAULT_PIPETTE,

    sourceWells: ['A1', 'A2', 'A3', 'A4'],
    destWell: 'B1',
    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixFirstAspirate: null,
    aspirateDelay: null,
    dispenseDelay: null,
    aspirateAirGapVolume: null,
    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,
  }
})

describe('consolidate single-channel', () => {
  it('Minimal single-channel: A1 A2 to B1, 50uL with p300', () => {
    const data = {
      ...mixinArgs,
      sourceWells: ['A1', 'A2'],
      volume: 50,
      changeTip: 'once',
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 50),
      aspirateHelper('A2', 50),
      dispenseHelper('B1', 100),
    ])
  })

  it('Single-channel with exceeding pipette max: A1 A2 A3 A4 to B1, 150uL with p300', () => {
    // TODO Ian 2018-05-03 is this a duplicate of exceeding max with changeTip="once"???
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'once',
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])
  })

  it('Single-channel with exceeding pipette max: with changeTip="always"', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'always',
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),
      dropTipHelper('A1'),

      pickUpTipHelper('B1'),
      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])
  })

  it('Single-channel with exceeding pipette max: with changeTip="once"', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'once',
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])
  })

  it('Single-channel with exceeding pipette max: with changeTip="never"', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'never',
    }

    const result = consolidate(data, invariantContext, robotStatePickedUpOneTip)
    const res = getSuccessResult(result)
    expect(res.commands).toEqual([
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])
  })

  it('mix on aspirate should mix before aspirate in first well of chunk only, and tip position bound to labware', () => {
    const data = {
      ...mixinArgs,
      volume: 100,
      changeTip: 'once',
      mixFirstAspirate: { times: 3, volume: 50 },
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      ...tripleMix('A1', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),

      aspirateHelper('A1', 100),
      aspirateHelper('A2', 100),
      aspirateHelper('A3', 100),
      dispenseHelper('B1', 300),

      ...tripleMix('A4', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),

      aspirateHelper('A4', 100),
      dispenseHelper('B1', 100),
    ])
  })

  it('should mix on aspirate', () => {
    const data = {
      ...mixinArgs,
      volume: 125,
      changeTip: 'once',
      mixFirstAspirate: { times: 3, volume: 50 },
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      // Start mix
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      aspirateHelper('A1', 50),
      dispenseHelper('A1', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      // done mix
      aspirateHelper('A1', 125),
      aspirateHelper('A2', 125),
      dispenseHelper('B1', 250),

      // Start mix
      aspirateHelper('A3', 50),
      dispenseHelper('A3', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      aspirateHelper('A3', 50),
      dispenseHelper('A3', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      aspirateHelper('A3', 50),
      dispenseHelper('A3', 50, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      // done mix

      aspirateHelper('A3', 125),
      aspirateHelper('A4', 125),
      dispenseHelper('B1', 250),
    ])
  })

  it('should mix after dispense', () => {
    const data = {
      ...mixinArgs,
      volume: 100,
      changeTip: 'once',
      mixInDestination: { times: 3, volume: 53 },
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 100),
      aspirateHelper('A2', 100),
      aspirateHelper('A3', 100),
      dispenseHelper('B1', 300),

      ...tripleMix('B1', 53, {
        labware: DEST_LABWARE,
        offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
      }),

      aspirateHelper('A4', 100),
      dispenseHelper('B1', 100),

      ...tripleMix('B1', 53, {
        labware: DEST_LABWARE,
        offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
      }),
    ])
  })

  it('should mix after dispense with blowout to trash: first mix, then blowout', () => {
    const data = {
      ...mixinArgs,
      volume: 100,
      changeTip: 'once',
      mixInDestination: { times: 3, volume: 54 },
      blowoutLocation: FIXED_TRASH_ID,
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),
      aspirateHelper('A1', 100),
      aspirateHelper('A2', 100),
      aspirateHelper('A3', 100),
      dispenseHelper('B1', 300),

      ...tripleMix('B1', 54, {
        labware: DEST_LABWARE,
        offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
      }),

      blowoutHelper(null, { offsetFromBottomMm: BLOWOUT_OFFSET_ANY }),
      aspirateHelper('A4', 100),
      dispenseHelper('B1', 100),

      ...tripleMix('B1', 54, {
        labware: DEST_LABWARE,
        offsetFromBottomMm: DISPENSE_OFFSET_FROM_BOTTOM_MM,
      }),

      blowoutHelper(null, { offsetFromBottomMm: BLOWOUT_OFFSET_ANY }),
    ])
  })

  it('"pre-wet tip" should aspirate and dispense consolidate volume from first well of each chunk', () => {
    // TODO LATER Ian 2018-02-13 Should it be 2/3 max volume instead?
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'once',
      preWetTip: true,
      sourceWells: ['A1', 'A2', 'A3', 'A4'],
    }

    const preWetVol = data.volume // NOTE same as volume above... for now

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      // pre-wet tip
      aspirateHelper('A1', preWetVol),
      dispenseHelper('A1', preWetVol, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      // done pre-wet

      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),

      // pre-wet tip, now with A3
      aspirateHelper('A3', preWetVol),
      dispenseHelper('A3', preWetVol, {
        labware: SOURCE_LABWARE,
        offsetFromBottomMm: ASPIRATE_OFFSET_FROM_BOTTOM_MM,
      }),
      // done pre-wet

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
    ])
  })

  it('should delay after aspirate', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'never',
      aspirateDelay: { seconds: 12, mmFromBottom: 14 },
    }

    const result = consolidate(data, invariantContext, robotStatePickedUpOneTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      aspirateHelper('A1', 150),
      ...delayWithOffset('A1', SOURCE_LABWARE),

      aspirateHelper('A2', 150),
      ...delayWithOffset('A2', SOURCE_LABWARE),

      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      ...delayWithOffset('A3', SOURCE_LABWARE),

      aspirateHelper('A4', 150),
      ...delayWithOffset('A4', SOURCE_LABWARE),

      dispenseHelper('B1', 300),
    ])
  })

  it('should delay after dispense', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'never',
      dispenseDelay: { seconds: 12, mmFromBottom: 14 },
    }

    const result = consolidate(data, invariantContext, robotStatePickedUpOneTip)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),
      dispenseHelper('B1', 300),
      ...delayWithOffset('B1', DEST_LABWARE),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),
      dispenseHelper('B1', 300),
      ...delayWithOffset('B1', DEST_LABWARE),
    ])
  })

  it('touchTip after aspirate should touch tip after every aspirate command', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'once',
      touchTipAfterAspirate: true,
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    const touchTipAfterAsp = {
      offsetFromBottomMm: mixinArgs.touchTipAfterAspirateOffsetMmFromBottom,
    }
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      aspirateHelper('A1', 150),
      touchTipHelper('A1', touchTipAfterAsp),

      aspirateHelper('A2', 150),
      touchTipHelper('A2', touchTipAfterAsp),

      dispenseHelper('B1', 300),

      aspirateHelper('A3', 150),
      touchTipHelper('A3', touchTipAfterAsp),

      aspirateHelper('A4', 150),
      touchTipHelper('A4', touchTipAfterAsp),

      dispenseHelper('B1', 300),
    ])
  })

  it('touchTip after dispense should touch tip after dispense on destination well', () => {
    const data = {
      ...mixinArgs,
      volume: 150,
      changeTip: 'once',
      touchTipAfterDispense: true,
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    const touchTipAfterDisp = {
      labware: DEST_LABWARE,
      offsetFromBottomMm: mixinArgs.touchTipAfterDispenseOffsetMmFromBottom,
    }
    expect(res.commands).toEqual([
      pickUpTipHelper('A1'),

      aspirateHelper('A1', 150),
      aspirateHelper('A2', 150),

      dispenseHelper('B1', 300),
      touchTipHelper('B1', touchTipAfterDisp),

      aspirateHelper('A3', 150),
      aspirateHelper('A4', 150),

      dispenseHelper('B1', 300),
      touchTipHelper('B1', touchTipAfterDisp),
    ])
  })

  it('invalid pipette ID should return error', () => {
    const data = {
      ...mixinArgs,
      sourceWells: ['A1', 'A2'],
      volume: 150,
      changeTip: 'once',
      pipette: 'no-such-pipette-id-here',
    }

    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getErrorResult(result)

    expect(res.errors).toHaveLength(1)
    expect(res.errors[0].type).toEqual('PIPETTE_DOES_NOT_EXIST')
  })

  it.todo('air gap') // TODO Ian 2018-04-05 determine air gap behavior
})

describe('consolidate multi-channel', () => {
  const multiParams = { pipette: 'p300MultiId' }
  const multiDispense = (well: string, volume: number) =>
    dispenseHelper(well, volume, {
      labware: DEST_LABWARE,
      pipette: 'p300MultiId',
    })

  const args = {
    stepType: 'consolidate',
    commandCreatorFnName: 'consolidate',
    name: 'Consolidate Test',
    description: 'test blah blah',
    pipette: 'p300MultiId',

    sourceWells: ['A1', 'A2', 'A3', 'A4'],
    destWell: 'A12',
    sourceLabware: SOURCE_LABWARE,
    destLabware: DEST_LABWARE,

    // volume and changeTip should be explicit in tests

    preWetTip: false,
    touchTipAfterAspirate: false,
    mixFirstAspirate: null,
    aspirateDelay: null,
    dispenseDelay: null,
    aspirateAirGapVolume: null,
    touchTipAfterDispense: false,
    mixInDestination: null,
    blowoutLocation: null,

    ...getFlowRateAndOffsetParams(),
  }

  it('simple multi-channel: cols A1 A2 A3 A4 to col A12', () => {
    const data = {
      ...args,
      volume: 140,
      changeTip: 'once',
    }
    const result = consolidate(data, invariantContext, initialRobotState)
    const res = getSuccessResult(result)

    expect(res.commands).toEqual([
      pickUpTipHelper('A1', multiParams),
      aspirateHelper('A1', 140, multiParams),
      aspirateHelper('A2', 140, multiParams),
      multiDispense('A12', 280),

      aspirateHelper('A3', 140, multiParams),
      aspirateHelper('A4', 140, multiParams),
      multiDispense('A12', 280),
    ])
  })

  // TODO Ian 2018-03-14: address different multi-channel layouts of plates
  it.todo('multi-channel 384 plate: cols A1 B1 A2 B2 to 96-plate col A12')

  it.todo('multi-channel trough A1 A2 A3 A4 to 96-plate A12')
})
