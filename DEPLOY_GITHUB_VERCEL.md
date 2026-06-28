# 🚀 Deploy: GitHub + Vercel

## PASSO 1: Preparar projeto localmente

### 1.1 Configurar variáveis de ambiente

Crie arquivo `.env` na raiz do projeto:

```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyCsXzMSKKBHMqTuy4dRW7sOL0d3NgAk4JI
```

### 1.2 Adicionar `.env` ao `.gitignore`

Abra `.gitignore` e verifique se tem:

```
.env
.env.local
.env.*.local
```

### 1.3 Atualizar `App.js`

Troque esta linha:

```javascript
const GOOGLE_MAPS_API_KEY = 'AIzaSyCsXzMSKKBHMqTuy4dRW7sOL0d3NgAk4JI';
```

Por:

```javascript
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
```

---

## PASSO 2: GitHub

### 2.1 Criar repositório no GitHub

1. Vá em https://github.com/new
2. Nome do repositório: `radar-core-wifi`
3. Descrição: "Análise de concorrentes por raio de cobertura - Core Wi-Fi"
4. Deixe **Public** (Vercel precisa acessar)
5. Clique **Create repository**

### 2.2 No seu computador, dentro da pasta do projeto

```bash
git init
git add .
git commit -m "Initial commit - Radar Core Wi-Fi"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/radar-core-wifi.git
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu usuário do GitHub**

---

## PASSO 3: Vercel

### 3.1 Acesse Vercel

1. Vá em https://vercel.com
2. Clique **Sign Up**
3. Escolha **Continue with GitHub**
4. Autorize Vercel a acessar sua conta GitHub

### 3.2 Importar projeto

1. Clique **Add New Project**
2. Clique **Import Git Repository**
3. Cole: `https://github.com/SEU_USUARIO/radar-core-wifi.git`
4. Clique **Continue**

### 3.3 Configurar variáveis de ambiente

Na tela **Configure Project**:

1. Expanda **Environment Variables**
2. Adicione:
   - **Name:** `REACT_APP_GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSyCsXzMSKKBHMqTuy4dRW7sOL0d3NgAk4JI`
3. Clique **Add**

### 3.4 Deploy

1. Clique **Deploy**
2. Aguarde (leva 2-5 minutos)
3. Pronto! Seu site estará online 🎉

Vercel fornecerá um link como: `https://radar-core-wifi.vercel.app`

---

## PASSO 4: Atualizações futuras

Sempre que quiser atualizar:

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

**Vercel faz redeploy automaticamente!**

---

## Checklist Final

- ✅ `.env` criado localmente (não commitado)
- ✅ `App.js` usa `process.env.REACT_APP_GOOGLE_MAPS_API_KEY`
- ✅ Repositório criado no GitHub
- ✅ Código pushado para GitHub
- ✅ Projeto importado no Vercel
- ✅ Variáveis de ambiente adicionadas no Vercel
- ✅ Deploy realizado

---

## Problemas Comuns

**"Erro: Google Maps não carrega"**
- Verifique se a variável foi adicionada corretamente no Vercel

**"Build falha"**
- Verifique o log no Vercel (clique em "View Build Logs")
- Certifique-se de que `npm install` funcionou

**"Preciso mudar a chave API"**
- Vá em Vercel → Projeto → Settings → Environment Variables
- Atualize o valor
- Clique "Redeploy" automaticamente

---

## Links Úteis

- GitHub: https://github.com/seu_usuario/radar-core-wifi
- Vercel Dashboard: https://vercel.com/dashboard
- Google Cloud Console: https://console.cloud.google.com

Pronto! Seu projeto está online! 🚀
