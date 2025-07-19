const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')
const http = require('http') // Mudado para HTTP

const server = jsonServer.create()
const router = jsonServer.router('./database.json')
let userdb = JSON.parse(fs.readFileSync('./usuarios.json', 'UTF-8'))

// Middleware para CORS - configurado para HTTP
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000') // Mudado para HTTP
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  next()
})

// Log de todas as requisições
server.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

function createToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

function usuarioExiste({ email, senha }) {
  return userdb.usuarios.findIndex(user => user.email === email && user.senha === senha) !== -1
}

function emailExiste(email) {
  return userdb.usuarios.findIndex(user => user.email === email) !== -1
}

// Endpoint para registrar usuário
server.post('/public/registrar', (req, res) => {
  console.log('🆕 Tentativa de registro:', req.body);
  const { email, senha, nome, endereco, complemento, cep } = req.body;

  if (!email || !senha || !nome) {
    console.log('❌ Campos obrigatórios faltando');
    return res.status(400).json({ 
      status: 400, 
      message: 'Email, senha e nome são obrigatórios!' 
    });
  }

  if (emailExiste(email)) {
    console.log('❌ E-mail já existe:', email);
    const status = 401;
    const message = 'E-mail já foi utilizado!';
    res.status(status).json({ status, message });
    return
  }

  fs.readFile("./usuarios.json", (err, data) => {
    if (err) {
      console.error('❌ Erro ao ler arquivo usuarios.json:', err);
      const status = 500
      const message = 'Erro interno do servidor'
      res.status(status).json({ status, message })
      return
    };

    try {
      const json = JSON.parse(data.toString());
      const last_item_id = json.usuarios.length > 0 ? json.usuarios[json.usuarios.length - 1].id : 0;

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
      
      fs.writeFile("./usuarios.json", JSON.stringify(json), (err) => {
        if (err) {
          console.error('❌ Erro ao escrever arquivo usuarios.json:', err);
          const status = 500
          const message = 'Erro ao salvar usuário'
          res.status(status).json({ status, message })
          return
        }
        
        userdb = json;
        const access_token = createToken({ email, senha });
        console.log('✅ Usuário registrado com sucesso:', novoUsuario.email);
        res.status(200).json({ access_token });
      });
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      res.status(500).json({ status: 500, message: 'Erro interno do servidor' });
    }
  });
})

// Endpoint para login
server.post('/public/login', (req, res) => {
  console.log('🔑 Tentativa de login:', req.body);
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    console.log('❌ Email ou senha faltando');
    return res.status(400).json({ 
      status: 400, 
      message: 'Email e senha são obrigatórios!' 
    });
  }

  if (!usuarioExiste({ email, senha })) {
    const status = 401
    const message = 'E-mail ou senha incorretos!'
    console.log('❌ Login falhou para:', email);
    res.status(status).json({ status, message })
    return
  }
  
  const access_token = createToken({ email, senha })
  let user = { ...userdb.usuarios.find(user => user.email === email && user.senha === senha) }
  delete user.senha
  console.log('✅ Login bem-sucedido para:', email);
  res.status(200).json({ access_token, user })
})

// Endpoints públicos para livros
server.get('/public/lancamentos', (req, res) => {
  console.log('📚 Buscando lançamentos');
  res.status(200).json([
    {
      "id": 4,
      "categoria": 3,
      "titulo": "Bootstrap 4",
      "slug": "bootstrap-4",
      "descricao": "Conheça a biblioteca front-end mais utilizada no mundo",
      "isbn": "978-85-94188-60-1",
      "numeroPaginas": 172,
      "publicacao": "2018-05-01",
      "imagemCapa": "https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/bootstrap4.png",
      "autor": 4,
      "opcoesCompra": [
        {
          "id": 1,
          "titulo": "E-book",
          "preco": 29.9,
          "formatos": [".pdf", ".pub", ".mob"]
        },
        {
          "id": 2,
          "titulo": "Impresso",
          "preco": 39.9
        },
        {
          "id": 3,
          "titulo": "E-book + Impresso",
          "preco": 59.9,
          "formatos": [".pdf", ".pub", ".mob"]
        }
      ],
      "sobre": "Fazer um site elegante nunca foi tão fácil, mesmo para quem não sabe escrever uma linha de CSS e, muito menos, entende como harmonizar cores, balancear elementos e tipografia."
    },
    {
      "id": 5,
      "categoria": 3,
      "titulo": "Cangaceiro JavaScript",
      "slug": "cangaceiro-javascript",
      "descricao": "Uma aventura no sertão da programação",
      "isbn": "978-85-94188-00-7",
      "numeroPaginas": 502,
      "publicacao": "2017-08-01",
      "imagemCapa": "https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/cangaceirojavascript.png",
      "autor": 5,
      "opcoesCompra": [
        {
          "id": 1,
          "titulo": "E-book",
          "preco": 29.9,
          "formatos": [".pdf", ".pub", ".mob"]
        },
        {
          "id": 2,
          "titulo": "Impresso",
          "preco": 39.9
        },
        {
          "id": 3,
          "titulo": "E-book + Impresso",
          "preco": 59.9,
          "formatos": [".pdf", ".pub", ".mob"]
        }
      ],
      "sobre": "Talvez nenhuma outra linguagem tenha conseguido invadir o coletivo imaginário dos desenvolvedores como JavaScript fez."
    },
    {
      "id": 6,
      "categoria": 3,
      "titulo": "CSS Eficiente",
      "slug": "css-eficiente",
      "descricao": "Técnicas e ferramentas que fazem a diferença nos seus estilos",
      "isbn": "978-85-5519-076-6",
      "numeroPaginas": 144,
      "publicacao": "2015-06-01",
      "imagemCapa": "https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/css.png",
      "autor": 6,
      "opcoesCompra": [
        {
          "id": 1,
          "titulo": "E-book",
          "preco": 29.9,
          "formatos": [".pdf", ".pub", ".mob"]
        },
        {
          "id": 2,
          "titulo": "Impresso",
          "preco": 39.9
        },
        {
          "id": 3,
          "titulo": "E-book + Impresso",
          "preco": 59.9,
          "formatos": [".pdf", ".pub", ".mob"]
        }
      ],
      "sobre": "Quando aprendemos a trabalhar com CSS, frequentemente nos pegamos perdidos em detalhes fundamentais."
    }
  ])
})

