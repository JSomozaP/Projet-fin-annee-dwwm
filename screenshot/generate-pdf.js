#!/usr/bin/env node

/**
 * Générateur PDF élégant pour le dossier Streamyscovery
 * Convertit le markdown en PDF avec mise en page professionnelle
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration pour PDF élégant
const CSS_STYLES = `
<style>
/* Styles de base élégants */
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background: #fff;
}

/* Titres hiérarchiques */
h1 {
    color: #6441a5; /* Couleur Twitch */
    font-size: 2.5em;
    border-bottom: 3px solid #6441a5;
    padding-bottom: 10px;
    margin-top: 40px;
    margin-bottom: 30px;
    page-break-before: always;
}

h2 {
    color: #2c3e50;
    font-size: 1.8em;
    margin-top: 35px;
    margin-bottom: 20px;
    border-left: 4px solid #6441a5;
    padding-left: 15px;
}

h3 {
    color: #34495e;
    font-size: 1.4em;
    margin-top: 25px;
    margin-bottom: 15px;
}

h4 {
    color: #7f8c8d;
    font-size: 1.2em;
    margin-top: 20px;
    margin-bottom: 10px;
}

/* Code blocks stylisés */
pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
    margin: 20px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

code {
    background: #f1f3f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Monaco', 'Menlo', monospace;
    font-size: 0.9em;
}

/* Tableaux élégants */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

th {
    background: #6441a5;
    color: white;
    font-weight: 600;
}

tr:nth-child(even) {
    background: #f8f9fa;
}

/* Listes avec puces personnalisées */
ul {
    list-style: none;
    padding-left: 0;
}

ul li:before {
    content: "▶";
    color: #6441a5;
    margin-right: 10px;
    font-weight: bold;
}

/* Encadrés spéciaux */
blockquote {
    background: #e8f4f8;
    border-left: 4px solid #17a2b8;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 0 8px 8px 0;
    font-style: italic;
}

/* Images responsives */
img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    margin: 20px 0;
}

/* Badges et tags */
.badge {
    background: #6441a5;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: 600;
}

/* Mise en page responsive */
@media print {
    body { font-size: 12pt; }
    h1 { font-size: 18pt; }
    h2 { font-size: 16pt; }
    h3 { font-size: 14pt; }
    
    /* Éviter les coupures de page malheureuses */
    h1, h2, h3 { page-break-after: avoid; }
    pre, table { page-break-inside: avoid; }
    
    /* Marges pour impression */
    @page {
        margin: 2cm;
        size: A4;
    }
}

/* Page de garde spéciale */
.cover-page {
    text-align: center;
    padding: 100px 0;
    background: linear-gradient(135deg, #6441a5, #9147ff);
    color: white;
    border-radius: 20px;
    margin: 50px 0;
}

.cover-page h1 {
    font-size: 3em;
    margin-bottom: 20px;
    border: none;
    color: white;
}

.cover-page .subtitle {
    font-size: 1.2em;
    opacity: 0.9;
    margin-bottom: 30px;
}

/* Table des matières */
.toc {
    background: #f8f9fa;
    padding: 30px;
    border-radius: 10px;
    margin: 30px 0;
}

.toc h2 {
    color: #6441a5;
    border: none;
    margin-bottom: 20px;
}

.toc ul {
    columns: 2;
    column-gap: 40px;
}

.toc li {
    margin-bottom: 8px;
    break-inside: avoid;
}

.toc a {
    text-decoration: none;
    color: #2c3e50;
    padding: 2px 0;
    display: block;
}

.toc a:hover {
    color: #6441a5;
    background: rgba(100, 65, 165, 0.1);
    padding-left: 10px;
}
</style>
`;

function generateHTML() {
    console.log('📖 Lecture du dossier Markdown...');
    
    const markdownPath = path.join(__dirname, 'screenshot', 'DOSSIER_PROJET_STREAMYSCOVERY.md');
    let content = fs.readFileSync(markdownPath, 'utf8');
    
    // Améliorer le contenu pour PDF
    content = content
        // Ajouter page de garde
        .replace('# DOSSIER DE PROJET', `
<div class="cover-page">
    <h1>🎮 STREAMYSCOVERY</h1>
    <div class="subtitle">Dossier de Projet Technique</div>
    <div class="subtitle">Plateforme de Découverte Équitable de Streamers</div>
    <div style="margin-top: 40px; font-size: 1em;">
        <strong>Jeremy Somoza</strong><br>
        Formation Développement Web<br>
        ${new Date().toLocaleDateString('fr-FR')}
    </div>
</div>
        `)
        // Améliorer les émojis pour l'impression
        .replace(/✅/g, '<span style="color: #28a745;">✓</span>')
        .replace(/❌/g, '<span style="color: #dc3545;">✗</span>')
        .replace(/🎯/g, '<span style="color: #6441a5;">🎯</span>')
        .replace(/🚀/g, '<span style="color: #17a2b8;">🚀</span>')
        
        // Améliorer les tableaux
        .replace(/\|\s*([^|]+)\s*\|/g, (match, content) => {
            return `| ${content.trim()} |`;
        });
    
    // Créer le HTML complet
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Streamyscovery - Dossier de Projet</title>
    ${CSS_STYLES}
</head>
<body>
    ${convertMarkdownToHTML(content)}
</body>
</html>
    `;
    
    return html;
}

function convertMarkdownToHTML(markdown) {
    console.log('🔄 Conversion Markdown → HTML...');
    
    return markdown
        // Titres
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        
        // Liens
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        
        // Gras et italique
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        
        // Listes
        .replace(/^- (.*)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        
        // Paragraphes
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.*)$/, '<p>$1</p>');
}

async function generatePDF() {
    console.log('🎨 Génération du HTML stylé...');
    const html = generateHTML();
    
    const htmlPath = path.join(__dirname, 'dossier_streamyscovery.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log('📄 Conversion HTML → PDF...');
    
    // Utiliser wkhtmltopdf pour une meilleure qualité
    const pdfPath = path.join(__dirname, 'DOSSIER_STREAMYSCOVERY.pdf');
    
    const command = `wkhtmltopdf --page-size A4 --margin-top 15mm --margin-bottom 15mm --margin-left 20mm --margin-right 20mm --enable-local-file-access --javascript-delay 1000 "${htmlPath}" "${pdfPath}"`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log('⚠️ wkhtmltopdf non trouvé, utilisation de pandoc...');
            
            // Fallback avec pandoc
            const pandocCommand = `pandoc "${path.join(__dirname, 'screenshot', 'DOSSIER_PROJET_STREAMYSCOVERY.md')}" -o "${pdfPath}" --pdf-engine=xelatex -V geometry:margin=2cm -V fontsize=11pt -V colorlinks=true`;
            
            exec(pandocCommand, (pandocError) => {
                if (pandocError) {
                    console.error('❌ Erreur génération PDF:', pandocError);
                    console.log('💡 Installez wkhtmltopdf ou pandoc pour générer le PDF');
                    console.log('   - wkhtmltopdf: sudo apt install wkhtmltopdf');
                    console.log('   - pandoc: sudo apt install pandoc texlive-xetex');
                } else {
                    console.log('✅ PDF généré avec succès:', pdfPath);
                }
            });
        } else {
            console.log('✅ PDF haute qualité généré:', pdfPath);
            // Nettoyage du fichier HTML temporaire
            fs.unlinkSync(htmlPath);
        }
    });
}

// Lancement du script
if (require.main === module) {
    console.log('🎯 Génération PDF élégant du dossier Streamyscovery\n');
    generatePDF();
}

module.exports = { generateHTML, generatePDF };
