const express = require('express');
const app = express();
const port = 3000;
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
const env = require('dotenv');
env.config();

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
  console.log(`Example app listening on port ${port}`);
});