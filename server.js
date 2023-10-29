const express = require('express');
const { Client } = require('pg');
const pgp = require('pg-promise');
ssl: true; // Habilitar SSL
const path = require('path');
const bodyParser = require('body-parser'); // Agregamos body-parser para manejar datos POST
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:{ 
  rejectUnauthorized: false, 
}};


// Configura Express para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar datos POST
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/visitas', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const query = 'SELECT "IDVisita", "Nombre", "Zona", "Hospedador" FROM visitas';
    const { rows } = await client.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  } finally {
    await client.end();
  }
});

app.get('/visitas/:id', async (req, res) => {
  const id = req.params.id;
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const query = 'SELECT "IDVisita", "Nombre", "Zona", "Hospedador" FROM visitas WHERE "IDVisita" = $1';
    const { rows } = await client.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  } finally {
    await client.end();
  }
});

app.get('/hospedajes', async (req, res) => {
  const zona = req.query.zona;
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const query = 'SELECT "IDHospedaje", "Nombre", "Zona" FROM hospedajes WHERE "Zona" = $1 AND "Visita" IS NULL';
    const { rows } = await client.query(query, [zona]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  } finally {
    await client.end();
  }
});

// Nueva ruta para asignar un hospedador a una visita
app.post('/asignar-visita/:visitaId/:hospedajeId', async (req, res) => {
  const visitaId = req.params.visitaId;
  const hospedajeId = req.params.hospedajeId;
  const client = new Client(dbConfig);

  try {
    await client.connect();

    // Primero, obtén el nombre del hospedaje seleccionado
    const hospedajeQuery = 'SELECT "Nombre" FROM hospedajes WHERE "IDHospedaje" = $1';
    const { rows: hospedajeRows } = await client.query(hospedajeQuery, [hospedajeId]);

    if (hospedajeRows.length === 0) {
      res.status(404).json({ success: false, message: 'Hospedaje no encontrado.' });
      return;
    }

    // Despues, obtén el nombre de la visita
    const visitaQuery = 'SELECT "Nombre" FROM visitas WHERE "IDVisita" = $1';
    const { rows: visitaRows } = await client.query(visitaQuery, [visitaId]);

    if (visitaRows.length === 0) {
      res.status(404).json({ success: false, message: 'Visita no encontrada.' });
      return;
    }

    const hospedajeNombre = hospedajeRows[0].Nombre;
  
    const visitaNombre = visitaRows[0].Nombre;


    // Luego, actualiza la visita con el hospedaje asignado
    const asignarVisitaQuery = 'UPDATE visitas SET "Hospedador" = $1 WHERE "IDVisita" = $2';
    await client.query(asignarVisitaQuery, [hospedajeNombre, visitaId]);

     // Ahora, actualiza todas las filas en la tabla "hospedajes" donde "Visita" coincide con la visita asignada
     const actualizarHospedajesConVisitaQuery = 'UPDATE hospedajes SET "Visita" = NULL WHERE "Visita" = $1';
     await client.query(actualizarHospedajesConVisitaQuery, [visitaNombre]);

    // Ahora, actualiza el campo "Visita" en la tabla "hospedajes" con el valor del campo "Nombre" de la tabla "visitas"
    const actualizarHospedajeQuery = 'UPDATE hospedajes SET "Visita" = $1 WHERE "IDHospedaje" = $2';
    await client.query(actualizarHospedajeQuery, [visitaNombre, hospedajeId]);

    res.json({ success: true, message: 'Asignación realizada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al asignar la visita.' });
  } finally {
    await client.end();
  }
});
app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});


//Ruta información de visitas

app.get('/informacion-visitas', async (req, res) => {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const query = 'SELECT * FROM visitas'; // Selecciona todos los campos de la tabla "visitas"
    const { rows } = await client.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  } finally {
    await client.end();
  }
});
