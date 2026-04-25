import { createSellerCatalog } from '../p2p/seller.js'

export function renderSellerView() {
    return `
        <div id="pantalla-tienda">
            <h2>Mi tienda</h2>
            <div class="clave-box">
                <p>Comparte esta clave con tus compradores:</p>
                <code id="mi-clave"></code>
                <button id="btn-copiar-clave">Copiar</button>
            </div>

            <h3>Añadir producto</h3>
            <form id="form-producto">
                <input id="prod-nombre" placeholder="Nombre" required />
                <input id="prod-precio" type="number" step="0.01" placeholder="Precio €" required />
                <textarea id="prod-descripcion" placeholder="Descripción"></textarea>
                <input id="prod-imagenes" type="file" accept="image/*" multiple required />
                <button type="submit">Publicar</button>
            </form>

            <h3>Mis productos</h3>
            <div id="mis-productos"></div>
        </div>
    `
}

export async function initSellerView(node) {
    document.body.innerHTML = renderSellerView()

    const catalog = await createSellerCatalog(node)
    const activeImageURLs = new Set()

    document.getElementById('mi-clave').textContent = catalog.publicKey

    // Botón copiar clave
    document.getElementById('btn-copiar-clave').onclick = () => {
        navigator.clipboard.writeText(catalog.publicKey)
        alert('Clave copiada al portapapeles')
    }

    // Form de añadir producto
    document.getElementById('form-producto').onsubmit = async (e) => {
        e.preventDefault()

        const name = document.getElementById('prod-nombre').value
        const price = parseFloat(document.getElementById('prod-precio').value)
        const description = document.getElementById('prod-descripcion').value
        const fileInput = document.getElementById('prod-imagenes')

        const images = await Promise.all(
            Array.from(fileInput.files).map(async (file) => ({
                buffer: Buffer.from(await file.arrayBuffer()),
                filename: file.name,
                mimeType: file.type
            }))
        )

        await catalog.addProduct({ name, price, description }, images)

        e.target.reset()
        await refrescarProductos()
    }

    async function refrescarProductos() {
        const productos = await catalog.listProducts()
        const lista = document.getElementById('mis-productos')
        cleanupImages()
        lista.innerHTML = ''

        for (const p of productos) {
            const card = document.createElement('div')
            card.className = 'producto-card'

            if (p.images?.length > 0) {
                const img = document.createElement('img')
                const buffer = Buffer.from(p.images[0].data, 'base64')
                const blob = new Blob([buffer], { type: p.images[0].mimeType })
                const url = URL.createObjectURL(blob)
                img.src = url
                activeImageURLs.add(url)
                card.appendChild(img)
            }

            const nombre = document.createElement('h3')
            nombre.textContent = p.name
            card.appendChild(nombre)

            const precio = document.createElement('p')
            precio.textContent = `${p.price} €`
            card.appendChild(precio)

            const btnBorrar = document.createElement('button')
            btnBorrar.textContent = 'Eliminar'
            btnBorrar.onclick = async () => {
                await catalog.deleteProduct(p.id)
                await refrescarProductos()
            }
            card.appendChild(btnBorrar)

            lista.appendChild(card)
        }
    }

    function cleanupImages() {
        for (const url of activeImageURLs) URL.revokeObjectURL(url)
        activeImageURLs.clear()
    }

    await refrescarProductos()
}