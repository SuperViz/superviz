export enum PositionsEnum {
  'TOOLTIP-BOTTOM' = 'tooltip-bottom',
  'TOOLTIP-TOP' = 'tooltip-top',
  'TOOLTIP-LEFT' = 'tooltip-left',
  'TOOLTIP-RIGHT' = 'tooltip-right',
  'TOOLTIP-CENTER' = 'tooltip-center',
}

export type Positions = PositionsEnum | `${PositionsEnum}`;
