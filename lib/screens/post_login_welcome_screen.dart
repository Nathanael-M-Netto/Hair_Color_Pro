// Arquivo: lib/screens/post_login_welcome_screen.dart

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart'; // Para HapticFeedback
import 'profile_screen.dart';

class PostLoginWelcomeScreen extends StatelessWidget {
  const PostLoginWelcomeScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    HapticFeedback.mediumImpact();
    try {
      await FirebaseAuth.instance.signOut();
      if (context.mounted) {
        Navigator.of(context)
            .pushNamedAndRemoveUntil('/landing', (Route<dynamic> route) => false);
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao sair: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showAboutDialog(BuildContext context) {
    final appVersion = '1.0.0';
    final year = DateTime.now().year;

    showAboutDialog(
      context: context,
      applicationName: 'Hair Color Pro', // Nome do App Atualizado AQUI
      applicationVersion: appVersion,
      applicationIcon: Icon(
        Icons.auto_awesome,
        color: Theme.of(context).colorScheme.secondary,
        size: 48,
      ),
      applicationLegalese: '© $year Hair Color Pro. Todos os direitos reservados.', // Nome do App Atualizado AQUI
      children: <Widget>[
        const SizedBox(height: 16),
        const Text(
          'Este aplicativo ajuda coloristas a determinar fórmulas precisas para coloração de cabelos.',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final User? currentUser = FirebaseAuth.instance.currentUser;

    String displayName = 'Colorista';
    if (currentUser != null) {
      if (currentUser.displayName != null &&
          currentUser.displayName!.isNotEmpty) {
        displayName = currentUser.displayName!;
      } else if (currentUser.email != null && currentUser.email!.isNotEmpty) {
        final emailPart = currentUser.email!.split('@')[0];
        if (emailPart.isNotEmpty) {
          displayName = emailPart[0].toUpperCase() + emailPart.substring(1);
        }
      }
    }

    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color secondaryColor = Theme.of(context).colorScheme.secondary;
    final Color onPrimaryColor = Theme.of(context).colorScheme.onPrimary;

    const Widget profileIcon = Icon(Icons.account_circle, size: 28);


    return Scaffold(
      appBar: AppBar(
        title: const Text('Hair Color Pro'), // Já estava correto
        automaticallyImplyLeading: false,
        actions: [
          PopupMenuButton<String>(
            icon: profileIcon,
            tooltip: 'Menu',
            onSelected: (String value) {
              HapticFeedback.lightImpact();
              switch (value) {
                case 'profile':
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const ProfileScreen()),
                  );
                  break;
                case 'about':
                  _showAboutDialog(context);
                  break;
                case 'logout':
                  _logout(context);
                  break;
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'profile',
                child: ListTile(
                  leading: Icon(Icons.person_outline),
                  title: Text('Meu Perfil'),
                ),
              ),
              const PopupMenuItem<String>(
                value: 'about',
                child: ListTile(
                  leading: Icon(Icons.info_outline),
                  title: Text('Sobre o App'),
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem<String>(
                value: 'logout',
                child: ListTile(
                  leading: Icon(Icons.logout, color: Colors.red[700]),
                  title: Text('Sair da Conta', style: TextStyle(color: Colors.red[700])),
                ),
              ),
            ],
          ),
        ],
      ),
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              primaryColor.withOpacity(0.05),
              Colors.grey[50]!,
              primaryColor.withOpacity(0.03)
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                Icon(
                  Icons.auto_awesome,
                  size: 80,
                  color: secondaryColor,
                  shadows: [
                    Shadow(
                      blurRadius: 10.0,
                      color: secondaryColor.withOpacity(0.3),
                      offset: const Offset(0, 4.0),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  'Olá, $displayName!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: primaryColor,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Tudo pronto para criar a coloração perfeita?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey[800],
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 40),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: onPrimaryColor,
                    padding: const EdgeInsets.symmetric(
                        vertical: 16, horizontal: 24),
                    textStyle: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5),
                    elevation: 5,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10.0),
                    ),
                  ),
                  icon: const Icon(Icons.palette_outlined, size: 24),
                  label: const Text('COMEÇAR ANÁLISE'),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.pushNamed(context, '/hair_input');
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
