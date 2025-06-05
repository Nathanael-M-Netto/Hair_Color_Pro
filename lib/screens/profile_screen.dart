// Arquivo: lib/screens/profile_screen.dart

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart'; // Para HapticFeedback

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser;

  final TextEditingController _displayNameController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  bool _isEditing = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser;
    _displayNameController.text = _currentUser?.displayName ?? '';
  }

  Future<void> _updateDisplayName() async {
    HapticFeedback.mediumImpact();
    if (!_formKey.currentState!.validate()) {
      return;
    }
    _formKey.currentState!.save();

    setState(() => _isLoading = true);

    try {
      await _currentUser?.updateProfile(displayName: _displayNameController.text.trim());
      await _currentUser?.reload(); // Recarrega os dados do usuário
      _currentUser = _auth.currentUser; // Atualiza a instância local

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Nome de exibição atualizado!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() {
          _isEditing = false;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao atualizar nome: ${e.toString()}'),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String email = _currentUser?.email ?? 'E-mail não disponível';
    final String? photoURL = _currentUser?.photoURL;

    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color cardColor = Theme.of(context).cardColor;
    final Color onPrimaryColor = Theme.of(context).colorScheme.onPrimary;


    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Editar Nome' : 'Meu Perfil'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            HapticFeedback.lightImpact();
            if (_isEditing) {
              setState(() {
                _isEditing = false;
                _displayNameController.text = _currentUser?.displayName ?? ''; // Reseta o controller
              });
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Editar Nome',
              onPressed: () {
                HapticFeedback.lightImpact();
                setState(() {
                  _isEditing = true;
                });
              },
            )
          else if (_isLoading)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: onPrimaryColor)),
            )
          else
            IconButton(
              icon: const Icon(Icons.save_outlined),
              tooltip: 'Salvar Nome',
              onPressed: _updateDisplayName,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Center(
              child: CircleAvatar(
                radius: 60,
                backgroundColor: Colors.grey[300],
                backgroundImage: photoURL != null && photoURL.isNotEmpty
                    ? NetworkImage(photoURL)
                    : null,
                child: photoURL == null || photoURL.isEmpty
                    ? Icon(
                  Icons.person,
                  size: 70,
                  color: primaryColor.withOpacity(0.8),
                )
                    : null,
              ),
            ),
            const SizedBox(height: 24),
            Card(
              elevation: 2,
              color: cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      if (_isEditing)
                        TextFormField(
                          controller: _displayNameController,
                          decoration: InputDecoration(
                            labelText: 'Nome de Exibição',
                            prefixIcon: Icon(Icons.person_outline, color: primaryColor.withOpacity(0.7)),
                            // border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Por favor, insira um nome.';
                            }
                            if (value.trim().length < 3) {
                              return 'O nome deve ter pelo menos 3 caracteres.';
                            }
                            return null;
                          },
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _isLoading ? null : _updateDisplayName(),
                        )
                      else
                        _buildProfileInfoTile(
                          context: context,
                          icon: Icons.person_outline,
                          title: 'Nome de Exibição',
                          subtitle: _currentUser?.displayName ?? 'Não definido',
                        ),
                      const Divider(height: 20),
                      _buildProfileInfoTile(
                        context: context,
                        icon: Icons.email_outlined,
                        title: 'E-mail',
                        subtitle: email,
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileInfoTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required BuildContext context,
  }) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary, size: 28),
      title: Text(
        title,
        style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.7)
        ),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w500,
            color: Theme.of(context).textTheme.bodyLarge?.color
        ),
      ),
    );
  }
}
