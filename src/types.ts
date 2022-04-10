export interface RPCChannel {
  postMessage: (data: string) => void
  readMessages: (callback: (data: string) => void) => () => void
}

export interface RPCMethods {
  [key: string]: (...args: any[]) => any
}

export interface RPCResponsePacket<
  T extends RPCMethods,
  K extends keyof T = keyof T,
> {
  type: 'response'
  serviceID: string
  callId: number
  result?: ReturnType<T[K]>
  error?: unknown
}

export interface RPCRequestPacket<
  T extends RPCMethods,
  K extends keyof T = keyof T,
> {
  type: 'request'
  serviceID: string
  callId: number
  method: K
  args: Parameters<T[K]>
}

export type RemoteCalls<T extends RPCMethods> = {
  [K in keyof T]: (
    ...args: Parameters<T[K]>
  ) => Promise<Awaited<ReturnType<T[K]>>>
}
