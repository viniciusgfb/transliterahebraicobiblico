# Translitera - Hebraico bíblico

Web app estático para GitHub Pages.

## Progresso individual
O progresso é salvo localmente no navegador/dispositivo usando `localStorage`. O GitHub Pages não armazena o progresso dos jogadores.

- O contador principal mostra o progresso da **rodada atual**.
- `total` mostra quantas palavras já foram concluídas neste navegador ao longo das rodadas.
- Ao concluir todo o banco, aparece **Começar nova rodada**, que libera novamente todas as palavras.
- **Reiniciar progresso** apaga a rodada e o histórico deste navegador.
- Outro celular/navegador começa com seu próprio armazenamento local.

## Publicação
1. Envie os arquivos para a raiz do repositório.
2. GitHub → Settings → Pages → Deploy from a branch.
3. Branch `main`, pasta `/(root)`.
