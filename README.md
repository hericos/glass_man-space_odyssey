# 🌌 GLASS MAN: SPACE ODYSSEY

[![PWA](https://img.shields.io/badge/PWA-installável-5A0FC8?logo=pwa&logoColor=white)](#-instalação-no-celular-pwa)
[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)](#%EF%B8%8F-tecnologias)
[![Jogue agora](https://img.shields.io/badge/jogar-online-00f0ff)](https://glass-man-space-odyssey.onrender.com/)

Bem-vindo ao **GLASS MAN: SPACE ODYSSEY**, um emocionante jogo arcade de sobrevivência espacial no estilo roguelike e bullet-hell, com estética cyberpunk neon, física dinâmica de estilhaços de vidro e áudio sintetizado em tempo real!

---

## Sumário

- [Jogue agora](#-jogue-agora)
- [Instalação no celular (PWA)](#-instalação-no-celular-pwa)
- [Mecânicas do jogo](#-mecânicas-do-jogo)
- [Controles](#-controles)
- [Como rodar localmente](#-como-rodar-localmente)
- [Tecnologias](#%EF%B8%8F-tecnologias)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Como o jogo foi criado](#%EF%B8%8F-como-o-jogo-foi-criado)
- [Licença](#-licença)

---

## 🚀 JOGUE AGORA!

Acesse o jogo hospedado e dispute o recorde no ranking global:
👉 **[https://glass-man-space-odyssey.onrender.com/](https://glass-man-space-odyssey.onrender.com/)** 👈

---

## 📱 Instalação no Celular (PWA)

Para rodar o jogo no celular sem aparecer a barra de endereços do navegador (em tela cheia):

1. Abra o navegador do celular e acesse o endereço do jogo (local, staging ou o link oficial).
2. Siga as etapas abaixo dependendo do seu aparelho:
   - **No Android / Chrome**: Deve aparecer a opção automática de instalar ou, ao abrir as opções do navegador (três pontos), clique em **"Adicionar à tela inicial"**. O jogo será instalado e rodará sem barras do navegador.
   - **No iOS / Safari**: Clique no botão de **Compartilhar** (ícone de seta para cima) → **"Adicionar à Tela de Início"**. O jogo abrirá em tela cheia com a barra de status translúcida/escura.

---

## 🎮 Mecânicas do Jogo

No controle do **Homem de Vidro**, você deve explorar salas espaciais repletas de criaturas alienígenas, coletando upgrades premium para sobreviver:

- 🔮 **Rachaduras Dinâmicas**: Conforme o jogador perde vida, o corpo e visor do Homem de Vidro trincam de forma realista por meio de algoritmos fractais de vidro temperado.
- ⚡ **Multiplicador de Combo**: Eliminar inimigos em rápida sucessão ativa um medidor de combo que multiplica a pontuação obtida em até **x5**!
- 🛡️ **Power-ups Avançados**:
  - **Escudo de Vidro**: Cria uma bolha protetora que, ao quebrar, lança fragmentos de defesa em 8 direções.
  - **Tiro Triplo Temporal**: Modifica o ataque para disparar estilhaços rosa neon em leque durante 10 segundos.
  - **Mini Clone, Cristal da Sorte, Vidro Temperado** e muito mais!
- 🏆 **Leaderboard Mundial**: Ranking global integrado com APIs de webhook para registrar e exibir os 10 melhores pilotos decrescentemente.
- 🥚 **Developer Menu Easter Egg**: Uma trapaça escondida que permite materializar power-ups se você jogar sob o codinome secreto de piloto correto e souber onde clicar...

---

## 🕹 Controles

| Ação | Desktop | Mobile |
|---|---|---|
| Movimentação | `W` `A` `S` `D` | Joystick virtual esquerdo |
| Atirar estilhaços | `↑` `↓` `←` `→` | Joystick virtual direito |
| Pausar | `P` | Botão de pausa na tela |

> O jogo detecta automaticamente dispositivos móveis e ativa os joysticks virtuais em tela; em desktop, usa teclado. É necessário jogar na **orientação paisagem** (o jogo pede para girar o aparelho quando necessário).

---

## 💻 Como rodar localmente

Este é um projeto 100% front-end (HTML/CSS/JS puro), sem build step nem dependências — basta servir os arquivos estáticos:

```bash
git clone https://github.com/hericos/glass_man-space_odyssey.git
cd glass_man-space_odyssey

# qualquer servidor estático funciona, por exemplo:
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

> O Service Worker (`sw.js`) faz cache dos assets para funcionamento offline/PWA — em `localhost` ele já funciona normalmente; em produção é necessário HTTPS.

---

## 🛠️ Tecnologias

- **Vanilla JavaScript** — motor do jogo, física de partículas e IA dos inimigos (`game.js`)
- **HTML5 Canvas** — renderização do jogo
- **Web Audio API** — trilha sonora e efeitos sonoros sintetizados em tempo real, sem arquivos de áudio
- **CSS Grid/Flexbox** — HUD, telas de menu e responsividade
- **Service Worker + Web App Manifest** — instalação como PWA e cache offline

Sem frameworks, bundlers ou dependências externas pesadas.

## 📁 Estrutura do projeto

```
.
├── index.html        # Telas do jogo (HUD, menus, leaderboard, cheat panel)
├── game.js            # Motor do jogo: física, inimigos, áudio, controles touch/teclado
├── style.css          # Tema visual cyberpunk/neon e responsividade
├── manifest.json      # Manifesto PWA (ícone, cores, orientação)
├── sw.js              # Service Worker (cache offline, stale-while-revalidate)
└── icon.svg           # Ícone do app/PWA
```

---

## 🛠️ Como o Jogo Foi Criado

Este projeto foi uma colaboração incrível e especial:

- 💡 **Idealizador & Game Designer**: **Henzo Nivoliers** (10 anos)
- 💻 **Co-Autor & Programador**: Seu pai, **Herico**
- 🤖 **Tecnologia de IA**: Codificado em conjunto com o modelo **Gemini 3.5 Flash** (Google DeepMind)

Utilizando a imaginação inovadora do Henzo, a mentoria de seu pai Herico, e a inteligência (artificial) do Gemini, desenvolvemos esta experiência rápida, fluida e totalmente nativa (Vanilla JS, CSS Grid/Flexbox, HTML5 Canvas e Web Audio API sintetizada, sem nenhuma dependência ou biblioteca externa pesada).

## 📄 Licença

Este repositório ainda não define uma licença explícita. Entre em contato com o autor ([@hericos](https://github.com/hericos)) antes de reutilizar o código em outros projetos.
