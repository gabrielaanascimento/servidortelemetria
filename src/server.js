process.env.TZ = 'America/Sao_Paulo';

import WebSocket, { WebSocketServer } from 'ws'
import env from 'dotenv'
import { pool } from './dataBase/config.js'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import http from 'http'
import iaRoutes from './routes/iaRoutes.js'

env.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(iaRoutes)

const server = http.createServer(app)

app.get('/', (req, res) => {
    res.send('Servidor rodando!')
})

app.post('/register', async (req, res) => {
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' })
    }
    try {
        const hashedPassword = await bcrypt.hash(senha, 10)
        const query = 'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email'
        const values = [nome, email, hashedPassword]
        const result = await pool.query(query, values)
        const newUser = result.rows[0]
        return res.status(201).json({ message: 'Usuário registrado com sucesso.', user: newUser })
    } catch (error) {
        console.error('Error registering user:', error)
        return res.status(500).json({ message: 'Error registering user.' })
    }
})

app.post('/login', async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' })
    }

    try {
        const query = 'SELECT id, nome, email, senha FROM usuarios WHERE email = $1'
        const values = [email]
        const result = await pool.query(query, values)

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' })
        }

        const user = result.rows[0]
        const isMatch = await bcrypt.compare(senha, user.senha)

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' })
        }

        const token = jwt.sign({ id: user.id, nome: user.nome, email: user.email }, process.env.JWT_SECRET, { expiresIn: '4h' })
        return res.status(200).json({ message: 'Login realizado com sucesso.', token })
    } catch (error) {
        console.error('Error logging in:', error)
        return res.status(500).json({ message: 'Error logging in.' })
    }
})

const wss = new WebSocketServer({ server }, () => {
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

        // Nomes exatos das colunas no banco (agora com altitude)
        const colunas = [
            'created_at',
            'voltage', 'current_eletronic', 'current_motor', 'pressure', 'altitude',
            'aceleration_x', 'aceleration_y', 'aceleration_z',
            'spin_x', 'spin_y', 'latitude', 'longitude', 'speed_kmh', 'temperature'
        ]

        const placeholders = []
        const valores = []
        let index = 1

        loteParaInserir.forEach((item) => {
            const params = []

            const dataHoraRecebimento = new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });

            // De/para: chave do JSON da ESP -> coluna do BD
            const dadosMapeados = {
                created_at: dataHoraRecebimento,
                voltage: item.voltageINA || 0,
                current_eletronic: item.currentINA || 0,
                current_motor: item.currentACS || 0,
                pressure: item.pressure || 0,
                altitude: item.altitude || 0,
                aceleration_x: item.ax || 0,
                aceleration_y: item.ay || 0,
                aceleration_z: item.az || 0,
                spin_x: item.gx || 0,
                spin_y: item.gy || 0,
                latitude: item.lat || 0,
                longitude: item.lng || 0,
                speed_kmh: item.speedKmh || 0,
                temperature: 0.0
            }

            colunas.forEach((coluna) => {
                valores.push(dadosMapeados[coluna])
                params.push(`$${index}`)
                index++
            })
            placeholders.push(`(${params.join(', ')})`)
        })

        const query = `INSERT INTO telemetria (${colunas.join(', ')}) VALUES ${placeholders.join(', ')}`

        try {
            await pool.query(query, valores)
            console.log(`Lote de ${loteParaInserir.length} registros inserido com sucesso!`)
        } catch (dbError) {
            console.error('Erro no insert do banco:', dbError)
        }
    }
}, 1000)

server.listen(process.env.PORT || 8080, () => {
    console.log(`Server is running on port ${process.env.PORT || 8080}`)
})