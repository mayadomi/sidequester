<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Service Unavailable</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg: oklch(0.985 0 0);
            --surface: oklch(1 0 0);
            --border: oklch(0.922 0 0);
            --text: oklch(0.145 0 0);
            --muted: oklch(0.556 0 0);
            --accent: oklch(0.623 0.214 259.1);
            --radius: 0.75rem;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: oklch(0.145 0 0);
                --surface: oklch(0.205 0 0);
                --border: oklch(0.269 0 0);
                --text: oklch(0.985 0 0);
                --muted: oklch(0.708 0 0);
            }
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
            min-height: 100svh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 2.5rem 2rem;
            max-width: 28rem;
            width: 100%;
            text-align: center;
        }

        .icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: color-mix(in oklch, var(--accent) 12%, transparent);
            margin-bottom: 1.25rem;
        }

        .icon svg {
            width: 1.5rem;
            height: 1.5rem;
            stroke: var(--accent);
            fill: none;
            stroke-width: 1.75;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        h1 {
            font-size: 1.125rem;
            font-weight: 600;
            letter-spacing: -0.01em;
            margin-bottom: 0.5rem;
        }

        p {
            font-size: 0.875rem;
            color: var(--muted);
            line-height: 1.6;
        }

        .divider {
            border: none;
            border-top: 1px solid var(--border);
            margin: 1.5rem 0;
        }

        .hint {
            font-size: 0.75rem;
            color: var(--muted);
        }

        .hint code {
            font-family: ui-monospace, 'Cascadia Code', monospace;
            font-size: 0.7rem;
            background: color-mix(in oklch, var(--border) 60%, transparent);
            padding: 0.15em 0.4em;
            border-radius: 0.25rem;
        }
    </style>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet">
</head>
<body>
    <div class="card">
        <div class="icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.07 5.07a9 9 0 1 0 12.73 12.73M19 19l-7-7M3 12h1M12 3v1M5.6 5.6l.7.7"/>
                <path d="M12 8v4M12 16h.01"/>
            </svg>
        </div>

        <h1>Database Unavailable</h1>
        <p>The application database is currently unreachable. This usually means the Docker services are not running.</p>

        <hr class="divider">

        <p class="hint">
            Start the services with <code>docker compose up -d</code>, then reload the page.
        </p>
    </div>
</body>
</html>
