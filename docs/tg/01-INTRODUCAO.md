# 1. Introdução

## 1.1 Contexto

A coloração capilar profissional depende de uma habilidade especializada chamada **colorimetria**: a capacidade de identificar com precisão a cor atual do cabelo (altura de tom, subtom, percentual de cabelos brancos) e calcular a fórmula química exata para alcançar o resultado desejado. Erros nesse processo geram desde tons indesejados (verde, laranja, azul) até danos químicos severos — comprometendo a qualidade do serviço e a confiança do cliente.

Tradicionalmente, esse conhecimento é adquirido por experiência prática e referência a paletas físicas fornecidas pelos fabricantes (L'Oréal, Wella, Schwarzkopf, entre outros). Cabeleireiros experientes desenvolvem o "olho clínico" para identificar visualmente a altura de tom em uma escala internacional de 1 (preto) a 12 (platinado), assim como o subtom (frio, neutro, quente) e o percentual de fios brancos. Para profissionais em formação, ou para os que atendem clientes pontualmente, esse processo é fonte recorrente de insegurança e erro.

## 1.2 Motivação

O projeto nasceu da rotina do salão **Jotta Lean Cabelos**, onde a necessidade de uma ferramenta digital que auxiliasse o diagnóstico foi identificada não como teoria, mas como problema cotidiano da cadeira do cliente. A versão Flutter anterior (referenciada em `../lib/`, `../android/`) já oferecia funcionalidades básicas, mas era restrita ao ecossistema mobile nativo e não integrava inteligência artificial generativa.

A presente versão (v2) reformula o produto sob três premissas:

1. **Acessibilidade** — funcionar em qualquer dispositivo com navegador, instalável como aplicativo nativo (PWA) sem fricção de loja de apps.
2. **Determinismo** — o reconhecimento de cor deve ser auditável, reprodutível e independente de variações em modelos de IA.
3. **Comunicação profissional** — o resultado deve ser apresentado em linguagem técnica acessível, redigida no padrão de uma cabeleireira experiente — papel que se atribui à camada de inteligência artificial.

## 1.3 Objetivos

### 1.3.1 Objetivo geral

Desenvolver uma aplicação web progressiva que automatize o diagnóstico de cor capilar a partir de uma fotografia, integrando colorimetria computacional clássica com geração de pareceres por inteligência artificial generativa.

### 1.3.2 Objetivos específicos

1. Implementar um pipeline de análise de cor determinístico que converta pixels RGB em coordenadas perceptuais CIE Lab e identifique o tom mais próximo de uma paleta de referência industrial pela métrica CIEDE2000.
2. Construir uma paleta de referência de cerca de 120 entradas, mapeando combinações de altura de tom (1-12) e reflexos (0-9) com nomes industriais brasileiros e coordenadas Lab calibradas.
3. Integrar um modelo de linguagem (Google Gemini, plano gratuito) responsável exclusivamente pela camada de comunicação humana — transformando os números do diagnóstico em pareceres profissionais em português.
4. Empacotar a aplicação como Progressive Web App instalável, com identidade visual idêntica à de um aplicativo nativo (ícones por plataforma, splash screens, service worker, status bar integrada).
5. Garantir compatibilidade com a base de usuários do aplicativo Flutter pré-existente via Firebase Authentication, sem exigir novo cadastro.

## 1.4 Justificativa

A escolha de combinar colorimetria clássica com IA generativa — em vez de delegar todo o reconhecimento à IA — é uma decisão arquitetural fundamentada em três argumentos:

- **Custo computacional**: modelos de visão consomem da ordem de dezenas de milhares de tokens por análise quando usados para reconhecimento direto de cor; o algoritmo CIEDE2000 roda em poucas dezenas de microssegundos por chamada, em dispositivo do usuário.
- **Determinismo e auditabilidade**: a mesma fotografia, na mesma iluminação, produz o mesmo resultado numérico. Em coloração química, isso é crítico — fórmulas erradas têm consequências físicas no cliente.
- **Resiliência**: a análise funciona offline; apenas o relatório textual depende de conexão com a API do Gemini. Mesmo sem conexão, um relatório por template é gerado a partir dos mesmos números.

## 1.5 Estrutura do documento

O capítulo 2 apresenta a fundamentação teórica: espaços de cor (sRGB, XYZ, CIE Lab), a métrica CIEDE2000, Progressive Web Apps e a integração de modelos generativos. O capítulo 3 descreve a metodologia — stack tecnológica, decisões arquiteturais e o cronograma de implementação em "blocos". O capítulo 4 detalha a implementação, com trechos de código real do sistema. O capítulo 5 apresenta resultados: capturas de tela, métricas de performance e validação. O capítulo 6 conclui com limitações conhecidas e trabalhos futuros (notadamente o empacotamento como aplicativo nativo via Capacitor).
