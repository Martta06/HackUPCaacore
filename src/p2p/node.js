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


    // Identificación del nodo local
    const identityCore = store.get ({name: 'identity'})
    await identityCore.ready()  // Espera a que el identityCore esté listo para generar una clave pública

    // Clave que se comparte con el mundo para conectar, se traduce a texto para poder compartilo, (via mensaje, was, etc)
    const publicKey = b4a.toString (identityCore.key, 'hex')


    // Checks que aparecen al conectarte 

    //1. Que el nodo está listo
    console.log('✓ Nodo P2P listo')

    //2. El código que te identifica como vendedor
    console.log('  Identidad:', publicKey)

    //3. Indica donde se están guardando los datos en el ordenador
    console.log('  Storage:  ', storagePath)


    return {
        store,
        swarm,
        publicKey,

        async destroy () {
            console.log ('Cerrando el nodo')

            // Avisamos al resto de nodos de que se cierra
            await swarm.destroy()

            // Esperamos que la tienda guarde los datos para que no se reescriban
            await store.destroy()

        }
    }

}
