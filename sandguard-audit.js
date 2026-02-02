const CDP = require('chrome-remote-interface');
const fs = require('fs');

async function auditSandGuard() {
    try {
        console.log('Connecting to Chrome...');
        const client = await CDP();
        const {Network, Page, Runtime, Emulation} = client;

        console.log('Enabling domains...');
        await Network.enable();
        await Page.enable();
        await Runtime.enable();

        console.log('Navigating to SandGuard...');
        await Page.navigate({url: 'https://sandguard.netlify.app'});

        console.log('Waiting for page load...');
        await Page.loadEventFired();

        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Taking screenshot...');
        const screenshot = await Page.captureScreenshot({format: 'png'});
        fs.writeFileSync('/home/clawdbot/clawd/landing-page.png', screenshot.data, 'base64');

        console.log('Getting page content...');
        const result = await Runtime.evaluate({
            expression: 'document.documentElement.outerHTML'
        });

        console.log('Analyzing landing page content...');
        const html = result.result.value;
        
        // Check for key elements
        const checks = {
            'Hero section with Transaction Firewall': html.includes('Transaction Firewall'),
            'Safe Multisig mentioned': html.includes('Safe Multisig') || html.includes('Multisig'),
            'Decode feature': html.includes('Decode'),
            'Simulate feature': html.includes('Simulate'),
            'Risk Score feature': html.includes('Risk Score'),
            'Push Alerts feature': html.includes('Push Alerts'),
            'How it works section': html.includes('How it works'),
            'Pricing $20/mo': html.includes('$20') || html.includes('20/mo'),
            'Pay with any crypto': html.includes('Pay with any crypto'),
            'Get Started button': html.includes('Get Started'),
            'Try Demo button': html.includes('Try Demo'),
            'Footer present': html.includes('<footer') || html.includes('footer')
        };

        console.log('Landing page analysis:');
        for (const [check, passed] of Object.entries(checks)) {
            console.log(`  ${passed ? '✓' : '✗'} ${check}`);
        }

        console.log('\nTesting login page...');
        await Page.navigate({url: 'https://sandguard.netlify.app/login'});
        await Page.loadEventFired();
        await new Promise(resolve => setTimeout(resolve, 2000));

        const loginScreenshot = await Page.captureScreenshot({format: 'png'});
        fs.writeFileSync('/home/clawdbot/clawd/login-page.png', loginScreenshot.data, 'base64');

        const loginResult = await Runtime.evaluate({
            expression: 'document.documentElement.outerHTML'
        });

        const loginHtml = loginResult.result.value;
        const loginChecks = {
            'Daimo Pay with any crypto button': loginHtml.includes('Daimo') || loginHtml.includes('Pay with any crypto'),
            'Promo code section': loginHtml.includes('promo') || loginHtml.includes('code'),
            'Skip try demo link': loginHtml.includes('Skip') && loginHtml.includes('demo'),
            'What\'s included list': loginHtml.includes('included') || loginHtml.includes('feature')
        };

        console.log('\nLogin page analysis:');
        for (const [check, passed] of Object.entries(loginChecks)) {
            console.log(`  ${passed ? '✓' : '✗'} ${check}`);
        }

        console.log('\nTesting demo app...');
        await Page.navigate({url: 'https://sandguard.netlify.app/app'});
        await Page.loadEventFired();
        await new Promise(resolve => setTimeout(resolve, 3000));

        const appScreenshot = await Page.captureScreenshot({format: 'png'});
        fs.writeFileSync('/home/clawdbot/clawd/app-page.png', appScreenshot.data, 'base64');

        const appResult = await Runtime.evaluate({
            expression: 'document.documentElement.outerHTML'
        });

        const appHtml = appResult.result.value;
        const appChecks = {
            'Safe Multisig card': appHtml.includes('Safe') && (appHtml.includes('Multisig') || appHtml.includes('multisig')),
            'Counters present': appHtml.includes('Safe') || appHtml.includes('Caution') || appHtml.includes('Danger'),
            'No pending transactions': appHtml.includes('No pending') || appHtml.includes('pending transactions'),
            'Bottom navigation': appHtml.includes('Dashboard') && appHtml.includes('Settings'),
            'TX Queue nav': appHtml.includes('Queue') || appHtml.includes('TX')
        };

        console.log('\nApp page analysis:');
        for (const [check, passed] of Object.entries(appChecks)) {
            console.log(`  ${passed ? '✓' : '✗'} ${check}`);
        }

        console.log('\nChecking console errors...');
        const logs = await Runtime.evaluate({
            expression: `
                console.logs = console.logs || [];
                console.originalLog = console.originalLog || console.log;
                console.originalError = console.originalError || console.error;
                console.log = function() {
                    console.logs.push({type: 'log', args: Array.from(arguments)});
                    console.originalLog.apply(console, arguments);
                };
                console.error = function() {
                    console.logs.push({type: 'error', args: Array.from(arguments)});
                    console.originalError.apply(console, arguments);
                };
                console.logs;
            `
        });

        console.log('Audit completed successfully!');
        console.log('Screenshots saved:');
        console.log('  - landing-page.png');
        console.log('  - login-page.png'); 
        console.log('  - app-page.png');

        await client.close();

    } catch (error) {
        console.error('Audit failed:', error);
    }
}

auditSandGuard();