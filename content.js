// משתנים גלובליים לשמירת הגדרות
let signatureEnabled = false;
let signatureText = "בברכה,\nחיים";
let greetingEnabled = false;
let addBeha = true;

function waitForGmail() {
    // בודק אם Gmail נטען במלואו
    if (document.readyState === 'complete') {
        initRubikFont();
        
        // טוען הגדרות חתימה מהאחסון
        loadSignatureSettings();
    } else {
        setTimeout(waitForGmail, 100);
    }
}

// פונקציה לטעינת הגדרות מהאחסון
function loadSignatureSettings() {
    chrome.storage.sync.get([
        'signatureEnabled', 
        'signatureText', 
        'greetingEnabled', 
        'addBeha'
    ], function(result) {
        if (result.signatureEnabled !== undefined) {
            signatureEnabled = result.signatureEnabled;
        }
        
        if (result.signatureText !== undefined) {
            signatureText = result.signatureText;
        }
        
        if (result.greetingEnabled !== undefined) {
            greetingEnabled = result.greetingEnabled;
        }
        
        if (result.addBeha !== undefined) {
            addBeha = result.addBeha;
        }
    });
}

// מאזין להודעות מהפופאפ
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'updateSignature') {
        signatureEnabled = message.enabled;
        signatureText = message.text;
    } else if (message.action === 'updateSettings') {
        // עדכון הגדרות חתימה
        signatureEnabled = message.signature.enabled;
        signatureText = message.signature.text;
        
        // עדכון הגדרות ברכה
        greetingEnabled = message.greeting.enabled;
        addBeha = message.greeting.addBeha;
    }
});

