const pool = require('../utils/db.cjs')

const inventarioInicial = [
  { id: 1, nombre: 'Café Espresso', categoria: 'Bebidas', precio: 3500, stock: 18, minimo: 8 },
  { id: 2, nombre: 'Cappuccino', categoria: 'Bebidas', precio: 4800, stock: 10, minimo: 6 },
  { id: 3, nombre: 'Croissant', categoria: 'Panadería', precio: 2600, stock: 12, minimo: 5 },
  { id: 4, nombre: 'Galleta de avena', categoria: 'Snacks', precio: 1900, stock: 4, minimo: 6 },
  { id: 5, nombre: 'Leche de almendra', categoria: 'Extras', precio: 2200, stock: 15, minimo: 7 },
]

let inventarioMemoria = inventarioInicial.map((producto) => ({ ...producto }))

const asegurarTablas = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      categoria VARCHAR(100) DEFAULT 'General',
      precio DECIMAL(10,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      minimo INT NOT NULL DEFAULT 0
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cliente VARCHAR(255) NOT NULL DEFAULT 'Cliente',
      metodo_pago VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      venta_id INT NOT NULL,
      producto_id INT NOT NULL,
      producto_nombre VARCHAR(255) NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
    )
  `)

  const [filas] = await pool.query('SELECT * FROM inventario ORDER BY id DESC')

  if (!filas.length) {
    await Promise.all(
      inventarioInicial.map((producto) =>
        pool.query(
          'INSERT INTO inventario (nombre, categoria, precio, stock, minimo) VALUES (?, ?, ?, ?, ?)',
          [producto.nombre, producto.categoria, producto.precio, producto.stock, producto.minimo],
        ),
      ),
    )
  }
}

const obtenerInventarioDesdeDb = async () => {
  const [rows] = await pool.query('SELECT * FROM inventario ORDER BY id DESC')
  return rows
}

const listarInventario = async (req, res) => {
  try {
    await asegurarTablas()
    const productos = await obtenerInventarioDesdeDb()

    return res.json({
      message: 'Inventario consultado correctamente',
      data: productos,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al consultar el inventario' })
  }
}

const agregarProducto = async (req, res) => {
  const { nombre, categoria, precio, stock, minimo } = req.body

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) <= 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0 ||
    !Number.isInteger(Number(minimo)) ||
    Number(minimo) < 0
  ) {
    return res.status(400).json({ message: 'Faltan datos obligatorios del producto' })
  }

  const nuevoProducto = {
    nombre: nombre.trim(),
    categoria: categoria?.trim() || 'General',
    precio: Number(precio),
    stock: Number(stock) || 0,
    minimo: Number(minimo) || 0,
  }

  try {
    await asegurarTablas()
    const [result] = await pool.query(
      'INSERT INTO inventario (nombre, categoria, precio, stock, minimo) VALUES (?, ?, ?, ?, ?)',
      [nuevoProducto.nombre, nuevoProducto.categoria, nuevoProducto.precio, nuevoProducto.stock, nuevoProducto.minimo],
    )

    const [rows] = await pool.query('SELECT * FROM inventario WHERE id = ?', [result.insertId])
    const productoGuardado = rows[0]

    inventarioMemoria = [productoGuardado, ...inventarioMemoria]

    return res.status(201).json({
      message: 'Producto agregado al inventario',
      producto: productoGuardado,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al guardar el producto en la base de datos' })
  }
}

const actualizarProducto = async (req, res) => {
  const { id } = req.params
  const { nombre, categoria, precio, stock, minimo } = req.body

  if (
    !Number.isInteger(Number(id)) ||
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) <= 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0 ||
    !Number.isInteger(Number(minimo)) ||
    Number(minimo) < 0
  ) {
    return res.status(400).json({ message: 'Los datos del producto no son válidos' })
  }

  try {
    await asegurarTablas()
    const [result] = await pool.query(
      'UPDATE inventario SET nombre = ?, categoria = ?, precio = ?, stock = ?, minimo = ? WHERE id = ?',
      [nombre.trim(), categoria?.trim() || 'General', Number(precio), Number(stock), Number(minimo), Number(id)],
    )

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    const [rows] = await pool.query('SELECT * FROM inventario WHERE id = ?', [id])
    const producto = rows[0]
    inventarioMemoria = inventarioMemoria.map((item) =>
      Number(item.id) === Number(id) ? producto : item,
    )

    return res.json({ message: 'Producto actualizado correctamente', producto })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al actualizar el producto' })
  }
}

const eliminarProducto = async (req, res) => {
  const { id } = req.params

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'El id del producto no es válido' })
  }

  try {
    await asegurarTablas()
    const [result] = await pool.query('DELETE FROM inventario WHERE id = ?', [id])

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    inventarioMemoria = inventarioMemoria.filter((item) => Number(item.id) !== Number(id))
    return res.json({ success: true, message: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al eliminar el producto' })
  }
}

const actualizarStock = async (req, res) => {
  const { id, cambio } = req.body

  if (!Number.isInteger(Number(id)) || !Number.isInteger(Number(cambio)) || Number(cambio) === 0) {
    return res.status(400).json({ message: 'El id o el cambio de stock no son válidos' })
  }

  try {
    await asegurarTablas()
    const [result] = await pool.query(
      'UPDATE inventario SET stock = GREATEST(0, stock + ?) WHERE id = ?',
      [Number(cambio), Number(id)],
    )

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    const [rows] = await pool.query('SELECT * FROM inventario WHERE id = ?', [id])
    const producto = rows[0]
    inventarioMemoria = inventarioMemoria.map((item) =>
      Number(item.id) === Number(id) ? producto : item,
    )
    return res.json({ message: 'Stock actualizado', producto })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al actualizar el stock' })
  }
}

const listarVentas = async (req, res) => {
  try {
    await asegurarTablas()
    const [ventas] = await pool.query('SELECT * FROM ventas ORDER BY id DESC')

    const ventasDetalladas = await Promise.all(
      ventas.map(async (venta) => {
        const [items] = await pool.query('SELECT * FROM pedidos WHERE venta_id = ? ORDER BY id DESC', [venta.id])
        return { ...venta, items }
      }),
    )

    return res.json({ message: 'Ventas consultadas correctamente', ventas: ventasDetalladas })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al consultar ventas' })
  }
}

const listarPedidos = async (req, res) => {
  try {
    await asegurarTablas()
    const [pedidos] = await pool.query('SELECT * FROM pedidos ORDER BY id DESC')
    return res.json({ message: 'Pedidos consultados correctamente', pedidos })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al consultar pedidos' })
  }
}

const registrarVenta = async (req, res) => {
  const { cliente, metodo_pago, items } = req.body

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Debes enviar al menos un producto en la venta' })
  }

  const connection = await pool.getConnection()

  try {
    await asegurarTablas()
    await connection.beginTransaction()

    const totalVenta = 0
    const [ventaResult] = await connection.query(
      'INSERT INTO ventas (cliente, metodo_pago, total) VALUES (?, ?, ?)',
      [cliente?.trim() || 'Cliente', metodo_pago?.trim() || 'Efectivo', totalVenta],
    )

    const ventaId = ventaResult.insertId
    let total = 0

    for (const item of items) {
      const productoId = Number(item.producto_id)
      const cantidad = Number(item.cantidad)

      if (!productoId || cantidad <= 0) {
        throw new Error('Cada producto debe tener una cantidad válida')
      }

      const [productoRows] = await connection.query('SELECT * FROM inventario WHERE id = ?', [productoId])
      const producto = productoRows[0]

      if (!producto) {
        throw new Error('Uno de los productos no existe')
      }

      if (Number(producto.stock) < cantidad) {
        throw new Error(`No hay suficiente stock de ${producto.nombre}`)
      }

      const subtotal = Number(producto.precio) * cantidad
      total += subtotal

      await connection.query(
        'INSERT INTO pedidos (venta_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [ventaId, productoId, producto.nombre, cantidad, producto.precio, subtotal],
      )

      await connection.query('UPDATE inventario SET stock = stock - ? WHERE id = ?', [cantidad, productoId])
    }

    await connection.query('UPDATE ventas SET total = ? WHERE id = ?', [total, ventaId])
    await connection.commit()

    const [ventaActual] = await connection.query('SELECT * FROM ventas WHERE id = ?', [ventaId])
    const [pedidosActuales] = await connection.query('SELECT * FROM pedidos WHERE venta_id = ?', [ventaId])

    return res.status(201).json({
      message: 'Venta registrada con éxito',
      venta: ventaActual[0],
      pedidos: pedidosActuales,
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    return res.status(400).json({ message: error.message || 'Error al registrar la venta' })
  } finally {
    connection.release()
  }
}

const eliminarVenta = async (req, res) => {
  const { id } = req.params

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'El id de la venta no es válido' })
  }

  let connection

  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [ventas] = await connection.query('SELECT id FROM ventas WHERE id = ? FOR UPDATE', [id])
    if (!ventas.length) {
      await connection.rollback()
      return res.status(404).json({ message: 'Venta no encontrada' })
    }

    const [items] = await connection.query(
      'SELECT producto_id, cantidad FROM pedidos WHERE venta_id = ?',
      [id],
    )

    for (const item of items) {
      await connection.query(
        'UPDATE inventario SET stock = stock + ? WHERE id = ?',
        [item.cantidad, item.producto_id],
      )
    }

    await connection.query('DELETE FROM ventas WHERE id = ?', [id])
    await connection.commit()

    return res.json({
      success: true,
      message: 'Venta y pedidos eliminados; el stock fue restaurado',
    })
  } catch (error) {
    if (connection) await connection.rollback()
    console.error(error)
    return res.status(500).json({ message: 'Error al eliminar la venta' })
  } finally {
    if (connection) connection.release()
  }
}

module.exports = {
  listarInventario,
  agregarProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarStock,
  listarVentas,
  listarPedidos,
  registrarVenta,
  eliminarVenta,
}
