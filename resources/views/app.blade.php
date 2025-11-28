<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#0a1f44">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="SchoolMS">
    <meta name="description" content="Complete school management solution for Islamic schools following CBC curriculum">

    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">

    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="192x192" href="/images/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/images/icon-512x512.png">
    <link rel="apple-touch-icon" href="/images/icon-192x192.png">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead

    <!-- Register Service Worker -->
    <script>
        if ('serviceWorker' in navigator) {
            let refreshing = false;

            // Detect controller change and refresh the page
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('✅ Service Worker registered:', registration);

                        // Check for updates every hour
                        setInterval(() => {
                            registration.update();
                        }, 60 * 60 * 1000);

                        // Listen for waiting service worker
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;

                            newWorker.addEventListener('statechange', () => {
                                if (
                                    newWorker.state === 'installed' &&
                                    navigator.serviceWorker.controller
                                ) {
                                    // New service worker available
                                    showUpdateNotification(registration);
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            });

            // Show update notification banner
            function showUpdateNotification(registration) {
                const banner = document.createElement('div');
                banner.className = 'fixed bottom-4 right-4 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-sm border border-orange-500';
                banner.style.background = 'linear-gradient(135deg, #0b1a34 0%, #1e3a5f 100%)';
                banner.innerHTML = `
                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <p class="font-semibold mb-1 text-orange-500">Update Available!</p>
                            <p class="text-sm text-gray-300">A new version of SchoolMS is ready.</p>
                        </div>
                        <button
                            onclick="this.parentElement.parentElement.querySelector('.update-btn').click()"
                            class="update-btn bg-orange-500 text-white px-4 py-2 rounded font-medium hover:bg-orange-600 transition-colors"
                            style="background-color: #ff6b35;"
                        >
                            Update
                        </button>
                    </div>
                `;

                banner.querySelector('.update-btn').addEventListener('click', () => {
                    if (registration.waiting) {
                        // Tell the waiting service worker to take over
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    banner.remove();
                });

                document.body.appendChild(banner);
            }
        }
    </script>
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>