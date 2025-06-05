// Arquivo: lib/screens/landing_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Para HapticFeedback

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  // Caminho para o arquivo do logo nos assets
  final String logoPath = 'assets/images/logo.jpg';

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color secondaryColor = Theme.of(context).colorScheme.secondary;
    final Color onPrimaryColor = Theme.of(context).colorScheme.onPrimary;
    final Color onSecondaryColor = Theme.of(context).colorScheme.onSecondary;
    final double screenWidth = MediaQuery.of(context).size.width;
    final double screenHeight = MediaQuery.of(context).size.height;

    // Definir a altura do logo como uma porcentagem da largura da tela.
    // Original era screenWidth * 0.4. Aumentando em ~35% (0.4 * 1.35 = 0.54)
    // Vamos usar 0.55 para um valor um pouco maior e arredondado.
    final double logoHeight = screenWidth * 0.55;
    // Limitar a altura máxima do logo para não ficar excessivamente grande em telas muito largas
    // ou muito baixas, onde a proporção baseada na largura pode ser demais.
    final double maxLogoHeight = screenHeight * 0.30; // Exemplo: máximo de 30% da altura da tela

    return Scaffold(
      body: SafeArea(
        child: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [primaryColor.withOpacity(0.05), Colors.grey[50]!, primaryColor.withOpacity(0.03)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                const Spacer(flex: 2),

                // Logo com tamanho responsivo e aumentado
                Container(
                  margin: const EdgeInsets.only(bottom: 25.0),
                  constraints: BoxConstraints(
                    // Garante que o logo não ultrapasse a altura máxima definida,
                    // mas ainda tenta atingir a altura baseada na largura.
                    maxHeight: maxLogoHeight,
                  ),
                  child: Image.asset(
                    logoPath,
                    height: logoHeight, // Altura responsiva baseada na largura
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) {
                      return Center(
                        child: Text(
                          'Hair Color Pro',
                          style: TextStyle(fontSize: logoHeight * 0.15, fontWeight: FontWeight.bold, color: primaryColor), // Fonte do fallback também responsiva
                        ),
                      );
                    },
                  ),
                ),

                Text(
                  'Hair Color Pro',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: screenWidth * 0.07,
                    fontWeight: FontWeight.bold,
                    color: primaryColor,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Seu assistente inteligente para coloração capilar.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: screenWidth * 0.04,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 35),

                Padding(
                  padding: EdgeInsets.symmetric(horizontal: screenWidth * 0.08),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryColor,
                          foregroundColor: onPrimaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          textStyle: TextStyle(fontSize: screenWidth * 0.042, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                          elevation: 4,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.0),
                          ),
                        ),
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          Navigator.pushNamed(context, '/register');
                        },
                        child: const Text('CRIAR CONTA'),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: secondaryColor,
                          foregroundColor: onSecondaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          textStyle: TextStyle(fontSize: screenWidth * 0.042, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                          elevation: 4,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10.0),
                          ),
                        ),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          Navigator.pushNamed(context, '/login');
                        },
                        child: const Text('ENTRAR'),
                      ),
                    ],
                  ),
                ),

                const Spacer(flex: 3),

                Text(
                  'Transforme cores com precisão e arte!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: screenWidth * 0.035,
                    fontStyle: FontStyle.italic,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 15),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
