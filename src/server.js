const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const http = require('http');
require('dotenv').config();

const DATABASE_PATH = path.resolve(__dirname, '..', 'database.json');
const USERS_PATH = path.resolve(__dirname, '..', 'usuarios.json');

const server = jsonServer.create();
const router = jsonServer.router(DATABASE_PATH);
let userdb = JSON.parse(fs.readFileSync(USERS_PATH, 'UTF-8'));

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET não definido. Um segredo temporário foi gerado para esta execução.');
}

// Middleware para CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Log de todas as requisições (sem expor senha)
server.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(safeBody, 'senha')) {
      safeBody.senha = '***';
    }
    console.log('Body:', safeBody);
  }
  next();
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

function createToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => (decode !== undefined ? decode : err));
}

function usuarioExiste({ email, senha }) {
  return userdb.usuarios.findIndex((user) => user.email === email && user.senha === senha) !== -1;
}

function emailExiste(email) {
  return userdb.usuarios.findIndex((user) => user.email === email) !== -1;
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

// Endpoint para registrar usuário
server.post('/public/registrar', (req, res) => {
  const { email, senha, nome, endereco, complemento, cep } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({
      status: 400,
      message: 'Email, senha e nome são obrigatórios!'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      status: 400,
      message: 'Email inválido!'
    });
  }

  if (!isValidPassword(senha)) {
    return res.status(400).json({
      status: 400,
      message: 'A senha deve ter no mínimo 8 caracteres.'
    });
  }

  if (emailExiste(email)) {
    const status = 401;
    const message = 'E-mail já foi utilizado!';
    res.status(status).json({ status, message });
    return;
  }

  fs.readFile(USERS_PATH, (err, data) => {
    if (err) {
      console.error('❌ Erro ao ler arquivo usuarios.json:', err);
      const status = 500;
      const message = 'Erro interno do servidor';
      res.status(status).json({ status, message });
      return;
    }

    try {
      const json = JSON.parse(data.toString());
      const last_item_id =
        json.usuarios.length > 0 ? json.usuarios[json.usuarios.length - 1].id : 0;

      const novoUsuario = {
        id: last_item_id + 1,
        email,
        senha,
        nome,
        endereco: endereco || '',
        complemento: complemento || '',
        cep: cep || ''
      };

      json.usuarios.push(novoUsuario);

      fs.writeFile(USERS_PATH, JSON.stringify(json), (writeErr) => {
        if (writeErr) {
          console.error('❌ Erro ao escrever arquivo usuarios.json:', writeErr);
          const status = 500;
          const message = 'Erro ao salvar usuário';
          res.status(status).json({ status, message });
          return;
        }

        userdb = json;
        const access_token = createToken({ email });
        console.log('✅ Usuário registrado com sucesso:', novoUsuario.email);
        res.status(200).json({ access_token });
      });
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      res.status(500).json({ status: 500, message: 'Erro interno do servidor' });
    }
  });
});

// Endpoint para login
server.post('/public/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      status: 400,
      message: 'Email e senha são obrigatórios!'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      status: 400,
      message: 'Email inválido!'
    });
  }

  if (!usuarioExiste({ email, senha })) {
    const status = 401;
    const message = 'E-mail ou senha incorretos!';
    console.log('❌ Login falhou para:', email);
    res.status(status).json({ status, message });
    return;
  }

  const access_token = createToken({ email });
  let user = { ...userdb.usuarios.find((u) => u.email === email && u.senha === senha) };
  delete user.senha;
  console.log('✅ Login bem-sucedido para:', email);
  res.status(200).json({ access_token, user });
});

