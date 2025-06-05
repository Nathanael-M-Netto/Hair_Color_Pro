
# Hair Color Pro 🎨

![Flutter Version](https://img.shields.io/badge/Flutter-%3E%3D3.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Descrição

**Hair Color Pro** é um aplicativo móvel desenvolvido em Flutter, projetado para auxiliar profissionais cabeleireiros e entusiastas da coloração a determinar fórmulas precisas para coloração de cabelos. Com base nas informações fornecidas pelo usuário sobre o cabelo (altura de tom atual, porcentagem de cabelos brancos) e o tom desejado, o aplicativo calcula uma sugestão de fórmula, simplificando o processo de colorimetria capilar.

## ✨ Funcionalidades Principais

* **Autenticação de Usuários:**
    * Criação de conta segura com e-mail e senha.
    * Login para usuários registrados.
    * Uso do `displayName` do Firebase Authentication (definido no registro e editável na tela de perfil).
* **Perfil do Usuário Simplificado:**
    * Visualização do nome de exibição e e-mail.
    * Edição direta do nome de exibição na tela de perfil.
    * Menu de acesso rápido na tela de boas-vindas com opções de perfil, sobre o app e logout.
* **Análise Capilar Detalhada:**
    * Entrada da altura de tom atual do cabelo, porcentagem de cabelos brancos e altura de tom desejada.
    * Guia visual interativo para alturas de tom e nuances na tela de análise, com funcionalidade de zoom ao clicar.
* **Cálculo de Fórmula de Coloração:**
    * Algoritmo para determinar a fórmula de coloração com base nos dados de entrada (utilizando `ColoracaoHelper`).
* **Exibição de Resultados:**
    * Apresentação clara da fórmula sugerida.
    * Opção para copiar a fórmula para a área de transferência.
    * Aviso importante sobre a necessidade de realizar teste de mecha.
* **Interface Intuitiva e Atraente:**
    * Design limpo e fácil de usar, com feedback tátil para interações.
    * Tema visual consistente, com logo personalizado na tela inicial.
    * Layouts responsivos e bem distribuídos nas telas.

## 🛠️ Tecnologias Utilizadas

* **Flutter:** Framework UI para desenvolvimento de aplicativos multiplataforma (versão SDK >=3.0.0).
* **Dart:** Linguagem de programação utilizada pelo Flutter.
* **Firebase:**
    * **Firebase Authentication:** Para gerenciamento de login, registro e perfil básico do usuário (displayName).
* **`image_picker`:** (Dependência mantida para potencial uso futuro, como análise de fotos de cabelo).
* **`flutter_lints`:** Para análise estática e boas práticas de código.

## 🖼️ Telas Principais

* Tela de Boas-vindas (Landing Screen) com logo e opções de acesso.
* Tela de Login e Registro com validações e feedback.
* Tela Inicial Pós-Login com saudação e menu de acesso rápido.
* Tela de Análise Capilar (Hair Input) com campos de entrada e guia visual interativo.
* Tela de Resultados da Fórmula.
* Tela de Perfil do Usuário com visualização e edição do nome de exibição.

## 🚀 Configuração e Instalação

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/SEU_USUARIO/arte_de_colorir_cabelos.git](https://github.com/SEU_USUARIO/arte_de_colorir_cabelos.git) # Considere atualizar o nome do repositório também
    cd arte_de_colorir_cabelos # ou o novo nome do diretório
    ```
2.  **Certifique-se de ter o Flutter SDK instalado.**
    * [Instruções de instalação do Flutter](https://flutter.dev/docs/get-started/install)
3.  **Configuração do Firebase (Apenas Authentication):**
    * Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
    * Adicione aplicativos iOS e Android ao seu projeto Firebase e configure o Firebase Authentication.
    * Siga as instruções para adicionar os arquivos de configuração do Firebase ao seu projeto Flutter (geralmente `google-services.json` para Android e `GoogleService-Info.plist` para iOS).
    * O arquivo `lib/firebase_options.dart` já deve estar configurado com as opções do seu projeto Firebase (gerado via FlutterFire CLI).
4.  **Adicione os Assets:**
    * Crie a pasta `assets/images/` na raiz do projeto.
    * Adicione seu `logo.jpg` e o guia visual (`Cuidados Cabelo Descolorido.jpeg`) a esta pasta.
    * Certifique-se que o `pubspec.yaml` declara a pasta `assets/images/`.
5.  **Instale as Dependências:**
    ```bash
    flutter pub get
    ```
6.  **Execute o Aplicativo:**
    ```bash
    flutter run
    ```

## 📂 Estrutura do Projeto (Simplificada)

```
arte_de_colorir_cabelos/ # ou HairColorPro/
├── android/
├── ios/
├── lib/
│   ├── main.dart              # Ponto de entrada, tema, rotas
│   ├── firebase_options.dart  # Configs do Firebase
│   ├── screens/               # Widgets de UI para cada tela
│   │   ├── landing_screen.dart
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   ├── post_login_welcome_screen.dart
│   │   ├── hair_input_screen.dart
│   │   ├── result_screen.dart
│   │   └── profile_screen.dart  # Tela de perfil simplificada com edição de nome
│   ├── helpers/               # Classes auxiliares
│   │   ├── coloracao_helper.dart
│   │   └── services/
│   │       └── user_service.dart # Simplificado para Auth
│   └── widgets/               # (Opcional) Widgets reutilizáveis
├── assets/
│   └── images/                # Contém logo.jpg e o guia visual
├── pubspec.yaml               # Definições do projeto e dependências
└── README.md                  # Este arquivo
```

## 🔮 Próximos Passos / Melhorias Futuras (Sugestões)

* **Seleção de Nuances/Reflexos:** Permitir que o usuário especifique a nuance desejada na tela de análise.
* **Lógica de Colorimetria Mais Detalhada:** Continuar refinando o `ColoracaoHelper` com regras mais complexas (neutralização avançada, estrela de Oswald).
* **Histórico de Cálculos:** Salvar as análises feitas pelo usuário localmente (`shared_preferences` ou `sqflite`).
* **Internacionalização (i18n):** Suporte a múltiplos idiomas.
* **Testes:** Aumentar a cobertura de testes unitários e de widgets.
* **Dicas e Informações:** Incluir mais dicas de colorimetria no app.

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tiver sugestões para melhorar o aplicativo, sinta-se à vontade para abrir uma *issue* ou enviar um *pull request*.

1.  Faça um *fork* do projeto.
2.  Crie uma nova *branch* (`git checkout -b feature/nova-funcionalidade`).
3.  Faça *commit* das suas alterações (`git commit -am 'Adiciona nova funcionalidade'`).
4.  Faça *push* para a *branch* (`git push origin feature/nova-funcionalidade`).
5.  Abra um *Pull Request*.

## 📄 Licença

Este projeto é licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido para JottaLean. por Nathanael Netto
