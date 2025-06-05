// Top-level build file where you can add configuration options common to all sub-projects/modules.

// Bloco buildscript: Configurações para o próprio processo de build do Gradle.
buildscript {
    // Defina propriedades extras aqui se necessário, usando a sintaxe Kotlin DSL.
    // Para a versão do Kotlin, você pode definir uma variável ou usar diretamente.
    // A maneira comum de definir a versão do Kotlin para o plugin é através do próprio plugin.
    // No entanto, se você precisar de uma propriedade extra para outros usos:
    // extra.set("kotlin_version", "1.9.22") // Exemplo de como definir uma propriedade extra

    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // Versão do Android Gradle Plugin (AGP).
        // Certifique-se de que esta versão é compatível com sua versão do Gradle (8.10.2).
        // Para Gradle 8.1+, AGP 8.4.x é geralmente compatível.
        classpath("com.android.tools.build:gradle:8.4.1") // Use aspas duplas para strings

        // Versão do Kotlin Gradle Plugin.
        // A versão do Kotlin aqui deve ser consistente. O erro "Too many characters..."
        // sugere que aspas simples foram usadas para uma string. Use aspas duplas.
        // A versão do plugin Kotlin é frequentemente inferida ou pode ser especificada assim:
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.22") // Exemplo de versão, use aspas duplas

        // Plugin do Google Services.
        classpath("com.google.gms:google-services:4.4.2") // Use aspas duplas; verifique a última versão compatível
    }
}

// Configurações aplicadas a todos os subprojetos (módulos).
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

// A tarefa 'clean' padrão do Gradle já existe. Se precisar de uma customizada,
// a sintaxe seria diferente em Kotlin DSL.
// tasks.register<Delete>("clean") {
//     delete(rootProject.buildDir)
// }

// As customizações de diretório de build foram removidas nas sugestões anteriores,
// pois podem causar problemas com as ferramentas do Flutter. Mantenha-as removidas.