// Endpoints públicos para livros
server.get('/public/lancamentos', (req, res) => {
  console.log('📚 Buscando lançamentos');
  res.status(200).json([
    {
      id: 4,
      categoria: 3,
      titulo: 'Bootstrap 4',
      slug: 'bootstrap-4',
      descricao: 'Conheça a biblioteca front-end mais utilizada no mundo',
      isbn: '978-85-94188-60-1',
      numeroPaginas: 172,
      publicacao: '2018-05-01',
      imagemCapa:
        'https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/bootstrap4.png',
      autor: 4,
      opcoesCompra: [
        {
          id: 1,
          titulo: 'E-book',
          preco: 29.9,
          formatos: ['.pdf', '.pub', '.mob']
        },
        {
          id: 2,
          titulo: 'Impresso',
          preco: 39.9
        },
        {
          id: 3,
          titulo: 'E-book + Impresso',
          preco: 59.9,
          formatos: ['.pdf', '.pub', '.mob']
        }
      ],
      sobre:
        'Fazer um site elegante nunca foi tão fácil, mesmo para quem não sabe escrever uma linha de CSS e, muito menos, entende como harmonizar cores, balancear elementos e tipografia.'
    },
    {
      id: 5,
      categoria: 3,
      titulo: 'Cangaceiro JavaScript',
      slug: 'cangaceiro-javascript',
      descricao: 'Uma aventura no sertão da programação',
      isbn: '978-85-94188-00-7',
      numeroPaginas: 502,
      publicacao: '2017-08-01',
      imagemCapa:
        'https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/cangaceirojavascript.png',
      autor: 5,
      opcoesCompra: [
        {
          id: 1,
          titulo: 'E-book',
          preco: 29.9,
          formatos: ['.pdf', '.pub', '.mob']
        },
        {
          id: 2,
          titulo: 'Impresso',
          preco: 39.9
        },
        {
          id: 3,
          titulo: 'E-book + Impresso',
          preco: 59.9,
          formatos: ['.pdf', '.pub', '.mob']
        }
      ],
      sobre: 'Talvez nenhuma outra linguagem tenha conseguido invadir o coletivo imaginário dos desenvolvedores como JavaScript fez.'
    },
    {
      id: 6,
      categoria: 3,
      titulo: 'CSS Eficiente',
      slug: 'css-eficiente',
      descricao: 'Técnicas e ferramentas que fazem a diferença nos seus estilos',
      isbn: '978-85-5519-076-6',
      numeroPaginas: 144,
      publicacao: '2015-06-01',
      imagemCapa: 'https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/css.png',
      autor: 6,
      opcoesCompra: [
        {
          id: 1,
          titulo: 'E-book',
          preco: 29.9,
          formatos: ['.pdf', '.pub', '.mob']
        },
        {
          id: 2,
          titulo: 'Impresso',
          preco: 39.9
        },
        {
          id: 3,
          titulo: 'E-book + Impresso',
          preco: 59.9,
          formatos: ['.pdf', '.pub', '.mob']
        }
      ],
      sobre:
        'Quando aprendemos a trabalhar com CSS, frequentemente nos pegamos perdidos em detalhes fundamentais.'
    }
  ]);
});

