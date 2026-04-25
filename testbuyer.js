import { createNode } from './src/p2p/node.js'
import { discoverSeller } from './src/p2p/buyer.js'
import fs from 'fs/promises'

// Pegad aquí las claves que imprime el seller
const SELLER_KEY = 'a83f4e1abd1093ea5128db90476b0edafcb0a4ffcc00996dff7024bb76d6de8d'
const BLOBS_KEY  = 'f0e68841a3261e984d4055208fdbfce99243c7566994241355b4539aac6dfc34'

async function main () {
  console.log('🟡 Arrancando nodo buyer...')
  const node = await createNode('buyer')

  console.log('🟡 Buscando al seller...')
    // Conexión directa por IP, saltándonos el DHT
    import b4a from 'b4a'

    const SELLER_IP = '192.168.X.X'   // la IP que te pasó
    const SELLER_PORT = XXXXX          // el puerto que te pasó

    console.log('🟡 Conectando directamente al seller...')
    const socket = node.swarm.dht.connect(b4a.from(SELLER_KEY, 'hex'))
    socket.on('open', () => console.log('✅ Conectado directamente'))
    socket.on('error', (e) => console.log('❌ Error de conexión:', e.message))
  const seller = await discoverSeller(node, SELLER_KEY, BLOBS_KEY)

  console.log('\n✅ Productos encontrados:')
  for (const p of seller.products) {
    console.log(' -', p.name, '| Precio:', p.price, '| Imágenes:', p.images?.length ?? 0)
  }

  if (seller.products[0]?.images?.length > 0) {
    console.log('\n🟡 Descargando imagen...')
    const img = await seller.getImage(seller.products[0].images[0])
    await fs.writeFile('./downloaded-image.jpg', img.buffer)
    console.log('✅ Imagen guardada como downloaded-image.jpg')
  }

  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})