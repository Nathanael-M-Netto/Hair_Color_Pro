// Arquivo: lib/screens/login_screen.dart

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/services.dart'; // Para HapticFeedback

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isLoading = false;
  String? _errorMessage;
  bool _isPasswordVisible = false;

  Future<void> _loginUser() async {
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.heavyImpact(); // Feedback de erro na validação
      return;
    }
    _formKey.currentState!.save();

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _auth.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Após login bem-sucedido, força o redirecionamento para a tela de boas-vindas
      // e limpa todas as rotas anteriores da pilha de navegação.
      // O StreamBuilder em main.dart também reagirá à mudança de estado,
      // mas esta navegação explícita garante a limpeza da pilha e a transição imediata.
      if (mounted) { // Verifica se o widget ainda está na árvore de widgets
        Navigator.of(context).pushNamedAndRemoveUntil(
            '/post_login_welcome', (Route<dynamic> route) => false);
      }
      // Não é mais necessário setar _isLoading = false aqui, pois a tela será substituída.
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = _getFirebaseAuthErrorMessage(e);
          _isLoading = false; // Garante que isLoading seja false em caso de erro
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
          _isLoading = false; // Garante que isLoading seja false em caso de erro
        });
      }
    }
    // O finally block para _isLoading não é mais estritamente necessário aqui,
    // pois o estado de carregamento é tratado no sucesso (pela navegação que desmonta o widget)
    // ou nos blocos catch (setando _isLoading para false).
  }

  String _getFirebaseAuthErrorMessage(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'Nenhum usuário encontrado com este e-mail.';
      case 'wrong-password':
        return 'Senha incorreta. Por favor, tente novamente.';
      case 'invalid-email':
        return 'O formato do e-mail é inválido.';
      case 'user-disabled':
        return 'Este usuário foi desabilitado.';
      case 'too-many-requests':
        return 'Muitas tentativas de login. Tente novamente mais tarde.';
      case 'network-request-failed':
        return 'Erro de conexão. Verifique sua internet.';
      default:
      // Para debug, pode ser útil mostrar o código do erro:
      // return 'Erro de autenticação (${e.code}). Verifique suas credenciais.';
        return 'Erro de autenticação. Verifique suas credenciais.';
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color primaryColor = Theme.of(context).colorScheme.primary;
    final Color secondaryColor = Theme.of(context).colorScheme.secondary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Entrar na Conta'),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: primaryColor,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () {
            HapticFeedback.lightImpact();
            if (Navigator.canPop(context)) {
              Navigator.of(context).pop();
            } else {
              // Se não puder voltar (ex: rota inicial), vai para landing
              Navigator.of(context).pushReplacementNamed('/landing');
            }
          },
        ),
      ),
      extendBodyBehindAppBar: true,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [primaryColor.withOpacity(0.05), Colors.grey[50]!, primaryColor.withOpacity(0.03)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  // Adiciona um espaço no topo para não sobrepor a AppBar transparente
                  SizedBox(height: kToolbarHeight + MediaQuery.of(context).padding.top),
                  Icon(
                    Icons.lock_open_outlined,
                    size: 60,
                    color: primaryColor,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Bem-vindo de Volta!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: primaryColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Faça login para continuar.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 30),
                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(
                      labelText: 'E-mail',
                      hintText: 'seuemail@exemplo.com',
                      prefixIcon: Icon(Icons.email_outlined, color: primaryColor.withOpacity(0.7)),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Por favor, insira seu e-mail.';
                      }
                      if (!RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+").hasMatch(value)) {
                        return 'Por favor, insira um e-mail válido.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(
                      labelText: 'Senha',
                      hintText: 'Sua senha',
                      prefixIcon: Icon(Icons.lock_outline, color: primaryColor.withOpacity(0.7)),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isPasswordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: primaryColor.withOpacity(0.7),
                        ),
                        onPressed: () {
                          setState(() {
                            _isPasswordVisible = !_isPasswordVisible;
                          });
                        },
                      ),
                    ),
                    obscureText: !_isPasswordVisible,
                    textInputAction: TextInputAction.done,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Por favor, insira sua senha.';
                      }
                      // A validação de 6 caracteres é feita pelo Firebase, mas pode ser mantida aqui para feedback imediato.
                      // if (value.trim().length < 6) {
                      //   return 'A senha deve ter pelo menos 6 caracteres.';
                      // }
                      return null;
                    },
                    onFieldSubmitted: (_) => _isLoading ? null : _loginUser(),
                  ),
                  const SizedBox(height: 24),
                  if (_errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12.0),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Colors.redAccent, fontSize: 14, fontWeight: FontWeight.w500),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  _isLoading
                      ? Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(secondaryColor)))
                      : ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor, // Cor primária para o botão principal
                      foregroundColor: Theme.of(context).colorScheme.onPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      _loginUser();
                    },
                    child: const Text('ENTRAR'),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: _isLoading ? null : () {
                      HapticFeedback.lightImpact();
                      Navigator.pushReplacementNamed(context, '/register');
                    },
                    child: const Text('Não tem uma conta? Cadastre-se'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
