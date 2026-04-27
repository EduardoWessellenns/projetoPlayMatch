const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuração do PostgreSQL - AJUSTE A SENHA!
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'playmatch', 
  password: 'wessellenns123', 
  port: 5432,
});

// Testar conexão com o banco
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar com PostgreSQL:', err);
  } else {
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    release();
  }
});

// Rota principal - serve o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Rota de teste da API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Servidor PlayMatch com PostgreSQL! ✅',
    database: 'PostgreSQL conectado'
  });
});

// Rota de cadastro CORRIGIDA - SEM TIMESTAMP NO USERNAME
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    
    console.log('📧 Tentando cadastrar:', { name, email, username });

    // Validações
    if (!name || !email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Validar formato do username
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username deve ter pelo menos 3 caracteres'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username só pode conter letras, números e underscore'
      });
    }

    // Verificar se email já existe
    const checkEmailQuery = 'SELECT id FROM users WHERE email = $1';
    const emailResult = await pool.query(checkEmailQuery, [email]);

    if (emailResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    // Verificar se username já existe
    const checkUsernameQuery = 'SELECT id FROM users WHERE username = $1';
    const usernameResult = await pool.query(checkUsernameQuery, [username]);

    if (usernameResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este username já está em uso'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserir usuário no banco COM O USERNAME ESCOLHIDO PELO USUÁRIO
    const insertQuery = `
      INSERT INTO users (username, email, password_hash) 
      VALUES ($1, $2, $3) 
      RETURNING id, username, email, created_at
    `;

    const result = await pool.query(insertQuery, [username, email, hashedPassword]);
    const newUser = result.rows[0];

    console.log('✅ Usuário cadastrado no PostgreSQL:', newUser);

    res.json({
      success: true,
      message: 'Cadastro realizado com sucesso! 🎉',
      user: {
        id: newUser.id,
        name: name,
        username: newUser.username, // Agora será o username escolhido pelo usuário
        email: newUser.email
      },
      token: 'token_' + newUser.id
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota de login ATUALIZADA
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Tentando login:', { email });

    // Buscar usuário pelo email
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    const user = userResult.rows[0];

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    console.log('✅ Login realizado:', user.username);

    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user: {
        id: user.id,
        name: user.username, // Retorna o username limpo
        username: user.username,
        email: user.email
      },
      token: 'token_' + user.id
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para obter perfil do usuário
app.get('/api/auth/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const userQuery = 'SELECT id, username, email, created_at FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.username, // Retorna o username como nome
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para editar perfil
app.put('/api/auth/profile/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email } = req.body;

    // Verificar se o novo username já existe (excluindo o usuário atual)
    const checkUsernameQuery = 'SELECT id FROM users WHERE username = $1 AND id != $2';
    const usernameResult = await pool.query(checkUsernameQuery, [username, userId]);

    if (usernameResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este username já está em uso'
      });
    }

    // Verificar se o novo email já existe (excluindo o usuário atual)
    const checkEmailQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2';
    const emailResult = await pool.query(checkEmailQuery, [email, userId]);

    if (emailResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está em uso'
      });
    }

    // Atualizar usuário
    const updateQuery = `
      UPDATE users 
      SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING id, username, email
    `;

    const result = await pool.query(updateQuery, [username, email, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para listar usuários (apenas para teste)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC');
    
    res.json({
      success: true,
      users: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários'
    });
  }
});

// Rota para migrar usuários existentes (corrigir timestamps)
app.post('/api/auth/migrate-users', async (req, res) => {
  try {
    console.log('🔄 Iniciando migração de usuários...');

    // Buscar usuários com timestamps no username
    const usersResult = await pool.query(`
      SELECT id, username, email 
      FROM users 
      WHERE username LIKE '%\\_%\\_%' 
      AND username ~ '_\\d{13}$'
    `);

    console.log(`📊 Encontrados ${usersResult.rows.length} usuários para migrar`);

    const migrationResults = [];

    for (const user of usersResult.rows) {
      // Extrair nome base (remove o timestamp)
      const baseUsername = user.username.replace(/_\d{13}$/, '');
      
      // Gerar novo username limpo
      const newUsername = baseUsername.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      // Verificar se o novo username já existe
      const checkQuery = 'SELECT id FROM users WHERE username = $1 AND id != $2';
      const checkResult = await pool.query(checkQuery, [newUsername, user.id]);
      
      let finalUsername = newUsername;
      
      // Se já existir, adiciona número
      if (checkResult.rows.length > 0) {
        finalUsername = newUsername + '_' + Math.floor(Math.random() * 1000);
      }

      // Atualizar usuário
      await pool.query(
        'UPDATE users SET username = $1 WHERE id = $2',
        [finalUsername, user.id]
      );

      migrationResults.push({
        old_username: user.username,
        new_username: finalUsername
      });

      console.log(`✅ Migrado: ${user.username} → ${finalUsername}`);
    }

    console.log('🎉 Migração concluída com sucesso!');

    res.json({
      success: true,
      message: `Migração concluída! ${migrationResults.length} usuários migrados.`,
      results: migrationResults
    });
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro durante a migração'
    });
  }
});

// Rota para servir outras páginas do frontend
app.get('/cadastro.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/cadastro.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/perfil.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/perfil.html'));
});

app.get('/minhas_partidas.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/minhas_partidas.html'));
});

app.get('/partidas-disponiveis.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/partidas-disponiveis.html'));
});

app.get('/mapa.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/mapa.html'));
});

app.get('/detalhes-partidas.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/detalhes-partidas.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`📱 Frontend disponível em: http://localhost:${PORT}`);
  console.log(`🔧 API disponível em: http://localhost:${PORT}/api`);
  console.log(`📧 Rota de cadastro: http://localhost:${PORT}/api/auth/register`);
  console.log(`🔄 Rota de migração: http://localhost:${PORT}/api/auth/migrate-users`);
});