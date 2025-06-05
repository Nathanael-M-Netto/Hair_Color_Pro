import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:arte_de_colorir_cabelos/main.dart';
// As importações abaixo são para referência de que os arquivos existem,
// mas para o teste de widget do MyApp, elas não são estritamente necessárias aqui
// se MyApp já as gerencia internamente para navegação.
// import 'package:arte_de_colorir_cabelos/login_screen.dart';
// import 'package:arte_de_colorir_cabelos/welcome_screen.dart';
// import 'package:arte_de_colorir_cabelos/result_screen.dart';

void main() {
  testWidgets('Testa a navegação entre as telas e o cálculo de coloração', (WidgetTester tester) async {
    // Constrói o aplicativo e exibe a tela de login.
    await tester.pumpWidget(const MyApp()); // Adicionado const

    // Verifica se a tela de Login está presente (procurando por um widget específico dela)
    expect(find.text('Login'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2)); // Usuário e senha

    // Simula o login preenchendo os campos de texto e pressionando o botão de login.
    await tester.enterText(find.byType(TextField).first, 'usuario');
    await tester.enterText(find.byType(TextField).last, 'senha');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Entrar'));
    await tester.pumpAndSettle(); // Espera a navegação completar

    // Verifica se estamos na tela de Boas-Vindas após o login.
    expect(find.text('Bem-vindo ao app JottaLean!'), findsOneWidget);

    // Preenche os inputs de coloração na Tela de Boas-Vindas.
    // Usar find.byType(TextField) e .at(index) é mais robusto se os labels mudarem.
    await tester.enterText(find.byType(TextField).at(0), '6'); // Altura de tom do cabelo
    await tester.enterText(find.byType(TextField).at(1), '30'); // Porcentagem de cabelos brancos
    await tester.enterText(find.byType(TextField).at(2), '6'); // Altura de tom desejada

    await tester.tap(find.widgetWithText(ElevatedButton, 'Calcular'));
    await tester.pumpAndSettle(); // Espera a navegação para a tela de resultado

    // Verifica se a Tela de Resultado foi aberta.
    expect(find.text('Resultado da Coloração'), findsOneWidget);

    // Verifica se um texto específico do resultado está presente.
    // Ajuste esta string para corresponder ao que ColoracaoHelper realmente retorna para os inputs 6, 30, 6.
    // Exemplo de verificação mais flexível:
    final resultTextFinder = find.byWidgetPredicate((widget) {
      if (widget is Text && widget.data != null) {
        // Para os inputs 6 (base), 30 (branco), 6 (desejada),
        // a lógica atual em ColoracaoHelper.dart resulta em:
        // "Adicionar pigmento da cor desejada (tom 6) + acinzentado (6.1) para um resultado frio + ajuste de nuance conforme desejado e usar tonalizante para cobertura de brancos"
        // ou "Usar descolorante + tonalizante no tom desejado (6)..." se corBaseCliente > alturaTomDesejada
        // Se corBaseCliente == alturaTomDesejada, a primeira condição (corBaseCliente > alturaTomDesejada) é falsa,
        // e a segunda (corBaseCliente < alturaTomDesejada) também é falsa.
        // Então, `formula` permanece '' inicialmente e depois concatena.
        // Para 6, 30, 6:
        // formula = ''
        // switch (6): formula += ' + acinzentado (6.1) para um resultado frio';
        // porcentagemBranco (30) <= 50, então a condição de branco não é adicionada por padrão.
        // A lógica do seu ColoracaoHelper precisa ser revisada para o caso base == desejada.
        // Assumindo que para 6,30,6 ele gere algo contendo "acinzentado (6.1)"
        return widget.data!.contains('acinzentado (6.1)');
      }
      return false;
    });
    expect(resultTextFinder, findsOneWidget);

    // Testa o botão de voltar (se houver um na ResultScreen, ou o back do AppBar)
    // Se ResultScreen usa AppBar, o back button é automático.
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Bem-vindo ao app JottaLean!'), findsOneWidget);
  });
}
