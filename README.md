# Binance connector in Nodejs

[![npm version](https://badge.fury.io/js/%40binance%2Fconnector.svg)](https://badge.fury.io/js/%40binance%2Fconnector)
[![Node version](https://img.shields.io/node/v/%40binance%2Fconnector.svg?style=flat)](http://nodejs.org/download/)
[![Standard-Js](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


This is a lightweight library that works as a connector to [Binance public API](https://github.com/binance/binance-spot-api-docs). It’s designed to be simple, clean, and easy to use with minimal dependencies.

- Supported APIs:
    - `/api/*`
    - `/sapi/*`
    - Spot Websocket Market Stream
    - Spot User Data Stream
    - Spot Websocket API
- Inclusion of test cases and examples
- Customizable base URL
- Support request timeout and HTTP proxy (since v2)
- Response metadata can be displayed
- Customizable Logger


## Installation

```bash
npm install @binance/connector
```

## Documentation

[https://binance.github.io/binance-connector-node/](https://binance.github.io/binance-connector-node/)

## RESTful APIs

```javascript
const { Spot } = require('@binance/connector')

const apiKey = ''
const apiSecret = ''
const client = new Spot(apiKey, apiSecret)

// Get account information
client.account().then(response => client.logger.log(response.data))

// Place a new order
client.newOrder('BNBUSDT', 'BUY', 'LIMIT', {
  price: '350',
  quantity: 1,
  timeInForce: 'GTC'
}).then(response => client.logger.log(response.data))
  .catch(error => client.logger.error(error))
```

Please find `examples` folder to check for more endpoints.

## Key Pair Based Authentication

```javascript
const { Spot, PrivateKeyAlgo } = require('@binance/connector')

const apiKey = ''
const apiSecret = '' // has no effect when RSA private key is provided

// load private key
const privateKey = fs.readFileSync('/Users/john/ssl/private_key_encrypted.pem')
const privateKeyPassphrase = 'password'
const privateKeyAlgo = PrivateKeyAlgo.RSA // for RSA key
const privateKeyAlgo = PrivateKeyAlgo.ED25519 // for Ed25519 key

const client = new Spot(apiKey, apiSecret, {
  privateKey,
  privateKeyPassphrase, // only used for encrypted key
  privateKeyAlgo
})

// Get account information
client.account().then(response => client.logger.log(response.data))
```

### Testnet

While `/sapi/*` endpoints don't have testnet environment yet, `/api/*` endpoints can be tested in
[Spot Testnet](https://testnet.binance.vision/). You can use it by changing the base URL:

```javascript
// provide the testnet base url
const client = new Spot(apiKey, apiSecret, { baseURL: 'https://testnet.binance.vision'})
```

### Base URL

If `base_url` is not provided, it defaults to `api.binance.com`.

It's recommended to pass in the `base_url` parameter, even in production as Binance provides alternative URLs in case of performance issues:

- `https://api1.binance.com`
- `https://api2.binance.com`
- `https://api3.binance.com`

### Optional Parameters

Optional parameters are encapsulated to a single object as the last function parameter.

```javascript
const { Spot } = require('@binance/connector')

const apiKey = ''
const apiSecret = ''
const client = new Spot(apiKey, apiSecret)

client.account({ recvWindow: 2000 }).then(response => client.logger.log(response.data))

```

### Timeout

It's easy to set timeout in milliseconds in request. If the request take longer than timeout, the request will be aborted. If it's not set, there will be no timeout.

```javascript
const { Spot } = require('@binance/connector')

const apiKey = ''
const apiSecret = ''
const client = new Spot(apiKey, apiSecret, { timeout: 1000 })

client.account()
  .then(response => client.logger.log(response.data))
  .catch(error => client.logger.error(error.message))
```

### Proxy

The `axios` package is used as the http client in this library. A proxy settings is passed into `axios` directly, the details can be found at [here](https://github.com/axios/axios#request-config):

```javascript
const { Spot } = require('@binance/connector')

const apiKey = ''
const apiSecret = ''
const client = new Spot(apiKey, apiSecret,
  {
    proxy: {
      protocol: 'https',
      host: '127.0.0.1',
      port: 9000,
      auth: {
        username: 'proxy_user',
        password: 'password'
      }
    }
  }
)
```

You may have a HTTP proxy, that can bring the problem that you need to make a HTTPS connection through the HTTP proxy.  You can do that by build a HTTPS-over-HTTP tunnel by npm package [tunnel](https://www.npmjs.com/package/tunnel), and then pass the turnnel agent to `httpsAgent` in `axios`.

```javascript
const tunnel = require('tunnel')

const agent = tunnel.httpsOverHttp({
  proxy: {
    host: "127.0.0.1",
    port: 3128
  }
})

const client = new Spot(null, null,
  {
    baseURL: "https://api.binance.com",
    httpsAgent: agent
  }
)

client.time()
  .then(response => client.logger.log(response.data))
  .catch(error => client.logger.error(error))

```
[This comment](https://github.com/axios/axios/issues/925#issuecomment-359982190) provides more details.

### Response Metadata

The Binance API server provides weight usages in the headers of each response. This information can be fetched from `headers` property. `x-mbx-used-weight` and `x-mbx-used-weight-1m` show the total weight consumed within 1 minute.

```
// client initialization is skipped

client.exchangeInfo().then(response => client.logger.log(response.headers['x-mbx-used-weight-1m']))

```

### Custom Logger Integration

```javascript
const Spot = require('@binance/connector')
const fs = require('fs')
const { Console } = require('console')

// make sure the logs/ folder is created beforehand
const output = fs.createWriteStream('./logs/stdout.log')
const errorOutput = fs.createWriteStream('./logs/stderr.log')

const logger = new Console({ stdout: output, stderr: errorOutput })
const client = new Spot('', '', {logger: logger})

client.exchangeInfo().then(response => client.logger.log(response.data))
// check the output file

```

The default logger defined in the package is [Node.js Console class](https://nodejs.org/api/console.html). Its output is sent to `process.stdout` and `process.stderr`, same as the global console.

### Error

There are 2 types of error that may be returned from the API server and the user has to handle it properly:

- `Client error`
  - This is thrown when server returns `4XX`, it's an issue from client side.
  - The following properties may be helpful to resolve the issue:
    - Response header - Please refer to `Response Metadata` section for more details.
    - HTTP status code
    - Error code - Server's error code, e.g. `-1102`
    - Error message - Server's error message, e.g. `Unknown order sent.`
    - Request config - Configuration send to the server, which can include URL, request method and headers.

  ```
  // client initialization is skipped
  client.exchangeInfo({ symbol: 'invalidSymbol' })
    .then(response => client.logger.log(response.data))
    .catch(err => {
      client.logger.error(err.response.headers) // full response header
      client.logger.error(err.response.status) // HTTP status code 400
      client.logger.error(err.response.data) // includes both error code and message
      client.logger.error(err.response.config) // includes request's config
    })

  ```

- `Server error`
  - This is thrown when server returns `5XX`, it's an issue from server side.


## Websocket

### Websocket Stream
```javascript
const { WebsocketStream } = require('@binance/connector')
const logger = new Console({ stdout: process.stdout, stderr: process.stderr })

// define callbacks for different events
const callbacks = {
  open: () => logger.debug('Connected with Websocket server'),
  close: () => logger.debug('Disconnected with Websocket server'),
  message: data => logger.info(data)
}

const websocketStreamClient = new WebsocketStream({ logger, callbacks })
// subscribe ticker stream
websocketStreamClient.ticker('bnbusdt')
// close websocket stream
setTimeout(() => websocketStreamClient.disconnect(), 6000)

```

### Unsubscribe Websocket Stream

```javascript
// unsubscribe websocket stream
websocketStreamClient.unsubscribe('bnbusdt@kline_1m')
```

### WebSocket API

```javascript
const { WebsocketAPI } = require('@binance/connector')
const logger = new Console({ stdout: process.stdout, stderr: process.stderr })

// callbacks for different events
const callbacks = {
  open: (client) => {
    logger.debug('Connected with Websocket server')
    // send message to get orderbook info after connection open
    client.orderbook('BTCUSDT')
    client.orderbook('BNBUSDT', { limit: 10 })
  },
  close: () => logger.debug('Disconnected with Websocket server'),
  message: data => logger.info(data)
}

const websocketAPIClient = new WebsocketAPI(null, null, { logger, callbacks })

// disconnect the connection
setTimeout(() => websocketAPIClient.disconnect(), 20000)

```

More websocket examples are available in the `examples` folder


### Auto Reconnect

If there is a close event not initiated by the user, the reconnection mechanism will be triggered in 5 secs.

### Ping Server

It is possible to ping server from client, and expect to receive a PONG message.

```javascript
websocketStreamClient.pingServer()
	
00000
000000000000000a1c
e1bf0245d3ce9c6751
1b741cd43883bffa99
ecc43
2024-09-13 21:03:04	
ViaBTC	
$ /ViaBTC/Mined by oxly0025/,ú¾mmB/FÄäÛ—Tø[ M Í¤ÓÏÜíü7f@ šTc7'c- jn³ ‚ +Dd‚N	
0305240d1a2f5669614254432f4d696e6564206279206f786c79303032352f2cfabe6d6d422f46c4e4db9754f85b1a4d8dcda4d3cfdcedfc37664007059a54633727632d1000000000000000106a6eb30482050e2b4464824e0503000000000000	
2612	
2416	
7620	
8717	
2009787.9579485	
11.168,99BTC	
648.527.600ABD Doları	
11.172,12BTC	
648.709.060ABD doları	
0,07BTC	
3.880,60ABD doları	
0,00 BTC	
2,44 ABD doları	
0,00 BTC	
0,97 ABD Doları	
3.13BTC	
181.453,12ABD doları	
3.19 BTC	
185.333,73 ABD doları	
1.589,383 kB	
3993463	
870711296	
33e60000	
1100111110011000000000000000000	
2024-09-13 19:37:14	
cbf81
480f97db133f6d02e1
910373edd0e012a0fa
f96b726a678f79efde
38811
2752175696	
386075020	
92671576265161	
00000
000000000000000000
000000000000000008
e52fe56f43bdf35225
cd372
861.188	
00000
000000000000000122
b336ecafb68e2d76be
dbec260c2519114b2e
4 yatak odalı
2024-09-13 20:55:21	
Foundry ABD Havuzu	
$ ¿¦äf/Foundry USA Havuzu #dropgold/<5AaTm	
0304240d04bfa6e4662f466f756e6472792055534120506f6f6c202364726f70676f6c642f3c354161546d000000000000	
3331	
3172	
8660	
8297	
26857.480478303	
5.653,30BTC	
328.258.660ABD Doları	
5.656,42BTC	
328.440.100ABD doları	
0,07BTC	
4.221,12ABD doları	
0,00 BTC	
2,56 ABD doları	
0,00 BTC	
1.06 ABD Doları	
3.13BTC	
181.453,12ABD doları	
3.20 BTC	
185.674,25 ABD doları	
1.647,357 kB	
3993294	
566575104	
21c54000	
1000011100010101000000000000000	
2024-09-13 19:26:57	
5d7a7
838436357349057835
b491d7e1cd63e114bc
87a9a5b91432edb826
c1132
1869959820	
386075020	
92671576265161	
00000
000000000000000000
000000000000000008
e52aa0dd79070c0a26
e9adf
861.187	
00000
0000000000000029c0
1a5247e45e85b5d274
97641fde5cd7e9737b
f4a95
2024-09-13 20:50:17	
Karınca Havuzu	
$ AntPool tarafından çıkarıldı H £ ß(ú¾mm › È‚%C§)£!1 öœD k”JŠxJ¾·¡Ç½æÕÅf Ÿ©Ž n	
0303240d194d696e656420627920416e74506f6f6c2048000600a316df28fabe6d6da09b12c8822543a729a3213105f69c44016b944a8a784abeb7a1c7bde6d5c566100000000000000000009fa98e066e0000000000	
2281	
2108	
8116	
6706	
9553.796822204	
8.719,35BTC	
506.289.300ABD Doları	
8.722,48BTC	
506.470.780ABD doları	
0,09BTC	
5.399,88ABD doları	
0,00 BTC	
3.55 ABD doları	
0,00 BTC	
1.35 ABD Doları	
3.13BTC	
181.453,12ABD doları	
3.22 BTC	
186.853 ABD doları	
1.523.188 kB	
3993775	
837853184	
31f0a000	
1100011111000010100000000000000	
2024-09-13 19:12:17	
781c4
476ce163a4bb742f01
84e032e69293b10140
b329ed1e64cf6bb47f
9a0d3
549018684	
386075020	
92671576265161	
00000
000000000000000000
000000000000000008
e5255c4bae5024c228
0624c
861.186	
00000
0000000000000015c9
6812efb8f5f6c235be
5f4a3751a623774954
32293
2024-09-13 20:44:53	
Foundry ABD Havuzu	
$ E¤äf/Foundry ABD Havuzu #dropgold/.½NR(ç‡[	
0302240d0445a4e4662f466f756e6472792055534120506f6f6c202364726f70676f6c642f2ebd4e52000028e7875b0000	
3021	
2620	
6166	
14918	
74425.538862524	
13.240,35BTC	
768.800.700ABD Doları	
13.243,47BTC	
768.982.140ABD doları	
0,17BTC	
9.758,14ABD doları	
0,00 BTC	
6.71ABD doları	
0,00 BTC	
2,44 ABD Doları	
3.13BTC	
181.453,12ABD doları	
3.29 BTC	
191.211,27 ABD doları	
1.454.222 kB	
3993266	
565346304	
21b28000	
1000011011001010000000000000000	
2024-09-13 19:00:02	
ac27a
c379b345786edca916
d483c62ba211045d0d
3f424daaebfe873179
faf8d
560952371	
386075020	
92671576265161	
00000
000000000000000000
000000000000000008
e52017b9e3993d7a29
229b9
861.185
```

### Custom Logger Integration

The default logger defined in the package is [Node.js Console class](https://nodejs.org/api/console.html). Its output is sent to `process.stdout` and `process.stderr`, same as the global console.

Note that when the connection is initialized, the console outputs a list of callbacks in the form of `listen to event: <event_name>`.

## Test

```bash
npm install

npm run test

```

## Limitation

Futures and Vanilla Options APIs are not supported:

  - `/fapi/*`
  - `/dapi/*`
  - `/vapi/*`
  -  Associated Websocket Market and User Data Streams

## License
MIT
