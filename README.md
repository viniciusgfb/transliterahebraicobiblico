# Translitera - Hebraico bíblico

Web app/PWA estático para GitHub Pages, pensado para celular.

## Estrutura

- `index.html` — entrada do aplicativo
- `styles.css` — interface responsiva
- `app.js` — mecânicas do jogo
- `data/banco.json` — nomes e palavras relacionadas
- `data/letters.json` — letras hebraicas
- `data/marks.json` — niqqud, modificadores e outros sinais
- `assets/` — ícones e imagem original
- `manifest.webmanifest` — instalação como PWA
- `service-worker.js` — cache do aplicativo
- `.nojekyll` — evita processamento desnecessário do Jekyll

## GitHub Pages

1. Crie um repositório.
2. Envie todos os arquivos mantendo as pastas.
3. Em **Settings > Pages**, selecione **Deploy from a branch**, branch `main` e pasta `/(root)`.
4. Abra a URL fornecida pelo GitHub Pages.

O aplicativo precisa ser servido por HTTP/HTTPS; abrir `index.html` diretamente com `file://` pode impedir o carregamento dos arquivos JSON.

## Banco

O banco atual contém 31 nomes. Novos registros podem ser acrescentados ao `data/banco.json` seguindo a mesma estrutura.
