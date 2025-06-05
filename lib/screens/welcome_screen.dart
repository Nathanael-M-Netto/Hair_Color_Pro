import 'package:flutter/material.dart';
import 'result_screen.dart';

class WelcomeScreen extends StatelessWidget {
  // Adicionado const ao construtor
  const WelcomeScreen({super.key});

  // Mesma observação sobre controllers do LoginScreen se aplica aqui.
  @override
  Widget build(BuildContext context) {
    final TextEditingController hairColorLevelController = TextEditingController();
    final TextEditingController grayPercentageController = TextEditingController();
    final TextEditingController desiredToneLevelController = TextEditingController();

    return Scaffold(
      appBar: AppBar(title: const Text("JottaLean")), // Adicionado const
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: SingleChildScrollView( // Adicionado para evitar overflow com teclado
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text("Bem-vindo ao app JottaLean!", style: TextStyle(fontSize: 18)), // Adicionado const
              TextField(
                controller: hairColorLevelController,
                decoration: const InputDecoration(labelText: 'Altura de tom do cabelo'), // Adicionado const
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: grayPercentageController,
                decoration: const InputDecoration(labelText: 'Porcentagem de cabelos brancos'), // Adicionado const
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: desiredToneLevelController,
                decoration: const InputDecoration(labelText: 'Altura de tom desejada'), // Adicionado const
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 20), // Adicionado const
              ElevatedButton(
                onPressed: () {
                  // Converte os valores dos campos de texto para int
                  final int corBaseCliente = int.tryParse(hairColorLevelController.text) ?? 0;
                  final int porcentagemBranco = int.tryParse(grayPercentageController.text) ?? 0;
                  final int alturaTomDesejada = int.tryParse(desiredToneLevelController.text) ?? 0;

                  // Navega para a Tela de Resultado
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ResultScreen(
                        corBaseCliente: corBaseCliente,
                        porcentagemBranco: porcentagemBranco,
                        alturaTomDesejada: alturaTomDesejada,
                      ),
                    ),
                  );
                },
                child: const Text('Calcular'), // Adicionado const
              ),
            ],
          ),
        ),
      ),
    );
  }
}
