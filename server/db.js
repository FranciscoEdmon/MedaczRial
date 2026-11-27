const { Pool, types } = require('pg');

// Los identificadores importados de MySQL son enteros de 32 bits.
types.setTypeParser(20, Number);

function consultas(cliente) {
  return {
    async execute(sql, valores = []) {
      let posicion = 0;
      const consulta = sql.replace(/\?/g, () => '$' + ++posicion);
      const resultado = await cliente.query(consulta, valores);
      if (resultado.command === 'SELECT') return [resultado.rows];
      return [{ affectedRows: resultado.rowCount, insertId: resultado.rows[0]?.identificador }];
    },
  };
}
<<<<<<< HEAD

=======
//pool sirve para reutilizar recursosque ya están creados y listos para usarse
>>>>>>> b2a408ae63a520f156a20248120e223213a4441a
function crearPool() {
  if (!process.env.DATABASE_URL) throw new Error('Configura DATABASE_URL');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true, ca: require('node:fs').readFileSync(require('node:path').join(__dirname, 'supabase-ca.crt'), 'utf8') },
    max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000,
  });
  return { ...consultas(pool), conectar: () => pool.connect() };
}

async function transaccion(pool, tarea) {
  const cliente = await pool.conectar();
  try {
    await cliente.query('BEGIN');
    const resultado = await tarea(consultas(cliente));
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}
module.exports = { crearPool, transaccion };
