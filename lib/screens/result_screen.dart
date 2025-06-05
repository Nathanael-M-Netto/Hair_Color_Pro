// Arquivo: lib/screens/result_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Para HapticFeedback e Clipboard
import '../helpers/coloracao_helper.dart'; // Caminho ajustado para a pasta helpers

class ResultScreen extends StatelessWidget {
  final int corBaseCliente;
  final int porcentagemBranco;
  final int alturaTomDesejada;

  const ResultScreen({
    super.key,
    required this.corBaseCliente,
    required this.porcentagemBranco,
    required this.alturaTomDesejada,
  });

  @override
  Widget build(BuildContext context) {
    // Instanciando a classe ColoracaoHelper
    final ColoracaoHelper coloracaoHelper = ColoracaoHelper();

    // Chamando o método determinarFormulaCor
    final String formulaResultado = coloracaoHelper.determinarFormulaCor(
      corBaseCliente,
      porcentagemBranco,
      alturaTomDesejada,
    );

    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color secondaryColor = Theme.of(context).colorScheme.secondary;
    // final Color onPrimaryColor = Theme.of(context).colorScheme.onPrimary; // Removido se não usado diretamente aqui
    final Color cardColor = Theme.of(context).cardColor; // Cor do card do tema

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fórmula Sugerida'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () {
            HapticFeedback.lightImpact();
            Navigator.of(context).pop(); // Volta para a tela de input
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.copy_all_outlined),
            tooltip: 'Copiar Fórmula',
            onPressed: () {
              HapticFeedback.mediumImpact();
              Clipboard.setData(ClipboardData(text: formulaResultado)).then((_) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: const Text('Fórmula copiada para a área de transferência!'),
                    backgroundColor: secondaryColor,
                    behavior: SnackBarBehavior.floating,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                );
              });
            },
          ),
        ],
      ),
      body: Container(
        width: double.infinity, // Garante que o gradiente ocupe toda a largura
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [primaryColor.withOpacity(0.05), Colors.grey[50]!, primaryColor.withOpacity(0.03)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Icon(
                Icons.science_outlined, // Ícone representando fórmula/ciência
                size: 70,
                color: primaryColor,
              ),
              const SizedBox(height: 16),
              Text(
                'Resultado da Análise',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: primaryColor,
                ),
              ),
              const SizedBox(height: 24),
              Card(
                elevation: 4,
                color: cardColor, // Usa a cor do card definida no tema
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildResultDetailRow('Tom Base Atual:', '$corBaseCliente', context),
                      _buildResultDetailRow('Brancos Existentes:', '$porcentagemBranco%', context),
                      _buildResultDetailRow('Tom Desejado:', '$alturaTomDesejada', context),
                      const Divider(height: 30, thickness: 1),
                      Text(
                        'Fórmula Recomendada:',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: primaryColor,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        formulaResultado.isNotEmpty
                            ? formulaResultado
                            : "Não foi possível determinar uma fórmula com os dados fornecidos. Verifique as entradas ou refine as regras de cálculo.",
                        style: TextStyle(
                          fontSize: 17,
                          color: Colors.grey[800],
                          height: 1.5, // Melhora a legibilidade de textos mais longos
                        ),
                        textAlign: TextAlign.justify, // Justifica o texto da fórmula
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: secondaryColor, // Usando cor secundária para esta ação
                  foregroundColor: Theme.of(context).colorScheme.onSecondary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                icon: const Icon(Icons.replay_outlined),
                label: const Text('CALCULAR NOVAMENTE'),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).pop();
                },
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  Navigator.of(context).popUntil(ModalRoute.withName('/post_login_welcome'));
                },
                child: const Text('Voltar ao Início'),
              ),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Text(
                  'Lembre-se: Sempre realize um teste de mecha antes de aplicar a coloração em todo o cabelo. Os resultados podem variar.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultDetailRow(String label, String value, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
