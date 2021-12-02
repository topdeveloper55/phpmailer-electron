export interface UplSerData {
  successLength: number;
  failedLength: number;
  data: string[];
}

export interface SendData {
  ranNamStatus: boolean;
  ranSenEmaStatus: boolean;
  ranSubStatus: boolean;
  usedCount: number;
  limit: number;
  couPerReplace: number;
}

export interface ResponseData {
  serverNum: number;
  count: number;
}
