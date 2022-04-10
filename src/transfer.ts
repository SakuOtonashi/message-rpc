import {
  RPCChannel,
  RPCMethods,
  RPCRequestPacket,
  RPCResponsePacket,
} from './types'
import { parseJSON } from './utils'

export class RPCResponse<T extends RPCMethods> {
  constructor(
    private serviceID: string,
    private channel: RPCChannel,
    private callback: ResponseCallback<T>,
  ) {
    this.destroy = channel.readMessages(this.listener)
  }

  private listener = async <K extends keyof T>(data: string) => {
    const packet = parseJSON<RPCRequestPacket<T, K>>(data)
    if (
      !(
        packet &&
        packet.type === 'request' &&
        packet.serviceID === this.serviceID
      )
    ) {
      return
    }
    try {
      const result = await this.callback(packet.method, packet.args)
      const res: RPCResponsePacket<T, K> = {
        type: 'response',
        serviceID: this.serviceID,
        callId: packet.callId,
        result,
      }
      this.channel.postMessage(JSON.stringify(res))
    } catch (error) {
      const res: RPCResponsePacket<T, K> = {
        type: 'response',
        serviceID: this.serviceID,
        callId: packet.callId,
        error,
      }
      this.channel.postMessage(JSON.stringify(res))
    }
  }

  public destroy: () => void
}

export class RPCRequest<T extends RPCMethods> {
  private static callCounter = 0
  // 远程响应回调
  private callMap = new Map<number, RequestCallback<T>>()

  constructor(private serviceID: string, private channel: RPCChannel) {
    this.destroy = channel.readMessages(this.listener)
  }

  private listener = async <K extends keyof T>(data: string) => {
    const packet = parseJSON<RPCResponsePacket<T, K>>(data)
    if (
      !(
        packet &&
        packet.type === 'response' &&
        packet.serviceID === this.serviceID
      )
    ) {
      return
    }
    this.callMap.get(packet.callId)?.(packet.result, packet.error)
  }

  public call<K extends keyof T>(method: K, args: Parameters<T[K]>) {
    const callId = RPCRequest.callCounter++
    const packet: RPCRequestPacket<T, K> = {
      type: 'request',
      serviceID: this.serviceID,
      callId,
      method,
      args,
    }
    const req = new Promise<ReturnType<T[K]>>((resolve, reject) => {
      this.channel.postMessage(JSON.stringify(packet))
      this.callMap.set(callId, (result, error) => {
        this.callMap.delete(callId)
        if (error) {
          reject(error)
        } else {
          resolve(result!)
        }
      })
    })
    return req
  }

  public destroy: () => void
}

type ResponseCallback<T extends RPCMethods> = <K extends keyof T>(
  method: K,
  args: Parameters<T[K]>,
) => ReturnType<T[K]>

type RequestCallback<T extends RPCMethods> = <K extends keyof T>(
  result: ReturnType<T[K]> | undefined,
  error: unknown | undefined,
) => void
