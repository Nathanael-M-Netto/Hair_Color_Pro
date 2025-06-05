// Arquivo: lib/screens/hair_input_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Para HapticFeedback e input formatters
import 'result_screen.dart'; // Para navegar para a tela de resultados

class HairInputScreen extends StatefulWidget {
  const HairInputScreen({super.key});

  @override
  State<HairInputScreen> createState() => _HairInputScreenState();
}

class _HairInputScreenState extends State<HairInputScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _currentToneController = TextEditingController();
  final TextEditingController _grayPercentageController = TextEditingController();
  final TextEditingController _desiredToneController = TextEditingController();

  final String hairLevelsImagePath = 'assets/images/Cuidados Cabelo Descolorido.jpeg';

  void _showImageDialog() {
    HapticFeedback.lightImpact();
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Expanded(
                child: InteractiveViewer(
                  panEnabled: true,
                  minScale: 0.5,
                  maxScale: 4,
                  child: Image.asset(hairLevelsImagePath),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: TextButton(
                  style: TextButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))
                  ),
                  child: Text('Fechar', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                ),
              )
            ],
          ),
        );
      },
    );
  }

  void _submitAnalysis() {
    HapticFeedback.mediumImpact();
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();

      final int currentTone = int.tryParse(_currentToneController.text) ?? 0;
      final int grayPercentage = int.tryParse(_grayPercentageController.text) ?? 0;
      final int desiredTone = int.tryParse(_desiredToneController.text) ?? 0;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ResultScreen(
            corBaseCliente: currentTone,
            porcentagemBranco: grayPercentage,
            alturaTomDesejada: desiredTone,
          ),
        ),
      );
    } else {
      HapticFeedback.heavyImpact();
    }
  }

  String? _validateToneLevel(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return 'Por favor, insira $fieldName.';
    }
    final int? level = int.tryParse(value);
    if (level == null) {
      return 'Por favor, insira um número válido.';
    }
    if (level < 1 || level > 12) {
      return '$fieldName deve estar entre 1 e 12.';
    }
    return null;
  }

  String? _validatePercentage(String? value) {
    if (value == null || value.isEmpty) {
      return 'Por favor, insira a porcentagem.';
    }
    final int? percentage = int.tryParse(value);
    if (percentage == null) {
      return 'Por favor, insira um número válido.';
    }
    if (percentage < 0 || percentage > 100) {
      return 'A porcentagem deve estar entre 0 e 100.';
    }
    return null;
  }

  @override
  void dispose() {
    _currentToneController.dispose();
    _grayPercentageController.dispose();
    _desiredToneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color onPrimaryColor = Theme.of(context).colorScheme.onPrimary;
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Análise Capilar'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            HapticFeedback.lightImpact();
            Navigator.of(context).pop();
          },
        ),
      ),
      body: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20.0, 20.0, 20.0, 30.0), // Ajuste do padding inferior
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight - kToolbarHeight - MediaQuery.of(context).padding.top - MediaQuery.of(context).padding.bottom -30), // Considerar padding
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    // Removido MainAxisAlignment.spaceBetween para um fluxo mais natural
                    children: <Widget>[
                      _buildSectionTitle('Informações do Cabelo Atual'),
                      TextFormField(
                        controller: _currentToneController,
                        decoration: const InputDecoration(
                          labelText: 'Altura de Tom Atual do Cabelo (Base)',
                          hintText: 'Ex: 4 (Castanho Médio)',
                          prefixIcon: Icon(Icons.looks_one_outlined),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (value) => _validateToneLevel(value, 'o tom atual'),
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _grayPercentageController,
                        decoration: const InputDecoration(
                          labelText: 'Porcentagem de Cabelos Brancos (%)',
                          hintText: 'Ex: 30',
                          prefixIcon: Icon(Icons.percent_outlined),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: _validatePercentage,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 24),
                      _buildSectionTitle('Resultado Desejado'),
                      TextFormField(
                        controller: _desiredToneController,
                        decoration: const InputDecoration(
                          labelText: 'Altura de Tom Desejada',
                          hintText: 'Ex: 7 (Loiro Médio)',
                          prefixIcon: Icon(Icons.looks_two_outlined),
                        ),
                        keyboardType: TextInputType.number,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (value) => _validateToneLevel(value, 'o tom desejado'),
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submitAnalysis(),
                      ),
                      const SizedBox(height: 30),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: onPrimaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5),
                          elevation: 5,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.0),
                          ),
                        ),
                        icon: const Icon(Icons.calculate_outlined, size: 24),
                        label: const Text('CALCULAR FÓRMULA'),
                        onPressed: _submitAnalysis,
                      ),
                      // Usar Spacer para empurrar o guia visual para baixo, mas não excessivamente
                      // Ou SizedBox para um espaçamento fixo mais controlado.
                      const SizedBox(height: 30), // Espaçamento entre o botão e o guia

                      Divider(color: primaryColor.withOpacity(0.3)),
                      const SizedBox(height: 20),
                      Text(
                        'Guia Visual (Toque para ampliar):',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w600,
                          color: primaryColor.withOpacity(0.85),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: _showImageDialog,
                        child: Container(
                          constraints: BoxConstraints(
                            // Aumentando um pouco mais a altura da imagem
                            maxHeight: screenHeight * 0.32, // 32% da altura da tela
                            minHeight: 200, // Altura mínima
                          ),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12.0),
                            border: Border.all(color: Colors.grey[350]!, width: 1),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.withOpacity(0.2),
                                spreadRadius: 1,
                                blurRadius: 3,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(11.0),
                            child: Image.asset(
                              hairLevelsImagePath,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  height: 150,
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                      color: Colors.grey[200],
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.redAccent.withOpacity(0.7))
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.image_not_supported_outlined, color: Colors.redAccent.withOpacity(0.9), size: 30),
                                      const SizedBox(height: 8),
                                      const Text(
                                        'Guia visual indisponível.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ),
                      // const Spacer(), // Se ainda houver muito espaço, um Spacer pode ser usado aqui.
                    ],
                  ),
                ),
              ),
            );
          }
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0, top: 8.0),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}
