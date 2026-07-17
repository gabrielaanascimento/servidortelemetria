import WebSocket, { WebSocketServer } from 'ws'
import env from 'dotenv'
import { pool } from './dataBase/config.js'

env.config()

const wss = new WebSocketServer({ port: process.env.PORT || 8080 }, () => {
    console.log(`WebSocket server is running on port ${process.env.PORT || 8080}`)
})

let bufferTelemetria = []

wss.on('connection', (ws) => {
    console.log('Client connected')

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message)

            bufferTelemetria.push(data)

            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data))
                }
            })

        } catch (error) {
            console.error('Error processing message:', error)
        }
    })

    ws.on('close', () => {
        console.log('Client disconnected')
    })
})

setInterval(async () => {
    if (bufferTelemetria.length > 0) {
        const loteParaInserir = [...bufferTelemetria]
        bufferTelemetria = []


        const colunas = [
            'voltage', 'current_eletronic', 'current_motor', 'pressure',
            'aceleration_x', 'aceleration_y', 'aceleration_z',
            'spin_x', 'spin_y', 'latitude', 'longitude', 'speed_kmh', 'temperature'
        ]

        const placeholders = []
        const valores = []
        let index = 1

        loteParaInserir.forEach((item) => {
            const params = []
            colunas.forEach((coluna) => {
                valores.push(item[coluna])
                params.push(`$${index}`)
                index++
            })
            placeholders.push(`(${params.join(', ')})`)
        })

        const query = `INSERT INTO telemetria (${colunas.join(', ')}) VALUES ${placeholders.join(', ')}`

        try {
            await pool.query(query, valores)
            console.log(`Inserting batch of ${loteParaInserir.length} telemetry records into the database`)
        } catch (dbError) {
            console.error('Database insert error:', dbError)
        }
    }
}, 1000)