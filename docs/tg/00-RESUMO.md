# Resumo

Este trabalho apresenta o **Hair Color Pro**, uma aplicação web progressiva (Progressive Web App — PWA) destinada a profissionais de salão de beleza, que automatiza o diagnóstico de cor capilar e a geração de pareceres profissionais sobre coloração.

O sistema combina **colorimetria computacional clássica** — conversão de pixels RGB para o espaço perceptual CIE Lab e cálculo de diferença de cor pela métrica CIEDE2000 — com **modelos de linguagem grandes** (Google Gemini, plano gratuito) para gerar relatórios em linguagem natural a partir do diagnóstico determinístico.

A arquitetura é construída sobre **Next.js 15** (App Router, React 19), com **Firebase Auth** garantindo compatibilidade com a base de usuários do aplicativo Flutter pré-existente, e **Firestore** persistindo histórico de análises. A camada de IA é estritamente comunicacional — todo reconhecimento de cor é executado por algoritmo determinístico contra uma paleta de referência industrial de aproximadamente 120 entradas, derivada dos catálogos L'Oréal Majirel, Wella Koleston Perfect e Schwarzkopf Igora Royal.

O resultado é instalável como aplicativo nativo no dispositivo do usuário (ícones, splash screens, manifest, service worker), com latência de navegação inferior a 100 ms em produção e bundle inicial de 115 KB.

**Palavras-chave:** Colorimetria; CIEDE2000; Progressive Web App; Inteligência Artificial Generativa; Next.js; Coloração Capilar.

---

# Abstract

This work presents **Hair Color Pro**, a Progressive Web Application (PWA) aimed at hair salon professionals that automates hair color diagnosis and generates professional coloring reports.

The system combines **classical computational colorimetry** — converting RGB pixels to the perceptual CIE Lab space and computing color difference using the CIEDE2000 metric — with **large language models** (Google Gemini, free tier) to generate natural language reports from the deterministic diagnosis.

The architecture is built on **Next.js 15** (App Router, React 19), with **Firebase Auth** ensuring compatibility with the existing Flutter app user base, and **Firestore** persisting analysis history. The AI layer is strictly communicational — all color recognition is executed by a deterministic algorithm against an industrial reference palette of approximately 120 entries, derived from L'Oréal Majirel, Wella Koleston Perfect, and Schwarzkopf Igora Royal catalogs.

The result is installable as a native application on the user's device (icons, splash screens, manifest, service worker), with navigation latency under 100 ms in production and an initial bundle of 115 KB.

**Keywords:** Colorimetry; CIEDE2000; Progressive Web App; Generative AI; Next.js; Hair Coloring.
