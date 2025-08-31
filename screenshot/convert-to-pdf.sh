#!/bin/bash

echo "🎯 Génération PDF du dossier Streamyscovery"
echo "==========================================="

# Chemin vers le dossier Markdown
DOSSIER_MD="screenshot/DOSSIER_PROJET_STREAMYSCOVERY.md"
PDF_OUTPUT="DOSSIER_STREAMYSCOVERY_FINAL.pdf"

# Vérifier que le fichier existe
if [ ! -f "$DOSSIER_MD" ]; then
    echo "❌ Fichier $DOSSIER_MD introuvable"
    exit 1
fi

echo "📖 Fichier source: $DOSSIER_MD"
echo "📄 Fichier destination: $PDF_OUTPUT"
echo ""

# Méthode 1: Pandoc (meilleure qualité)
if command -v pandoc &> /dev/null; then
    echo "🔄 Conversion avec Pandoc (haute qualité)..."
    
    pandoc "$DOSSIER_MD" \
        -o "$PDF_OUTPUT" \
        --pdf-engine=pdflatex \
        -V geometry:margin=2cm \
        -V fontsize=11pt \
        -V colorlinks=true \
        -V linkcolor=blue \
        -V urlcolor=blue \
        -V toccolor=black \
        --toc \
        --toc-depth=3 \
        --number-sections \
        --highlight-style=tango \
        --variable=documentclass:article \
        --variable=classoption:a4paper \
        --variable=mainfont:"DejaVu Serif" \
        --variable=monofont:"DejaVu Sans Mono" \
        2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ PDF généré avec succès: $PDF_OUTPUT"
        echo "📊 Taille: $(du -h "$PDF_OUTPUT" | cut -f1)"
        echo "📋 Pages: $(pdfinfo "$PDF_OUTPUT" 2>/dev/null | grep Pages | awk '{print $2}' || echo 'N/A')"
        exit 0
    else
        echo "⚠️ Erreur avec pandoc, tentative méthode alternative..."
    fi
fi

# Méthode 2: wkhtmltopdf
if command -v wkhtmltopdf &> /dev/null; then
    echo "🔄 Conversion avec wkhtmltopdf..."
    
    # Créer HTML temporaire avec styles
    HTML_TEMP="temp_dossier.html"
    
    cat > "$HTML_TEMP" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px;
            color: #333;
        }
        h1 { 
            color: #6441a5; 
            border-bottom: 2px solid #6441a5; 
            padding-bottom: 10px;
            page-break-before: always;
        }
        h2 { 
            color: #2c3e50; 
            margin-top: 30px;
            border-left: 4px solid #6441a5;
            padding-left: 15px;
        }
        h3 { color: #34495e; margin-top: 25px; }
        pre { 
            background: #f8f9fa; 
            border: 1px solid #ddd; 
            padding: 15px; 
            border-radius: 5px;
            overflow-x: auto;
        }
        code { 
            background: #f1f3f4; 
            padding: 2px 4px; 
            border-radius: 3px; 
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 20px 0;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background: #6441a5; 
            color: white; 
        }
        img { 
            max-width: 100%; 
            height: auto; 
        }
    </style>
</head>
<body>
EOF
    
    # Convertir markdown en HTML basique
    if command -v markdown &> /dev/null; then
        markdown "$DOSSIER_MD" >> "$HTML_TEMP"
    else
        # Conversion manuelle basique
        sed 's/^# \(.*\)/<h1>\1<\/h1>/g; s/^## \(.*\)/<h2>\1<\/h2>/g; s/^### \(.*\)/<h3>\1<\/h3>/g' "$DOSSIER_MD" >> "$HTML_TEMP"
    fi
    
    echo '</body></html>' >> "$HTML_TEMP"
    
    wkhtmltopdf \
        --page-size A4 \
        --margin-top 15mm \
        --margin-bottom 15mm \
        --margin-left 20mm \
        --margin-right 20mm \
        --enable-local-file-access \
        "$HTML_TEMP" "$PDF_OUTPUT" 2>/dev/null
    
    rm -f "$HTML_TEMP"
    
    if [ $? -eq 0 ]; then
        echo "✅ PDF généré avec succès: $PDF_OUTPUT"
        exit 0
    fi
fi

# Méthode 3: LibreOffice (si disponible)
if command -v libreoffice &> /dev/null; then
    echo "🔄 Conversion avec LibreOffice..."
    
    libreoffice --headless --convert-to pdf "$DOSSIER_MD" 2>/dev/null
    
    if [ -f "DOSSIER_PROJET_STREAMYSCOVERY.pdf" ]; then
        mv "DOSSIER_PROJET_STREAMYSCOVERY.pdf" "$PDF_OUTPUT"
        echo "✅ PDF généré avec succès: $PDF_OUTPUT"
        exit 0
    fi
fi

# Si aucune méthode ne fonctionne
echo "❌ Impossible de générer le PDF"
echo ""
echo "💡 Solutions recommandées:"
echo "   - Installer pandoc: sudo apt install pandoc texlive-latex-base"
echo "   - Installer wkhtmltopdf: sudo apt install wkhtmltopdf"
echo "   - Utiliser un convertisseur en ligne"
echo ""
echo "📁 En attendant, vous pouvez:"
echo "   - Ouvrir le fichier .md dans VS Code et exporter en PDF"
echo "   - Copier le contenu dans Google Docs et exporter"
echo "   - Utiliser Typora ou Mark Text pour la conversion"

exit 1
