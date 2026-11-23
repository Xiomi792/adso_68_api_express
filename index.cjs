require('dotenv').config();

const express = require('express');
const app = express();
const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port between 1 and 65535');
}

const login = require('./routes/login.cjs');
const register = require('./routes/register.cjs');
const {
  listarInventario,
  agregarProducto,
  actualizarProducto,
  eliminarProducto,
  actualizarStock,
  listarVentas,
  listarPedidos,
  registrarVenta,
  eliminarVenta,
} = require('./routes/inventario.cjs');
const cors = require('cors');

app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/login', login);
app.post('/api/register', register);
app.get('/api/inventario', listarInventario);
app.post('/api/inventario', agregarProducto);
app.put('/api/inventario/stock', actualizarStock);
app.put('/api/inventario/:id', actualizarProducto);
app.delete('/api/inventario/:id', eliminarProducto);
app.get('/api/ventas', listarVentas);
app.post('/api/ventas', registrarVenta);
app.delete('/api/ventas/:id', eliminarVenta);
app.get('/api/pedidos', listarPedidos);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});