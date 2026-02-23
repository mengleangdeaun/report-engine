<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Content</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            text-align: center;
        }

        .badge {
            display: inline-block;
            background: #f0f0f5;
            color: #555;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
        }

        h1 {
            font-size: 20px;
            color: #1a1a2e;
            margin-bottom: 8px;
        }

        .content {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            word-break: break-all;
            font-family: monospace;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
        }
    </style>
</head>

<body>
    <div class="card">
        <div class="badge">{{ ucfirst($qrCode->type) }}</div>
        <h1>{{ $qrCode->name }}</h1>
        <div class="content">{{ $qrCode->content }}</div>
    </div>
</body>

</html>