const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function comprehensiveAudit() {
    try {
        console.log('=== SANDGUARD FRONTEND AUDIT ===\n');
        
        const client = await CDP();
        const {Network, Page, Runtime, Console} = client;

        await Network.enable();
        await Page.enable();
        await Runtime.enable();

        // Track console logs
        const consoleLogs = [];
        Console.messageAdded((message) => {
            consoleLogs.push(message);
        });

        // Test 1: Landing Page
        console.log('1. LANDING PAGE AUDIT');
        console.log('===================');
        await Page.navigate({url: 'https://sandguard.netlify.app'});
        await Page.loadEventFired();
        await new Promise(resolve => setTimeout(resolve, 3000));

        const landingResult = await Runtime.evaluate({
            expression: `
                ({
                    title: document.title,
                    hasTransactionFirewall: document.body.innerText.includes('Transaction Firewall'),
                    hasSafeMultisig: document.body.innerText.includes('Safe Multisig'),
                    hasFeatures: {
                        decode: document.body.innerText.includes('Decode'),
                        simulate: document.body.innerText.includes('Simulate'),
                        riskScore: document.body.innerText.includes('Risk Score'),
                        pushAlerts: document.body.innerText.includes('Push Alerts')
                    },
                    hasHowItWorks: document.body.innerText.includes('How it works'),
                    hasPricing: document.body.innerText.includes('$20') || document.body.innerText.includes('20/mo'),
                    hasPayWithCrypto: document.body.innerText.includes('Pay with any crypto'),
                    buttons: {
                        getStarted: !!document.querySelector('[href*="login"]') || document.body.innerText.includes('Get Started'),
                        tryDemo: !!document.querySelector('[href*="app"]') || document.body.innerText.includes('Try Demo')
                    },
                    hasFooter: !!document.querySelector('footer') || document.body.innerText.toLowerCase().includes('footer'),
                    links: Array.from(document.querySelectorAll('a')).map(a => ({href: a.href, text: a.innerText.trim()})).filter(l => l.href && l.text)
                })
            `
        });

        const landing = landingResult.result.value;
        console.log('✓ Title:', landing.title);
        console.log('✓ Transaction Firewall:', landing.hasTransactionFirewall ? 'YES' : 'NO');
        console.log('✓ Safe Multisig:', landing.hasSafeMultisig ? 'YES' : 'NO');
        console.log('✓ Features:');
        console.log('  - Decode:', landing.hasFeatures.decode ? 'YES' : 'NO');
        console.log('  - Simulate:', landing.hasFeatures.simulate ? 'YES' : 'NO');
        console.log('  - Risk Score:', landing.hasFeatures.riskScore ? 'YES' : 'NO');
        console.log('  - Push Alerts:', landing.hasFeatures.pushAlerts ? 'YES' : 'NO');
        console.log('✓ How it works:', landing.hasHowItWorks ? 'YES' : 'NO');
        console.log('✓ Pricing ($20/mo):', landing.hasPricing ? 'YES' : 'NO');
        console.log('✓ Pay with crypto:', landing.hasPayWithCrypto ? 'YES' : 'NO');
        console.log('✓ Get Started button:', landing.buttons.getStarted ? 'YES' : 'NO');
        console.log('✓ Try Demo button:', landing.buttons.tryDemo ? 'YES' : 'NO');
        console.log('✓ Footer:', landing.hasFooter ? 'YES' : 'NO');
        console.log('✓ Links found:', landing.links.length);
        landing.links.forEach(link => console.log('  -', link.text, '→', link.href));

        // Test 2: Check if it's a SPA
        console.log('\n2. SPA ROUTING TEST');
        console.log('==================');
        
        // Try clicking links programmatically
        if (landing.links.length > 0) {
            for (const link of landing.links) {
                if (link.href.includes('/login') || link.href.includes('/app')) {
                    console.log('Testing link:', link.text, '→', link.href);
                    try {
                        await Page.navigate({url: link.href});
                        await Page.loadEventFired();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        const pageCheck = await Runtime.evaluate({
                            expression: `
                                ({
                                    url: window.location.href,
                                    title: document.title,
                                    is404: document.body.innerText.includes('Page not found'),
                                    hasContent: document.body.innerText.length > 100,
                                    bodyText: document.body.innerText.substring(0, 200) + '...'
                                })
                            `
                        });
                        
                        const page = pageCheck.result.value;
                        console.log('  URL:', page.url);
                        console.log('  Title:', page.title);
                        console.log('  Is 404:', page.is404 ? 'YES' : 'NO');
                        console.log('  Has content:', page.hasContent ? 'YES' : 'NO');
                        console.log('  Preview:', page.bodyText);
                    } catch (error) {
                        console.log('  ERROR:', error.message);
                    }
                }
            }
        }

        // Test 3: Direct URL tests
        console.log('\n3. DIRECT URL TESTS');
        console.log('===================');
        
        const urlsToTest = [
            'https://sandguard.netlify.app/login',
            'https://sandguard.netlify.app/app',
            'https://sandguard.netlify.app/settings',
            'https://sandguard.netlify.app/demo'
        ];

        for (const url of urlsToTest) {
            console.log('Testing:', url);
            try {
                await Page.navigate({url});
                await Page.loadEventFired();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const pageResult = await Runtime.evaluate({
                    expression: `
                        ({
                            url: window.location.href,
                            title: document.title,
                            is404: document.body.innerText.includes('Page not found'),
                            hasLoginForm: document.querySelector('input[type="password"]') || document.body.innerText.includes('login'),
                            hasDashboard: document.body.innerText.includes('Dashboard') || document.body.innerText.includes('Transaction'),
                            hasPayButton: document.body.innerText.includes('Pay with') || document.body.innerText.includes('Daimo'),
                            bodySnippet: document.body.innerText.substring(0, 300)
                        })
                    `
                });

                const page = pageResult.result.value;
                console.log('  Status:', page.is404 ? '404 NOT FOUND' : 'EXISTS');
                console.log('  Title:', page.title);
                console.log('  Has login form:', page.hasLoginForm ? 'YES' : 'NO');
                console.log('  Has dashboard:', page.hasDashboard ? 'YES' : 'NO');
                console.log('  Has pay button:', page.hasPayButton ? 'YES' : 'NO');
                console.log('  Content preview:', page.bodySnippet.substring(0, 100) + '...');
            } catch (error) {
                console.log('  ERROR:', error.message);
            }
            console.log('');
        }

        // Test 4: Mobile responsiveness
        console.log('4. MOBILE RESPONSIVENESS');
        console.log('=======================');
        
        await Page.navigate({url: 'https://sandguard.netlify.app'});
        await Page.loadEventFired();
        
        // Test mobile viewport
        await Page.setDeviceMetricsOverride({
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            mobile: true
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mobileCheck = await Runtime.evaluate({
            expression: `
                ({
                    viewport: {width: window.innerWidth, height: window.innerHeight},
                    hasMobileMenu: !!document.querySelector('.mobile-menu, .hamburger, [aria-label*="menu"]'),
                    isResponsive: window.innerWidth === 375,
                    hasOverflow: document.body.scrollWidth > window.innerWidth
                })
            `
        });

        const mobile = mobileCheck.result.value;
        console.log('✓ Mobile viewport:', mobile.viewport.width + 'x' + mobile.viewport.height);
        console.log('✓ Is responsive:', mobile.isResponsive ? 'YES' : 'NO');
        console.log('✓ Has mobile menu:', mobile.hasMobileMenu ? 'YES' : 'NO');
        console.log('✓ Has horizontal overflow:', mobile.hasOverflow ? 'YES (BAD)' : 'NO (GOOD)');

        // Reset viewport
        await Page.resetDeviceMetricsOverride();

        // Test 5: Performance and errors
        console.log('\n5. PERFORMANCE & ERRORS');
        console.log('=======================');
        
        console.log('Console logs captured:', consoleLogs.length);
        consoleLogs.forEach((log, i) => {
            console.log(`  ${i+1}. [${log.level}] ${log.text}`);
        });

        // Final screenshots
        await Page.navigate({url: 'https://sandguard.netlify.app'});
        await Page.loadEventFired();
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('\n6. FINAL SCREENSHOTS');
        console.log('====================');
        
        // Desktop screenshot
        const desktopScreenshot = await Page.captureScreenshot({format: 'png'});
        fs.writeFileSync('/home/clawdbot/clawd/final-desktop.png', desktopScreenshot.data, 'base64');
        console.log('✓ Desktop screenshot: final-desktop.png');

        // Mobile screenshot
        await Page.setDeviceMetricsOverride({
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            mobile: true
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mobileScreenshot = await Page.captureScreenshot({format: 'png'});
        fs.writeFileSync('/home/clawdbot/clawd/final-mobile.png', mobileScreenshot.data, 'base64');
        console.log('✓ Mobile screenshot: final-mobile.png');

        await client.close();
        
        console.log('\n=== AUDIT COMPLETE ===');

    } catch (error) {
        console.error('Comprehensive audit failed:', error);
    }
}

comprehensiveAudit();