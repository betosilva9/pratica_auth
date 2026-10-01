// Importa o Express para criar a API REST
const express = require("express");

// Importa o Pool para gerenciar conexões com o PostgreSQL
const { Pool } = require("pg");

// Importa o bcrypt para criptografar e comparar senhas
const bcrypt = require("bcrypt");

// Importa o JWT para gerar tokens de autenticação
const jwt = require("jsonwebtoken");

// Carrega as variáveis do arquivo .env
require("dotenv").config();

// Cria a aplicação Express
const app = express();

// Permite que a API receba dados no formato JSON
app.use(express.json());

// Cria o pool de conexões com o PostgreSQL
const pool = new Pool({
  // Endereço do PostgreSQL
  host: process.env.DB_HOST,

  // Porta padrão do PostgreSQL
  port: Number(process.env.DB_PORT),

  // Usuário do PostgreSQL
  user: process.env.DB_USER,

  // Senha do PostgreSQL
  password: process.env.DB_PASSWORD,

  // Nome do banco de dados
  database: process.env.DB_NAME,
});

// Cria uma rota inicial para testar a API
app.get("/health", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");

    return res.status(200).json({
      status: "OK",
      mensagem: "Servidor e PostgreSQL funcionando!",
      banco: "conectado",
      horarioBanco: resultado.rows[0].now,
    });
  } catch (erro) {
    console.error(erro);

    return res.status(500).json({
      status: "ERRO",
      mensagem: "Falha na conexão com PostgreSQL.",
      banco: "desconectado",
    });
  }
});
app.post("/usuarios", async (req, res) => {
  try {
        const { nome, email, senha } = req.body;
      if (!nome || !email || !senha) {
      return res.status(400).json({
        mensagem: "Nome, e-mail e senha são obrigatórios.",
      });
    }
    if (senha.length < 6) {
      return res.status(400).json({
        mensagem: "A senha deve possuir pelo menos 6 caracteres.",
      });
    }

    // Remove espaços e converte o e-mail para letras minúsculas
    const emailFormatado = email.trim().toLowerCase();

    // Pesquisa se o e-mail já está cadastrado
    const usuarioExistente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [emailFormatado]
    );

    // Verifica se encontrou algum usuário
    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        mensagem: "E-mail já cadastrado.",
      });
    }

    // Cria o hash seguro da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere o usuário no banco de dados
    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, email, senha)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em`,
      [nome.trim(), emailFormatado, senhaHash]
    );

    // Obtém o usuário retornado pelo PostgreSQL
    const usuarioCriado = resultado.rows[0];

    // Retorna o usuário cadastrado sem mostrar a senha
    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso.",
      usuario: usuarioCriado,
    });
  } catch (erro) {
    // Mostra o erro completo no terminal
    console.error("Erro ao cadastrar usuário:", erro);

    // O código 23505 representa uma violação de campo UNIQUE
    if (erro.code === "23505") {
      return res.status(409).json({
        mensagem: "E-mail já cadastrado.",
      });
    }

    // Retorna um erro genérico
    return res.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
});

// Cria a rota para realizar o login
app.post("/login", async (req, res) => {
  try {
    // Obtém o e-mail e a senha enviados
    const { email, senha } = req.body;

    // Verifica se os campos foram preenchidos
    if (!email || !senha) {
      return res.status(400).json({
        mensagem: "E-mail e senha são obrigatórios.",
      });
    }

    // Formata o e-mail antes de realizar a pesquisa
    const emailFormatado = email.trim().toLowerCase();

    // Pesquisa o usuário pelo e-mail
    const resultado = await pool.query(
      "SELECT id, nome, email, senha FROM usuarios WHERE email = $1",
      [emailFormatado]
    );

    // Verifica se o usuário não foi encontrado
    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    // Obtém o usuário encontrado
    const usuario = resultado.rows[0];

    // Compara a senha digitada com o hash salvo no banco
    const senhaCorreta = await bcrypt.compare(
      senha,
      usuario.senha
    );

    // Verifica se a senha está incorreta
    if (!senhaCorreta) {
      return res.status(401).json({
        mensagem: "E-mail ou senha inválidos.",
      });
    }

    // Gera o token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Retorna o token e os dados públicos do usuário
    return res.status(200).json({
      mensagem: "Login realizado com sucesso.",
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
      token,
    });
  } catch (erro) {
    // Mostra o erro completo no terminal
    console.error("Erro ao realizar login:", erro);

    // Retorna um erro genérico
    return res.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
});

// Define a porta da aplicação
const PORT = Number(process.env.PORT) || 3000;

// Testa a conexão antes de iniciar a API
async function iniciarServidor() {
  try {
    // Executa uma consulta simples no PostgreSQL
    await pool.query("SELECT NOW()");

    // Informa que a conexão funcionou
    console.log("Conexão com o PostgreSQL realizada com sucesso.");

    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`Servidor executando em http://localhost:${PORT}`);
    });
  } catch (erro) {
    // Mostra o motivo da falha
    console.error("Não foi possível conectar ao PostgreSQL:", erro.message);

    // Encerra o programa com erro
    process.exit(1);
  }
}
app.get("/produtos", async (req, res) => {
  try {
      const resultado = await pool.query(
      `SELECT id, nome, preco
       FROM produtos
       WHERE disponivel = TRUE
       ORDER BY nome`
    );

    return res.status(200).json(resultado.rows);
  } catch (erro) {
    
    console.error("Erro ao consultar produtos:", erro);

    
    return res.status(500).json({
      mensagem: "Erro interno do servidor.",
    });
  }
});


iniciarServidor();