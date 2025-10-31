document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration Mappings ---
    const mappings = [
        // Header/Title
        { inputId: 'header-logo-input', previewId: 'preview-header-logo', attr: 'src' },
        { inputId: 'title-input', previewId: 'preview-title', attr: 'innerHTML' },
        { inputId: 'headline-input', previewId: 'preview-headline', attr: 'innerHTML' },

        // Call-to-Action (CTA)
        { inputId: 'cta-text-input', previewId: 'preview-cta', attr: 'innerHTML' },
        { inputId: 'cta-link-input', previewId: 'preview-cta', attr: 'href' },
        { inputId: 'cta-description-input', previewId: 'preview-cta-description', attr: 'innerHTML' },

        // Footer
        { inputId: 'footer-logo-input', previewId: 'preview-footer-logo', attr: 'src' },
        { inputId: 'footer-name-input', previewId: 'preview-footer-name', attr: 'innerHTML' },
        { inputId: 'footer-title-input', previewId: 'preview-footer-title', attr: 'innerHTML' },
        { inputId: 'footer-market-input', previewId: 'preview-footer-market', attr: 'innerHTML' },
    ];
    
    // --- Helper Functions ---
    
    /**
     * Converts simple markdown-like syntax to HTML.
     * @param {string} text The raw text from the textarea.
     * @returns {string} The HTML string.
     */
    function processBodyContent(text) {
        // First, split the text into lines to process the METRIC_ATTACH_CARD placeholder
        const lines = text.split('\n');
        let result = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check if this line contains the metric card placeholder
            if (line === '[METRIC_ATTACH_CARD]') {
                // Inject the metric card HTML directly
                result += generateMetricCardHTML();
                continue;
            }
            
            // Skip empty lines
            if (line === '') continue;
            
            // Check for separator
            if (line === '---') {
                result += '<div style="margin: 20px 0; border-top: 1px solid #e0e0e0;"></div>';
                continue;
            }
            
            // Process formatting
            let formattedLine = line
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // **bold** -> <b>bold</b>
                .replace(/\*(.*?)\*/g, '<i>$1</i>');    // *italics* -> <i>italics</i>
            
            // Wrap in paragraph tag
            result += `<p style="margin: 0 0 15px 0;">${formattedLine}</p>`;
        }
        
        return result;
    }

    /**
     * Generates the email-safe HTML table structure for the Metric Card
     */
    function generateMetricCardHTML() {
        const title = document.getElementById('metric-title-input')?.value || 'Metric Update';
        const descriptionRaw = document.getElementById('metric-description-input')?.value || 'Description not set.';
        
        // --- METRO BRAND COLORS ---
        const METRO_MAGENTA = '#e20074';
        const METRO_DARK_MAGENTA = '#A3005A';
        const METRO_LIGHT_PINK = '#fcf4f9';
        const METRO_CODE_PINK = '#FADDE7';

        // --- 1. Extract and format CODE block ---
        let codeBlockHtml = '';
        let descriptionBody = descriptionRaw;

        const codeMatch = descriptionRaw.match(/\[CODE\](.*?)\[\/CODE\]/s);
        if (codeMatch && codeMatch[1]) {
            const codeContent = codeMatch[1].trim();
            // Create the HTML for the styled code block
            codeBlockHtml = `
                <tr>
                    <td style="padding-top: 0;">
                        <div style="padding: 12px; background-color: ${METRO_CODE_PINK}; border-radius: 8px; font-size: 14px; color: #312e81; font-family: monospace; word-wrap: break-word; margin-bottom: 10px;">
                            ${codeContent.replace(/\n/g, '<br>')}
                        </div>
                    </td>
                </tr>
            `;
            // Remove the [CODE]...[/CODE] part from the main body content
            descriptionBody = descriptionRaw.replace(codeMatch[0], '').trim();
        } else {
            // Use an empty row for consistent structure if no code block exists
            codeBlockHtml = `<tr><td style="padding-top: 0;"></td></tr>`;
        }

        // --- 2. Separate Description Body into main content and SOC list (if pipe exists) ---
        let socsListHtml = '';
        let mainDescriptionHtml = '';

        // Split descriptionBody into paragraphs/items. We assume the last section is the SOC list if it contains a pipe.
        const sections = descriptionBody.split(/\n\s*\n/);
        
        if (sections.length > 0) {
            let lastSection = sections[sections.length - 1];
            
            if (lastSection.includes('|')) {
                // If the last section has pipes, treat it as the SOC list
                const socsRaw = lastSection;
                // Use a regex to look for "Eligible SOCs include:" or similar title
                const socsTitle = socsRaw.match(/^(.*?):/);
                const displayTitle = socsTitle ? socsTitle[1].trim() + ":" : "List includes:";

                const socListItems = socsRaw.split('|')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                    .map(item => {
                        // Strip the title/prefix from the first item if found
                        let displayItem = item;
                        if (socsTitle && item.startsWith(socsTitle[0])) {
                            displayItem = item.substring(socsTitle[0].length).trim();
                        }
                        // Use the general body text color and size
                        return `<li style="font-weight: bold;">${displayItem.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</li>`
                    })
                    .join('');

                socsListHtml = `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="padding-top: 10px;">
                        <tr>
                            <td style="font-family: Arial, sans-serif;">
                                <p style="font-size: 16px; font-weight: bold; color: #333333; margin: 0 0 8px 0; padding-left: 8px;">${displayTitle}</p>
                                <ul style="list-style-type: disc; margin: 0; padding-left: 30px; font-size: 16px; color: #333333;">
                                    ${socListItems}
                                </ul>
                            </td>
                        </tr>
                    </table>
                `;
                // Remove the SOC list from the main description body
                sections.pop(); 
                descriptionBody = sections.join('\n\n');
            }
        }
        
        // --- 3. Format remaining main description content ---
        const mainParagraphs = descriptionBody.split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        const hasCodeBlock = !!codeMatch; // Check if the code block exists

        mainDescriptionHtml = mainParagraphs.map((p, index) => {
            // Set margin consistently to 10px for a standard content break inside the card.
            const marginBottom = '10px'; 

            if (p.includes('|')) {
                 // Treat as a list if pipe is used
                const listItems = p.split('|')
                    .map(item => item.trim())
                    .filter(item => item.length > 0)
                    .map(item => {
                        // Apply bold formatting to list item content
                        const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                        // Use the general body text color and size
                        return `<li style="margin: 0 0 4px 0;">${formattedItem}</li>`;
                    })
                    .join('');
                
                return `<ul style="list-style-type: disc; margin: 0 0 ${marginBottom} 0; padding-left: 20px; font-size: 16px; color: #333333;">${listItems}</ul>`;
            } else {
                // Treat as a single paragraph
                const formattedParagraph = p.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                // Use the general body text color and size
                return `<p style="color: #333333; line-height: 1.6; margin: 0 0 ${marginBottom} 0; padding-left: 8px;">${formattedParagraph.replace(/\n/g, '<br>')}</p>`;
            }
        }).join('');

        // --- 4. Assemble Final Metric Card HTML ---
        return `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${METRO_LIGHT_PINK}; border-left: 4px solid ${METRO_MAGENTA}; padding: 20px 20px 20px 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
                <tr>
                    <td style="font-family: Arial, sans-serif;">
                        <h2 style="font-size: 24px; font-weight: bold; color: ${METRO_DARK_MAGENTA}; margin-top: 0; margin-bottom: 12px; padding-left: 8px;">${title}</h2>

                        <!-- Main Description Content -->
                        ${mainDescriptionHtml}

                        <!-- Code Block (if present) -->
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            ${codeBlockHtml}
                        </table>
                        
                        <!-- SOCs List (if present) -->
                        ${socsListHtml}
                    </td>
                </tr>
            </table>
        `;
    }

    /**
     * Updates a single preview element based on input.
     */
    function updatePreviewElement(inputId, previewId, attr) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        if (input && preview) {
            const value = input.value;

            if (attr === 'innerHTML') {
                preview.innerHTML = value;
            } else if (attr === 'src' || attr === 'href') {
                preview[attr] = value;
            }
        }
    }

    /**
     * Handles the specific logic for the body content.
     */
    function updateBodyContent() {
        const input = document.getElementById('body-input');
        const preview = document.getElementById('preview-body');

        if (input && preview) {
            // This function now generates the full body content, including the metric card if the tag is present
            preview.innerHTML = processBodyContent(input.value);
        }
    }

    // Function to initialize and update all previews
    function updateAllPreviews() {
        // Update simple mappings first
        mappings.forEach(map => updatePreviewElement(map.inputId, map.previewId, map.attr));
        
        // Then update the complex body content
        updateBodyContent();
    }

    // Initialize all previews with default values
    updateAllPreviews();

    // --- Event Listeners for Real-Time Update ---
    
    // Attach event listeners for all editable inputs
    mappings.forEach(map => {
        const input = document.getElementById(map.inputId);
        if (input) {
            input.addEventListener('input', updateAllPreviews);
        }
    });

    // Listen for changes on all metric card inputs (now just title and description)
    ['metric-title-input', 'metric-description-input'].forEach(id => {
         const input = document.getElementById(id);
         if (input) {
            input.addEventListener('input', updateAllPreviews);
         }
    });

    // Special listener for the main body content
    const bodyInput = document.getElementById('body-input');
    if (bodyInput) {
        bodyInput.addEventListener('input', updateBodyContent);
    }
});
