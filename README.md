# Translitera — Hebraico Bíblico

Jogo web estático, pensado para celular e GitHub Pages, para praticar a transliteração de nomes hebraicos bíblicos.

## Estrutura

- `index.html` — interface do app.
- `styles.css` — visual responsivo.
- `app.js` — lógica do jogo.
- `data/banco.json` — nomes, Strong, significados, relações e referências.
- `data/letters.json` — letras hebraicas e transliterações.
- `data/marks.json` — vogais, modificadores e sinais.
- `assets/` — ícones derivados da imagem fornecida.
- `manifest.webmanifest` — instalação como PWA.
- `service-worker.js` — cache básico para uso offline depois da primeira visita.

## Publicar no GitHub Pages

1. Crie um repositório e coloque todos estes arquivos na raiz.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**.
4. Selecione a branch (por exemplo `main`) e a pasta `/ (root)`.
5. Aguarde a publicação. O endereço será algo como `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

> Como o app usa `fetch()` para ler JSON, teste pelo GitHub Pages ou por um servidor local. Abrir `index.html` diretamente com `file://` pode bloquear o carregamento dos JSONs.

## Como expandir o banco

Edite `data/banco.json`. Cada nome possui:

- `he`: hebraico com sinais.
- `hePlain`: hebraico sem sinais.
- `pt`: nome em português.
- `translit`: transliteração de referência.
- `strong`: Strong do nome.
- `meaning`: significado.
- `related`: palavras relacionadas, cada uma com hebraico, transliteração, português, Strong e significado.
- `refs`: referências bíblicas.

O jogo seleciona aleatoriamente apenas nomes que ainda não foram concluídos no aparelho.

## Observação linguística

A mecânica usa uma transliteração didática simplificada para tornar o jogo acessível. A transliteração exibida no banco pode seguir uma convenção acadêmica diferente. Para um curso mais rigoroso, os campos `game` de `letters.json` e `marks.json` podem ser ajustados para a convenção desejada.

## Fonte dos dados iniciais

Os dados iniciais foram conferidos em páginas do Bible Hub/Strong's Hebrew durante a montagem do projeto. Ao ampliar o banco, é recomendável registrar a referência de cada novo item e revisar as relações etimológicas, pois “palavra relacionada” pode significar raiz, cognato, termo semântico ou apenas associação bíblica.
