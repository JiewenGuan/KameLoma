import { logMessage, convertText, convertToRomaji } from '../utils.js';

logMessage('Content script loaded on: ' + window.location.href);

// Check for auto-run setting
const hostname = window.location.hostname;
chrome.storage.local.get([`autoRun_${hostname}`, 'defaultSettings'], (result) => {
    if (result[`autoRun_${hostname}`]) {
        logMessage('Auto-run enabled for this domain.');
        const settings = result.defaultSettings || { fontSize: '12px', color: 'red', maskMode: false, ttsMode: false };
        startAnnotation(settings);
    }
});

function startAnnotation(settings) {
    logMessage('Starting annotation process...');

    // Inject or update style for ruby text
    let style = document.getElementById('kameloma-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'kameloma-style';
        document.head.appendChild(style);
    }

    // Default to red if no color provided, add spacing
    const color = settings.color || 'red';
    const fontSize = settings.fontSize || '12px';

    style.textContent = `
        rt.kameloma-rt {
            font-size: ${fontSize} !important;
            color: ${color} !important;
            margin: 0 0.2em !important; /* Add spacing */
            user-select: none;
            transition: opacity 0.2s ease, filter 0.2s ease;
        }
    `;

    if (settings.maskMode) {
        style.textContent += `
            rt.kameloma-rt {
                opacity: 0;
                filter: blur(2px);
            }
            ruby:hover rt.kameloma-rt {
                opacity: 1;
                filter: none;
            }
        `;
    }

    // Update global settings for TTS
    window.kameLomaSettings = settings;

    annotateTextNodes(document.body)
        .then(() => {
            logMessage('Annotation complete.');
            startObserver();
        })
        .catch(err => {
            logMessage('Annotation failed: ' + err);
            console.error(err);
        });
}

let observer;
let observerTimeout;
const pendingNodes = new Set();

function startObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // Ignore our own elements
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('kameloma-annotation') ||
                        node.classList.contains('kameloma-rt') ||
                        node.tagName === 'RT' ||
                        node.tagName === 'RP' ||
                        node.tagName === 'RUBY') {
                        return;
                    }
                }
                // We want to process this node
                pendingNodes.add(node);
                shouldProcess = true;
            });
        });

        if (shouldProcess) {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                logMessage(`Processing ${pendingNodes.size} new nodes...`);
                pendingNodes.forEach(node => {
                    if (document.body.contains(node)) {
                        annotateTextNodes(node);
                    }
                });
                pendingNodes.clear();
            }, 1000);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    logMessage('MutationObserver started.');
}

// TTS Click Listener
document.addEventListener('click', (e) => {
    if (!window.kameLomaSettings || !window.kameLomaSettings.ttsMode) return;

    // Check if clicked element is part of our annotation
    const ruby = e.target.closest('ruby');
    if (ruby) {
        // Clone to safely manipulate
        const clone = ruby.cloneNode(true);

        // Remove rt tags to get just the Kanji/Base text
        const rts = clone.querySelectorAll('rt');
        rts.forEach(rt => rt.remove());

        const textToRead = clone.textContent.trim();

        if (textToRead) {
            logMessage(`Reading: ${textToRead}`);
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'ja-JP';
            window.speechSynthesis.cancel(); // Stop previous
            window.speechSynthesis.speak(utterance);
        }
    }
});

async function annotateTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
            try {
                const convertedHtml = await convertText(text);
                if (convertedHtml && convertedHtml !== text) {
                    const span = document.createElement('span');
                    span.classList.add('kameloma-annotation');
                    span.innerHTML = convertedHtml;
                    // Add class to new rt tags for styling
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = convertedHtml;
                    const rts = tempDiv.querySelectorAll('rt');
                    rts.forEach(rt => rt.classList.add('kameloma-rt'));
                    span.innerHTML = tempDiv.innerHTML;

                    node.parentNode.replaceChild(span, node);
                }
            } catch (e) {
                logMessage('Error converting text: ' + e);
            }
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'RUBY') {
            // Handle existing ruby tags: convert <rt> content to Romaji
            const rts = node.querySelectorAll('rt');
            for (const rt of rts) {
                const text = rt.textContent.trim();
                if (text) {
                    try {
                        const romaji = await convertToRomaji(text);
                        if (romaji && romaji !== text) {
                            rt.textContent = romaji;
                            rt.classList.add('kameloma-rt'); // Add class for styling
                        }
                    } catch (e) {
                        logMessage('Error converting ruby text: ' + e);
                    }
                }
            }
            return; // Don't process children of RUBY
        }

        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'RT', 'RP'].includes(node.tagName)) return;

        const children = Array.from(node.childNodes);
        for (const child of children) {
            await annotateTextNodes(child);
        }
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logMessage('Received message: ' + JSON.stringify(message));

    if (message.action === 'annotate') {
        startAnnotation(message.settings);
        sendResponse({ status: 'success' });
        return true;
    }

    if (message.action === 'clear') {
        logMessage('Starting clear process...');
        try {
            const rubies = document.querySelectorAll('ruby');
            rubies.forEach(ruby => {
                // Clone the node to work safely
                const clone = ruby.cloneNode(true);
                const rts = clone.querySelectorAll('rt, rp');
                rts.forEach(rt => rt.remove());

                const text = clone.textContent;
                const textNode = document.createTextNode(text);
                ruby.parentNode.replaceChild(textNode, ruby);
            });

            // Remove style tag if exists
            const style = document.getElementById('kameloma-style');
            if (style) style.remove();

            // Stop observer if running
            if (observer) {
                observer.disconnect();
                observer = null;
                logMessage('MutationObserver stopped.');
            }

            sendResponse({ status: 'success' });
        } catch (e) {
            logMessage('Clear failed: ' + e);
            sendResponse({ status: 'error', message: e.toString() });
        }
    }
});