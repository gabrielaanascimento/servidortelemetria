import WebSocket from 'ws'

const ws = new WebSocket('wss://servidortelemetria.onrender.com/')

ws.on('open', () => {
    console.log('Simulador conectado ao servidor!')

    const INITIAL_COORD = [-23.5505, -46.6333];
    let anguloSimulacao = 0;


    setInterval(() => {
        anguloSimulacao += 0.02;
        const telemetryData = {
            voltage: parseFloat((11.5 + Math.random()).toFixed(2)),
            current_eletronic: parseFloat((1.2 + Math.random() * 0.5).toFixed(2)),
            current_motor: parseFloat((15 + Math.random() * 10).toFixed(2)),
            pressure: parseFloat((1010 + Math.random() * 5).toFixed(2)),
            aceleration_x: parseFloat((Math.random() * 2 - 1).toFixed(2)),
            aceleration_y: parseFloat((Math.random() * 2 - 1).toFixed(2)),
            aceleration_z: parseFloat((9.8 + Math.random() * 0.2).toFixed(2)),
            spin_x: parseFloat((Math.random() * 5).toFixed(2)),
            spin_y: parseFloat((Math.random() * 5).toFixed(2)),
            latitude: parseFloat(INITIAL_COORD[0] + Math.sin(anguloSimulacao) * 0.005),
            longitude: parseFloat(INITIAL_COORD[1] + Math.cos(anguloSimulacao) * 0.008),
            speed_kmh: parseFloat((40 + Math.random() * 20).toFixed(2)),
            temperature: parseFloat((70 + Math.random() * 15).toFixed(2))
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(telemetryData))
            console.log(`Payload enviado -> Velocidade: ${telemetryData.speed_kmh} km/h | Motor: ${telemetryData.current_motor}A`)
        }
    }, 200)
})

ws.on('close', () => {
    console.log('Conexão encerrada com o servidor.')
})

ws.on('error', (err) => {
    console.error('Falha na conexão:', err)
})