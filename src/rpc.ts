import { RemoteCalls, RPCChannel, RPCMethods } from './types'
import { RPCRequest, RPCResponse } from './transfer'

export class RPCServer<T extends RPCMethods> {
  constructor(serviceID: string, channel: RPCChannel, private methods: T) {
    const response = new RPCResponse(serviceID, channel, this.listener)
    this.destroy = response.destroy
  }

  private listener = <K extends keyof T>(method: K, args: Parameters<T[K]>) => {
    return this.methods[method]?.(...args) as ReturnType<T[K]>
  }

  public destroy: () => void
}

export class RPCClient<T extends RPCMethods> {
  public methods: RemoteCalls<T>

  constructor(serviceID: string, channel: RPCChannel) {
    const request = new RPCRequest<T>(serviceID, channel)
    this.destroy = request.destroy
    this.methods = new Proxy({} as RemoteCalls<T>, {
      get: <K extends keyof T>(obj: any, prop: any) => {
        if (prop in obj) {
          return obj[prop]
        }
        return (...args: Parameters<T[K]>) => request.call(prop, args)
      },
    })
  }

  public destroy: () => void
}
