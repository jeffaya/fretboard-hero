import ar from '../lessons/locales/ar.mjs';
import bn from '../lessons/locales/bn.mjs';
import ru from '../lessons/locales/ru.mjs';
// Existing About pages. Instrument lessons live in ../lessons/translations.mjs.
export const reviewed="2026-10-27";
export const languages={
 ar: ar.about,
 bn: bn.about,
 ru: ru.about,

  "en": {
    "about": "/en/about/",
    "pages": [
      {
        "id": "about",
        "label": "About",
        "title": "About the app and its creator",
        "heading": "Built around understanding the fretboard.",
        "description": "Learn what Fretboard Hero offers, who creates it, how to contact the project and where to find its guitar practice app and privacy information.",
        "intro": "Fretboard Hero brings visual fretboard tools and guided practice into one application for guitar, bass and ukulele.",
        "screen": "home",
        "sections": [
          {
            "title": "The project",
            "paragraphs": [
              "Fretboard Hero is developed by Jean-François Seignemorte. Its tools focus on notes, pentatonic patterns, triads, chord shapes and daily practice. The guides on this site explain how to use those tools with your instrument.",
              "The guitar guides use standard six-string tuning. They are practical learning resources, not a promise of a particular level or speed of progress."
            ]
          },
          {
            "title": "Availability and feedback",
            "paragraphs": [
              "The web application is available at fretboard-hero.com. The guitar Android app is linked on Google Play. Available platforms, store prices and purchase conditions should be checked on the official product listing.",
              "For a question, a correction to a guide or a problem with the application, contact hello@fretboard-hero.com. Include the instrument, screen, device and browser involved so the issue is easier to reproduce."
            ]
          },
          {
            "title": "Privacy and accuracy",
            "paragraphs": [
              "Microphone access is used for tuning and supported practice feedback. Audio is processed locally and is not recorded or uploaded by the app. The privacy policy explains data handling, including in-app purchases.",
              "These pages describe the features available when reviewed. Store availability and features can change; the application and official store listing remain the places to check before purchasing."
            ]
          }
        ],
        "faq": []
      }
    ]
  },
  "fr": {
    "about": "/fr/a-propos/",
    "pages": [
      {
        "id": "about",
        "label": "À propos",
        "title": "À propos de l’application et de son créateur",
        "description": "Découvre les outils Fretboard Hero, leur créateur, les moyens de contact et les liens vers l’application de guitare et sa politique de confidentialité.",
        "heading": "Comprendre le manche, exercice après exercice.",
        "intro": "Fretboard Hero réunit des outils visuels et des exercices guidés pour la guitare, la basse et le ukulélé.",
        "screen": "home",
        "sections": [
          {
            "title": "Le projet",
            "paragraphs": [
              "Fretboard Hero est développé par Jean-François Seignemorte. Ses outils portent sur les notes, les positions pentatoniques, les triades, les formes d’accords et la pratique régulière. Les guides expliquent comment utiliser ces outils avec ton instrument.",
              "Les guides guitare utilisent l’accordage standard à six cordes. Ce sont des ressources pratiques, sans promesse de niveau ni de vitesse de progression."
            ]
          },
          {
            "title": "Disponibilité et retours",
            "paragraphs": [
              "L’application web est accessible sur fretboard-hero.com. L’application guitare Android est liée sur Google Play. Consulte la fiche officielle pour vérifier les plateformes disponibles, le prix et les conditions d’achat.",
              "Pour poser une question, corriger un guide ou signaler un problème, écris à hello@fretboard-hero.com. Indique l’instrument, l’écran, l’appareil et le navigateur concernés pour faciliter la reproduction."
            ]
          },
          {
            "title": "Confidentialité et exactitude",
            "paragraphs": [
              "L’accès au microphone sert à l’accordeur et au retour des exercices compatibles. Le son est traité localement, sans être enregistré ni envoyé par l’application. La politique de confidentialité détaille le traitement des données, y compris les achats intégrés.",
              "Ces pages décrivent les fonctions disponibles lors de leur vérification. Les fonctionnalités et la disponibilité sur les stores peuvent évoluer ; consulte l’application et sa fiche officielle avant un achat."
            ]
          }
        ],
        "faq": []
      }
    ]
  }
};