function initRubikFont() {
    // פונקציה להחלת הפונט על אלמנט הטקסט של האימייל
    function applyRubikFont() {
        // שינוי הגדרות ברירת המחדל של Gmail
        changeGmailDefaults();

        // מחפש את אזור הכתיבה של האימייל
        const emailComposers = document.querySelectorAll('div.Am.Al.editable');

        if (emailComposers.length > 0) {
            emailComposers.forEach(composer => {
                // מגדיר את הפונט Rubik בגודל 11px
                composer.style.fontFamily = 'Rubik, sans-serif !important';
                composer.style.fontSize = '11pt !important';
                
                // מוסיף ברכה וחתימה אם האפשרויות מופעלות
                if (greetingEnabled || signatureEnabled) {
                    addContentToComposer(composer);
                }

                // מחליף את ה-gmail_default class או מוסיף אותו אם לא קיים
                const divs = composer.querySelectorAll('div');
                divs.forEach(div => {
                    if (div.className.includes('gmail_default')) {
                        div.setAttribute('style', 'font-family: Rubik, sans-serif !important; font-size: 11pt !important;');
                    }
                });
            });
        }

        // שינוי ברירת המחדל כשלוחצים על כפתור "כתוב"
        overrideComposeButton();
    }

    // פונקציה לשינוי הגדרות ברירת המחדל של Gmail
    function changeGmailDefaults() {
        // מחפש את התפריט הגדרות של Gmail
        const settingsMenu = document.querySelector('div[role="menu"]');
        if (settingsMenu) {
            // מנסה לקבוע את פונט ברירת המחדל בהגדרות
            const formatOptions = document.querySelectorAll('div[role="menuitem"]');
            formatOptions.forEach(option => {
                if (option.textContent.includes('פורמט טקסט') ||
                    option.textContent.includes('Text formatting') ||
                    option.textContent.includes('Format text')) {
                    option.click();
                    setTimeout(() => {
                        const fontSelector = document.querySelector('div[role="menu"] div[role="menuitem"][id*="font"]');
                        if (fontSelector) {
                            fontSelector.click();
                            setTimeout(() => {
                                const fontOptions = document.querySelectorAll('div[role="menuitem"]');
                                fontOptions.forEach(fontOption => {
                                    if (fontOption.textContent.includes('Rubik')) {
                                        fontOption.click();
                                    }
                                });
                            }, 200);
                        }
                    }, 200);
                }
            });
        }
    }

    // פונקציה לשינוי התנהגות כפתור "כתוב"
    function overrideComposeButton() {
        const composeButton = document.querySelector('div[role="button"][gh="cm"]');
        if (composeButton && !composeButton._rubikOverridden) {
            const originalClick = composeButton.onclick;
            composeButton.onclick = function (e) {
                if (originalClick) originalClick.call(this, e);

                // מחכה לפתיחת חלון הכתיבה ומחיל את הסגנון
                setTimeout(() => {
                    const newComposers = document.querySelectorAll('div.Am.Al.editable');
                    newComposers.forEach(composer => {
                        composer.style.fontFamily = 'Rubik, sans-serif !important';
                        composer.style.fontSize = '11pt !important';

                        // יוצר אלמנט style חדש להוספת CSS חזק יותר
                        const styleElement = document.createElement('style');
                        styleElement.textContent = `
                .gmail_default {
                  font-family: Rubik, sans-serif !important;
                  font-size: 11pt !important;
                  color: inherit !important;
                }
                div.Am.Al.editable {
                  font-family: Rubik, sans-serif !important;
                  font-size: 11pt !important;
                }
              `;
                        document.head.appendChild(styleElement);
                        
                        // מוסיף ברכה וחתימה אם האפשרויות מופעלות ורק פעם אחת
                        if ((greetingEnabled || signatureEnabled) && !composer._contentAdded) {
                            setTimeout(() => {
                                const newComposers = document.querySelectorAll('div.Am.Al.editable');
                                newComposers.forEach(composer => {
                                    // בודק שוב שלא הוספו ברכה וחתימה בינתיים
                                    if (!composer._contentAdded) {
                                        addContentToComposer(composer);
                                    }
                                });
                            }, 800);
                        }
                    });
                }, 500);
            };
            composeButton._rubikOverridden = true;
        }
    }

    // מריץ את הפונקציה בטעינה ראשונית
    applyRubikFont();

    // מריץ את הפונקציה כל 5 שניות כדי לתפוס חלונות חדשים
    setInterval(applyRubikFont, 5000);

    // מחכה לחלונות חדשים של חיבור אימייל
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                applyRubikFont();
            }
        });
    });

    // מתחיל לצפות בשינויים בדף
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// פונקציה להוספת ברכה וחתימה לחלון הכתיבה
function addContentToComposer(composer) {
    // מוסיף סימון לחלון שכבר הוספו לו ברכה וחתימה
    if (composer._contentAdded) {
        return;
    }
    
    // מסמן שהתוכן הוסף
    composer._contentAdded = true;
    
    // מחכה שהחלון יהיה מוכן
    setTimeout(() => {
        // בודק אם יש תוכן קיים
        const isEmpty = composer.textContent.trim() === '';
        
        // מכין את הברכה לפי השעה
        let greeting = '';
        if (greetingEnabled) {
            greeting = getTimeBasedGreeting();
        }
        
        // מכין את החתימה
        let signature = '';
        if (signatureEnabled) {
            signature = signatureText.replace(/\n/g, '<br>');
        }
        
        // בודק אם יש תוכן קיים
        if (isEmpty) {
            // אם אין תוכן, מוסיף את הברכה והחתימה ישירות
            let content = '';
            
            if (greetingEnabled) {
                content += `<div>${greeting}</div><div><br></div>`;
            }
            
            if (signatureEnabled) {
                if (greetingEnabled) {
                    content += `<div><br></div><div><br></div><div>${signature}</div>`;
                } else {
                    content += `<div>${signature}</div>`;
                }
            }
            
            composer.innerHTML = content;
        } else {
            // אם יש תוכן, מוסיף את הברכה בהתחלה ואת החתימה בסוף
            
            // מוסיף את הברכה בהתחלה אם מופעלת
            if (greetingEnabled && !composer.textContent.includes(greeting)) {
                const firstDiv = composer.querySelector('div:first-child');
                if (firstDiv) {
                    const greetingDiv = document.createElement('div');
                    greetingDiv.innerHTML = `${greeting}<div><br></div>`;
                    composer.insertBefore(greetingDiv, firstDiv);
                }
            }
            
            // מוסיף את החתימה בסוף אם מופעלת
            if (signatureEnabled && !composer.textContent.includes(signatureText)) {
                const lastDiv = composer.querySelector('div:last-child');
                if (lastDiv) {
                    // מוסיף שתי שורות ריקות ואז את החתימה
                    const signatureDiv = document.createElement('div');
                    signatureDiv.innerHTML = `<div><br></div><div><br></div><div>${signature}</div>`;
                    composer.appendChild(signatureDiv);
                } else {
                    // אם אין div אחרון, מוסיף את החתימה בסוף
                    composer.innerHTML += `<div><br></div><div><br></div><div>${signature}</div>`;
                }
            }
        }
    }, 500);
}

// פונקציה להחזרת ברכה מבוססת שעה
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour >= 5 && hour < 12) {
        greeting = 'בוקר טוב,';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'צהריים טובים,';
    } else if (hour >= 17 && hour < 21) {
        greeting = 'ערב טוב,';
    } else {
        greeting = 'לילה טוב,';
    }
    
    // מוסיף "ב"ה" אם האפשרות מופעלת
    if (addBeha) {
        greeting = `ב"ה<br><br>${greeting}`;
    }
    
    return greeting;
}

// התחל את התהליך
waitForGmail();
