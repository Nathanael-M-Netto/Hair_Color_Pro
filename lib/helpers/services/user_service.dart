// Arquivo: lib/helpers/services/user_service.dart

import 'package:firebase_auth/firebase_auth.dart';

class UserService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Retorna o usuário atualmente autenticado.
  User? get currentUser => _auth.currentUser;

  /// Stream que emite eventos quando o estado de autenticação do usuário muda.
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Construtor
  UserService();

// Outras funções que interagiam com o Firestore foram removidas.
// Se você precisar atualizar o displayName ou photoURL diretamente no objeto User do FirebaseAuth,
// você pode fazer isso chamando:
//   await FirebaseAuth.instance.currentUser?.updateProfile(displayName: "Novo Nome");
//   await FirebaseAuth.instance.currentUser?.updatePhotoURL("nova_url_foto.png");
//   await FirebaseAuth.instance.currentUser?.reload(); // Para garantir que os dados locais sejam atualizados
// No entanto, a edição e persistência de um nome de exibição customizado e foto
// sem Firestore/Storage se torna mais limitada em termos de UI gerenciável pelo usuário.
}
