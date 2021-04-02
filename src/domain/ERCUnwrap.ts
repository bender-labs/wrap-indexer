import { ERCType, WrapStatus } from './ERCWrap';

export interface ERCUnwrap {
  id: string;
  source: string;
  token: string;
  ethereumDestination: string;
  operationHash: string;
  level: number;
  status: WrapStatus;
  amount?: string;
  tokenId?: string;
  finalizedAtLevel: number;
  type: ERCType;
}