server.get('/public/mais-vendidos', (req, res) => {
  console.log('📈 Buscando mais vendidos');
  res.status(200).json([
    {
      "id": 1,
      "categoria": 3,
      "titulo": "Acessibilidade na Web",
      "slug": "acessibilidade-na-web",
      "descricao": "Boas práticas para construir sites e aplicações acessíveis",
      "isbn": "978-65-86110-10-4",
      "numeroPaginas": 246,
      "publicacao": "2020-04-01",
      "imagemCapa": "https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/acessibilidade.png",
      "autor": 1,
      "opcoesCompra": [
        {
          "id": 1,
          "titulo": "E-book",
          "preco": 29.9,
          "formatos": [".pdf", ".pub", ".mob"]
        },
        {
          "id": 2,
          "titulo": "Impresso",
          "preco": 39.9
        },
        {
          "id": 3,
          "titulo": "E-book + Impresso",
          "preco": 59.9,
          "formatos": [".pdf", ".pub", ".mob"]
        }
      ],
      "sobre": "Acessibilidade na Web consiste na eliminação de barreiras de acesso em páginas e aplicações digitais."
    },
    {
      "id": 2,
      "categoria": 3,
      "titulo": "Angular 11 e Firebase",
      "slug": "angular11-e-firebase",
      "descricao": "Construindo uma aplicação integrada com a plataforma do Google",
      "isbn": "978-85-7254-036-0",
      "numeroPaginas": 163,
      "publicacao": "2019-11-01",
      "imagemCapa": "https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/angular.png",
      "autor": 2,
      "opcoesCompra": [
        {
          "id": 1,
          "titulo": "E-book",
          "preco": 29.9,
          "formatos": [".pdf", ".pub", ".mob"]
        },
        {
          "id": 2,
          "titulo": "Impresso",
          "preco": 39.9
        },
        {
          "id": 3,
          "titulo": "E-book + Impresso",
          "preco": 59.9,
          "formatos": [".pdf", ".pub", ".mob"]
        }
      ],
      "sobre": "O Angular é uma plataforma que facilita a construção de aplicativos."
    },
    {
      "id": 3,
      "categoria": 1,
      "titulo": "Arquitetura de software distribuído",
      "slug": "arquitetura-de-software-distribuído",
      "descricao": "Boas práticas para um mundo de microsserviços",
      "isbn": "978-65-86110-86-9",
      "numeroPaginas": 138,
      "publicacao": "2021-10-01",
      "imagemCapa": "https://raw.githubusercontent.com/viniciosneves/alurabooks/curso-novo/public/imagens/livros/arquitetura.png",
      "autor": 3,
      "opcoesCompra": [
        {
          "id": 1,
          "titulo": "E-book",
          "preco": 29.9,
          "formatos": [".pdf", ".pub", ".mob"]
        },
        {
          "id": 2,
          "titulo": "Impresso",
          "preco": 39.9
        },
        {
          "id": 3,
          "titulo": "E-book + Impresso",
          "preco": 59.9,
          "formatos": [".pdf", ".pub", ".mob"]
        }
      ],
      "sobre": "Fazer com que os custos de manutenção desses softwares não ultrapassem o valor é um desafio."
    }
  ])
})

// Middleware de autenticação para rotas protegidas
server.use(/^(?!\/(public|livros|autores|categorias)).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Token inválido'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Token de autenticação não encontrado'
      res.status(status).json({ status, message })
      return
    }
    next()
  } catch (err) {
    const status = 401
    const message = 'Token revogado'
    res.status(status).json({ status, message })
  }
})

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
     <p><strong>CORS configurado para:</strong> http://localhost:3000</p>
    `
    res.status(200).contentType("text/html").send(meuHtml)
})

// Usar o router do json-server para outras rotas
server.use(router)

// Configurar servidor HTTP (sem SSL)
http.createServer(server).listen(8000, () => {
  console.log("=== API AluraBooks ===")
  console.log("🚀 Servidor disponível em: http://localhost:8000")
  console.log("📚 Documentação em: http://localhost:8000/public/docs")
  console.log("🔧 CORS configurado para: http://localhost:3000")
  console.log("========================")
})
