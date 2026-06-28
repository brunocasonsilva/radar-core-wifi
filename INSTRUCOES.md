# 🎯 Radar Core Wi-Fi - Instruções de Uso

## Estrutura do Projeto

O projeto foi criado com React + Google Maps API. Aqui está o que foi gerado:

### Arquivos Principais:
- `src/App.js` - Componente principal com toda a lógica
- `src/App.css` - Estilos da aplicação
- `src/index.js` - Arquivo de entrada
- `public/` - Arquivos estáticos

### Dependências Instaladas:
- `@react-google-maps/api` - Integração com Google Maps
- `html2pdf.js` - Geração de PDF

---

## Como Começar

### 1. **Instalação de Dependências**
Já foi feita! Mas se precisar reinstalar:
```bash
npm install
```

### 2. **Rodar em Desenvolvimento**
```bash
npm start
```

O projeto abrirá em `http://localhost:3000`

### 3. **Build para Produção**
```bash
npm run build
```

Isso gera uma pasta `build/` pronta para deploy.

---

## Funcionalidades Implementadas

✅ **Busca de Estabelecimento**
- Digite o nome ou endereço do estabelecimento
- Clique em "Buscar"
- O mapa centraliza automaticamente

✅ **Seleção de Raio**
- 1 km, 5 km ou 10 km
- Circulo visual no mapa

✅ **Busca de Concorrentes**
- Busca automaticamente a categoria do lugar pesquisado
- Mostra todos os concorrentes no raio selecionado
- Filtra o próprio estabelecimento

✅ **Informações dos Concorrentes**
- Nome
- Distância em km
- Telefone
- Site (com link clicável)
- Avaliação no Google (⭐)
- Horário de funcionamento

✅ **Exportar como PDF**
- Botão "Exportar PDF" para salvar relatório
- Gerado automaticamente com os dados da tabela

---

## Próximas Melhorias Sugeridas

1. **SEO Scraping** - Implementar busca de palavras-chave (pode ser feito com Node.js no backend)
2. **Filtros** - Adicionar filtros por avaliação, horário, etc.
3. **Comparação** - Comparar 2 estabelecimentos lado a lado
4. **Histórico** - Salvar últimas buscas
5. **Backend** - Criar API própria para limitar requisições ao Google Maps

---

## Problemas Comuns

### "Erro: Google Maps não carrega"
- Verifique se a chave API está correta no `App.js`
- Confirme que as APIs estão habilitadas no Google Cloud:
  - Maps JavaScript API
  - Places API

### "Erro de CORS"
- Google Maps pode bloquear se for acessado de domínios não autorizados
- Configure as restrições de origem no Google Cloud Console

### "Não encontra estabelecimentos"
- Garanta que o nome ou endereço estão corretos
- Tente usar nomes mais conhecidos

---

## Deploy

### **Vercel** (Recomendado - você já tem conta)
```bash
npm i -g vercel
vercel
```

### **GitHub Pages**
1. Atualize `package.json`: adicione `"homepage": "https://seu-usuario.github.io/radar-core-wifi"`
2. `npm run build`
3. Faça push para GitHub

### **Hostgator** (Compartilhado)
1. Gere o build: `npm run build`
2. Faça FTP dos arquivos da pasta `build/` para a raiz pública

---

## Estrutura de Arquivos

```
radar-core-wifi/
├── public/
│   └── index.html
├── src/
│   ├── App.js              (Lógica principal)
│   ├── App.css             (Estilos)
│   ├── index.js            (Entrada)
│   └── index.css
├── package.json
└── README.md
```

---

## Variáveis de Ambiente (Importante!)

Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

Depois, atualize `App.js` para usar:
```javascript
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
```

**NUNCA** deixe a chave exposta no código publicado!

---

## Próximo Passo?

Já pode testar a aplicação rodando `npm start`. 

Se tiver dúvidas ou quiser adicionar mais funcionalidades, me avisa! 🚀
