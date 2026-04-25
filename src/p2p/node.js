// CONEXION ENTRE NODOS

import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import b4a from 'b4a'


export async function createNode () {

    const storagePath = (typeof Pear !== 'undefined')  // Asegura que estamos dentro de Pear
    ? Pear.config.storage + '/corestore'
    : './data/corestore'    // Si no, crea una carpeta local

    // Crea una instancia de Corestore
    const store = new Corestore (storagePath)
    await store.ready()  // Espera a que el disco duro responda


    // Activamos la "antena", con la instancia de Hyperswarm nos conectamos a la red globlal de nodos.
    const swarm = new Hyperswarm()


    // Momento en que dos nodos se encuentran
    swarm.on ('connection' , (conn, peerInfo) => {
    console.log('Peer conectado! Su clave:', b4a.toString(peerInfo.publicKey, 'hex').slice(0, 12))
    store.replicate(conn)
    })


    // Identificación de la tienda dentro del sistema
    const identityCore = store.get ({name: 'identity'})
    await identityCore.ready()  // Espera a que el identityCore esté listo para generar una clave pública






}
