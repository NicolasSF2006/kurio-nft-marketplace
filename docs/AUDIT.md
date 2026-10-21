# Reproduzir a auditoria

Ambiente de referência: Windows 10 x64, Node 24.11.0, npm 11.6.1. Dependências e Chromium são fixados pelo lockfile/Playwright. Instale com `npm ci` e `npm run test:install`. Os 137 assets originais, a fonte local, 16 derivados WebP e baselines acompanham o código. Não há serviço privado.

```sh
npm run typecheck
npm run lint
npm run build
npm run build:demo
npm run test:e2e
npm run test:e2e:demo
```

As suítes iniciam seus próprios servidores. A porta 4173 deve estar livre para a suíte demo. Execute sequencialmente: os diretórios de saída são compartilhados. Traces e diffs de falhas ficam em `test-results/`; HTML em `playwright-report/`. `npm run test:report` abre o HTML. Os testes de interface conferem nove telas em 1440/768/390 e seis frames em 414 × 896. Os dois skips são exclusivamente essas capturas 414 nos projetos desktop/tablet.

## Regressão visual

`npm run test:visual` compara início, detalhe, carrinho e checkout nos três projetos, mais quatro capturas em 414 × 896: 12 casos, 16 PNGs. `npm run test:e2e:demo -- visual.spec.ts` compara a mesma referência contra a build otimizada. As imagens em `tests/baselines/win32/` são arquivos fonte, fora dos relatórios ignorados, prontos para versionamento. Nenhum commit foi feito. O projeto recebido não possuía metadados Git.

Os cenários começam isolados e são montados por UI → Axios → MSW; checkout inclui carteira cadastrada e conectada. Aguarda-se REST, fim de `aria-busy`, conexão, fontes e decode das imagens, retira-se o hover e desativam-se animações na captura. Não há máscara de conteúdo, preço, erro ou carregamento. Tolerância máxima: 0,1% de pixels, além do comparador perceptual padrão do Playwright. A configuração impede criar/atualizar snapshots implicitamente.

Baselines dependem de SO, Chromium e fonte. Para outro SO/versão, compare as imagens e gere uma pasta própria somente após revisão. Não use atualizações de snapshot para esconder regressões. Para uma mudança intencional: execute o teste sem atualização, abra expected/actual/diff e trace, investigue, registre o motivo e só então execute explicitamente, limitando os casos:

```sh
npm run test:visual -- --grep home --update-snapshots=changed
```

O primeiro conjunto desta etapa foi revisado e rejeitado em quatro casos: busca desktop recortada, cinco resultados escondidos em mobile/tablet e metadados do detalhe invertidos. O HTML com diffs foi preservado em `reports/playwright-stage5-visual-review/`. Corrigidas as causas, foram aprovadas somente as alterações esperadas de início e detalhe. Carrinho e checkout não foram atualizados para contornar falhas.

`npm run visual:report` monta os 15 pares Figma/navegador em `reports/visual/comparison-stage5.html`, após os E2E gerarem as capturas. Os 15 exports MCP estão em `docs/figma/`; não são usados na aplicação. A confirmação do relatório é o pedido funcional, não `/order-preview`.

## Acessibilidade e integridade

`npm run test:a11y` executa axe-core 4.14.0 nas nove telas, erros de formulário e recibo confirmado, em três viewports. Inclui texto ampliado a 200%, foco visível e movimento reduzido. JSONs completos em `reports/accessibility/`, anexados também ao HTML. Os testes anteriores de teclado/foco dos diálogos e drawers permanecem. Automação não equivale a uma certificação WCAG nem substitui avaliação com tecnologias assistivas reais.

`integrity.spec.ts` verifica DTO de sessão sem hashes/sal, persistência sem senha clara, remoção do token ao sair, redirecionamento restrito à origem e expiração da cotação com relógio controlado. Os testes de checkout verificam eventos reais, idempotência, usuário incorreto, recusa, timeout e reconexão.

## Lighthouse

Otimizações locais são reproduzíveis: `npm run images:optimize` e `npm run fonts:optimize`. A fonte WOFF2 contém a mesma fonte variável completa, sem remover glifos; TTF e licença continuam locais. `docs/optimized-font.json` registra origem, hashes, ferramenta e redução de tamanho. O teste lento do catálogo verifica nove placeholders e mede CLS com PerformanceObserver antes de trocar cenário.

Primeiro finalize os E2E e mantenha a máquina sem outras auditorias/navegadores de teste em execução. Em um terminal:

```sh
npm run build:demo
npm run preview
```

Em outro:

```sh
npm run lighthouse
```

O padrão mede `/` e `/nfts/emerald-ape-042`, em mobile e desktop, três vezes cada: 12 medições válidas, Chrome novo em cada uma. `npm run lighthouse:desktop` e `lighthouse:mobile` restringem o perfil; caminhos adicionais podem ser passados após o perfil. `LIGHTHOUSE_BASE_URL` muda a origem; `LIGHTHOUSE_OUTPUT_DIR` separa rodadas. Nenhuma origem é bloqueada, imagem omitida ou auditoria desativada para elevar notas. O cenário default tem todos os mocks e recursos visuais ativos.

HTML/JSON individuais e `summary.json` são salvos em `reports/lighthouse/`. O resumo registra medianas P/A/BP/SEO, LCP, CLS, TBT, versões, hardware/SO, throttling, avisos, origens externas e nomes dos relatórios. Apenas falha de execução do Chrome/Lighthouse permite uma nova instância, no máximo uma vez, com registro em `failed-attempts.json` e arquivo separado `-retry`; uma pontuação válida nunca é descartada ou repetida por estar baixa.

As metas são 90/95/95/90. Resultados abaixo delas devem permanecer no relatório final com causas identificadas. Nesta máquina, o Kaspersky injeta JavaScript HTTP externo; a auditoria conserva essa evidência. Não houve alteração no antivírus ou configuração do sistema.

## Publicação preparada

`vercel.json` fixa build demo, saída `dist`, fallback SPA para acesso direto/refresh, cache longo de assets imutáveis e `no-store` do worker MSW, além de headers básicos. Configuração baseada na [documentação Vercel para Vite](https://vercel.com/docs/frameworks/frontend/vite). Na publicação futura, manter `VITE_ENABLE_MOCKS=true`, API `/api`, socket na própria origem e HTTPS. Não definir URLs de serviços reais. Não publicar a build padrão sem mocks para avaliação.

Nenhum deploy foi executado. O fallback remoto e os headers só poderão ser comprovados no provedor após autorização. A URL pública e o repositório continuam pendentes do processo de entrega. Os critérios funcionais e eventuais metas Lighthouse não atendidas são separados na [matriz](COMPLIANCE_MATRIX.md).
