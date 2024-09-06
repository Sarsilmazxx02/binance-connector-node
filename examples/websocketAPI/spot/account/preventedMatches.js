'use strict'

const { Console } = require('console')
const WebsocketAPI = require('../../../../src/websocketAPI')

const logger = new Console({ stdout: process.stdout, stderr: process.stderr })

const apiKey = process.env.BINANCE_API_KEY || 'ovFaK62DT1kD0oMsoCXp81h0nKXoTMxecJA6yHkmQCbVQf9BAGmQsOCILylmCBK7'
const apiSecret = process.env.BINANCE_API_SECRET || 'n0puM0CDxzP1QjQltIG9G2A1SK5RG0lhQieYjfXM3KgfZzopI29AsapLgQe8REev
'

const callbacks = {
  open: (client) => {
    logger.debug('Connected with Websocket server')
    client.preventedMatches('BNBUSDT', { orderId: 1 })
  },
  close: () => logger.debug('Disconnected with Websocket server'),
  message: data => logger.info(data)
}

const websocketAPIClient = new WebsocketAPI(apiKey, apiSecret, { logger, callbacks })

// disconnect after 20 seconds
setTimeout(() => websocketAPIClient.disconnect(), 20000)
