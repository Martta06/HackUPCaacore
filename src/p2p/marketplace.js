import Hyperswarm from 'hyperswarm'
import b4a from 'b4a'
import crypto from 'hardcore-crypto'
import EventEmitter from 'events'

export class Marketplace extends EventEmitter {
    constructor() {
        super()
        this.swarm = new Hyperswarm()
        this.peers = {} // Guarda las conexiones por su peerId
        this.topic = null
        this._setupSwarm()
    }

    _setupSwarm() {
        this.swarm.on('connection', conn => {
            const peerId = b4a.toString(conn.remotePublicKey, 'hex')
            this.peers[peerId] = conn

            // Notifica al frontend que alguien se unió al marketplace
            this.emit('peer-joined', peerId)

            conn.once('close', () => {
                delete this.peers[peerId]
                // Notifica al frontend que alguien se desconectó
                this.emit('peer-left', peerId)
            })

            conn.on('data', data => {
                // Parsea los datos entrantes como JSON para distinguir los tipos de mensaje
                try {
                    const parsed = JSON.parse(data.toString())
                    if (parsed.type === 'announcement') {
                        this.emit('announcement', { from: peerId, content: parsed.content })
                    } else if (parsed.type === 'direct-message') {
                        this.emit('message', { from: peerId, content: parsed.content })
                    }
                } catch (err) {
                    // Alternativa por si los datos son texto sin formato
                    this.emit('message', { from: peerId, content: data.toString() })
                }
            })

            conn.on('error', err => {
                this.emit('peer-error', { peerId, error: err })
            })
        })
    }

    /**
     * Únete al topic global del marketplace.
     * @param {string} topicString - El nombre del topic compartido (ej. "vinted-global-v1"). Si es null, crea uno aleatorio.
     * @returns {Promise<string>} - Devuelve el hash del topic en formato hexadecimal.
     */
    async join(topicString) {
        let topicBuffer
        if (topicString) {
            // Hashea el texto para garantizar siempre un buffer de 32 bytes
            topicBuffer = crypto.hash(b4a.from(topicString))
        } else {
            topicBuffer = crypto.randomBytes(32)
        }

        this.topic = b4a.toString(topicBuffer, 'hex')
        const discovery = this.swarm.join(topicBuffer, { client: true, server: true })

        // Espera hasta que nos hayamos anunciado completamente en el DHT
        await discovery.flushed()
        return this.topic
    }

    /**
     * Devuelve una lista de todos los IDs de los peers activos actualmente en el marketplace
     */
    getPeers() {
        return Object.keys(this.peers)
    }

    /**
     * Envía un mensaje privado 1-a-1 a un peer específico.
     */
    sendMessage(peerId, content) {
        const conn = this.peers[peerId]
        if (conn) {
            const payload = JSON.stringify({ type: 'direct-message', content })
            conn.write(payload)
            return true
        }
        return false
    }

    /**
     * Envía un anuncio a todos los peers conectados en la sala global.
     * Ideal para que los vendedores anuncien su clave pública.
     */
    broadcastAnnouncement(content) {
        const payload = JSON.stringify({ type: 'announcement', content })
        for (const peerId in this.peers) {
            this.peers[peerId].write(payload)
        }
    }
    /**
     * Destruye el enjambre (swarm) de forma segura (llama a esto cuando se cierre la app)
     */
    async destroy() {
        await this.swarm.destroy()
    }
}