server.get('/public/mais-vendidos', (req, res) => {
  console.log('📈 Buscando mais vendidos');
  res.status(200).json([
    {
      id: 1,
      categoria: 3,
      titulo: 'Acessibilidade na Web',
      slug: 'acessibilidade-na-web',
      descricao: 'Boas práticas para construir sites e aplicações acessíveis',
      isbn: '978-65-86110-10-4',
      numeroPaginas: 246,
      publicacao: '2020-04-01',
      imagemCapa:
        'https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/acessibilidade.png',
      autor: 1,
      opcoesCompra: [
        {
          id: 1,
          titulo: 'E-book',
          preco: 29.9,
          formatos: ['.pdf', '.pub', '.mob']
        },
        {
          id: 2,
          titulo: 'Impresso',
          preco: 39.9
        },
        {
          id: 3,
          titulo: 'E-book + Impresso',
          preco: 59.9,
          formatos: ['.pdf', '.pub', '.mob']
        }
      ],
      sobre:
        'Acessibilidade na Web consiste na eliminação de barreiras de acesso em páginas e aplicações digitais.'
    },
    {
      id: 2,
      categoria: 3,
      titulo: 'Angular 11 e Firebase',
      slug: 'angular11-e-firebase',
      descricao: 'Construindo uma aplicação integrada com a plataforma do Google',
      isbn: '978-85-7254-036-0',
      numeroPaginas: 163,
      publicacao: '2019-11-01',
      imagemCapa:
        'https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/angular.png',
      autor: 2,
      opcoesCompra: [
        {
          id: 1,
          titulo: 'E-book',
          preco: 29.9,
          formatos: ['.pdf', '.pub', '.mob']
        },
        {
          id: 2,
          titulo: 'Impresso',
          preco: 39.9
        },
        {
          id: 3,
          titulo: 'E-book + Impresso',
          preco: 59.9,
          formatos: ['.pdf', '.pub', '.mob']
        }
      ],
      sobre: 'O Angular é uma plataforma que facilita a construção de aplicativos.'
    },
    {
      id: 3,
      categoria: 1,
      titulo: 'Arquitetura de software distribuído',
      slug: 'arquitetura-de-software-distribuído',
      descricao: 'Boas práticas para um mundo de microsserviços',
      isbn: '978-65-86110-86-9',
      numeroPaginas: 138,
      publicacao: '2021-10-01',
      imagemCapa:
        'https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/arquitetura.png',
      autor: 3,
      opcoesCompra: [
        {
          id: 1,
          titulo: 'E-book',
          preco: 29.9,
          formatos: ['.pdf', '.pub', '.mob']
        },
        {
          id: 2,
          titulo: 'Impresso',
          preco: 39.9
        },
        {
          id: 3,
          titulo: 'E-book + Impresso',
          preco: 59.9,
          formatos: ['.pdf', '.pub', '.mob']
        }
      ],
      sobre: 'Fazer com que os custos de manutenção desses softwares não ultrapassem o valor é um desafio.'
    }
  ]);
});

// Middleware de autenticação para rotas protegidas
server.use(/^(?!\/(public|livros|autores|categorias)).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401;
    const message = 'Token inválido';
    res.status(status).json({ status, message });
    return;
  }
  try {
    const verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401;
      const message = 'Token de autenticação não encontrado';
      res.status(status).json({ status, message });
      return;
    }
    next();
  } catch (err) {
    const status = 401;
    const message = 'Token revogado';
    res.status(status).json({ status, message });
  }
});

// Documentação da API
server.get('/public/docs', (req, res) => {
  const meuHtml = `
     <h1>Documentação da API AluraBooks</h1>
     <h2>Endpoints Públicos:</h2>
     <ul>
            <li>POST /public/registrar - Registrar novo usuário</li>
            <li>POST /public/login - Fazer login</li>
            <li>GET /public/lancamentos - Listar lançamentos</li>
            <li>GET /public/mais-vendidos - Listar mais vendidos</li>
            <li>GET /public/docs - Esta documentação</li>
     </ul>
     <h2>Endpoints Protegidos (requerem autenticação):</h2>
     <ul>
            <li>GET /pedidos - Listar pedidos do usuário</li>
            <li>GET /livros - Listar todos os livros</li>
            <li>GET /categorias - Listar categorias</li>
            <li>GET /autores - Listar autores</li>
     </ul>
     <p><strong>Servidor rodando em:</strong> http://localhost:8000</p>
     <p><strong>CORS configurado para:</strong> ${CORS_ORIGIN}</p>
    `;
  res.status(200).contentType('text/html').send(meuHtml);
});

// Usar o router do json-server para outras rotas
server.use(router);

if (require.main === module) {
  http.createServer(server).listen(8000, () => {
    console.log('=== API AluraBooks ===');
    console.log('🚀 Servidor disponível em: http://localhost:8000');
    console.log('📚 Documentação em: http://localhost:8000/public/docs');
    console.log(`🔧 CORS configurado para: ${CORS_ORIGIN}`);
    console.log('========================');
  });
}

module.exports = server;
