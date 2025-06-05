// Top-level build file where you can add configuration options common to all sub-projects/modules.

// Bloco buildscript: VERSÕES CRÍTICAS!
// Verifique e ajuste as versões do Android Gradle Plugin (AGP) e Kotlin Gradle Plugin.
// Elas DEVEM ser compatíveis com sua versão do Gradle (8.10.2) e seu Android Studio.
buildscript {
    // Defina a versão do Kotlin.
    // Consulte: https://developer.android.com/studio/releases/gradle-plugin#api-kotlin para compatibilidade AGP/Kotlin
    // E https://kotlinlang.org/docs/gradle-configure-project.html#apply-plugin
    ext.kotlin_version = '1.9.22' // Exemplo: Uma versão estável e recente do Kotlin. Verifique a compatibilidade.

    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // Versão do Android Gradle Plugin (AGP).
        // Consulte: https://developer.android.com/studio/releases/gradle-plugin para compatibilidade com Gradle 8.10.2.
        // Para Gradle 8.1, o AGP 8.4.x é geralmente compatível.
        classpath 'com.android.tools.build:gradle:8.4.1' // Exemplo: Use a última versão estável compatível.
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        // Plugin do Google Services. Mantenha a versão que o FlutterFire configurou ou uma mais recente.
        classpath 'com.google.gms:google-services:4.4.2' // Ou a versão mais recente, ex: 4.4.1 ou 4.4.2
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// As customizações de diretório de build foram removidas pois podem causar problemas.
// O Flutter e seus plugins esperam a estrutura de build padrão do Gradle.

// A tarefa clean customizada também foi removida.
// Use `flutter clean` para limpar o projeto.
