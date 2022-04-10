# message-rpc

轻量级 RPC 实现

## Example Usage

ReactNative WebView
```typescript
import { RPCChannel, RPCClient, RPCMethods } from 'message-rpc'

interface MyMethods extends RPCMethods {
  add: (x: number, y: number) => number
  subtract: (x: number, y: number) => Promise<number>
}

function Webpage() {
  const webRef = useRef<WebView>(null)
  const onMessageRef = useRef<(data: string) => void>(() => {})
  const clientRef = useRef<RPCClient<MyMethods>>()
  useEffect(() => {
    const channel: RPCChannel = {
      postMessage: (message: string) => {
        webRef.current!.injectJavaScript(
          `window.postMessage(${JSON.stringify(message)})`,
        )
      },
      readMessages: callback => {
        onMessageRef.current = callback
        return () => {
          onMessageRef.current = () => {}
        }
      },
    }
    const client = new RPCClient<MyMethods>('my-service-id', channel)
    clientRef.current = client
    return client.destroy
  }, [])

  return (
    <View>
      <Button
        title="call method"
        onPress={() => {
          // (property) add: (x: number, y: number) => Promise<number>
          clientRef.current!.methods.add(1, 2)
          // (property) subtract: (x: number, y: number) => Promise<number>
          clientRef.current!.methods.subtract(1, 2)
        }}
      />
      <WebView
        ref={webRef}
        source={{ uri: 'your server url' }}
        onMessage={ev => {
          onMessageRef.current(ev.nativeEvent.data)
        }}
      />
    </View>
  )
}
```

your server page
```typescript
import { RPCChannel, RPCMethods, RPCServer } from 'message-rpc'

interface MyMethods extends RPCMethods {
  add: (x: number, y: number) => number
  subtract: (x: number, y: number) => Promise<number>
}

const channel: RPCChannel = {
  postMessage: (message: string) => {
    window.ReactNativeWebView?.postMessage(message)
  },
  readMessages: callback => {
    function listener(event: MessageEvent<string>) {
      if (typeof event.data === 'string') {
        callback(event.data)
      }
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  },
}

function App() {
  useEffect(() => {
    const methods: MyMethods = {
      add: (x: number, y: number) => {
        return x + y
      },
      subtract: (x: number, y: number) => {
        return new Promise<number>(resolve => {
          setTimeout(() => {
            resolve(x - y)
          }, 3000)
        })
      },
    }
    const server = new RPCServer('my-service-id', channel, methods)
    return server.destroy
  }, [])

  return <div />
}
```
