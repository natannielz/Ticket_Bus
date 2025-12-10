<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sewa Bus - Layanan Penyewaan Bus Terpercaya</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .navbar {
            background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .navbar-brand {
            font-size: 1.8rem;
            font-weight: bold;
            color: white !important;
        }
        .navbar-brand i {
            margin-right: 0.5rem;
        }
        .nav-link {
            color: #ecf0f1 !important;
            transition: all 0.3s ease;
        }
        .nav-link:hover {
            color: #3498db !important;
        }
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            padding: 2rem;
        }
        .hero h1 {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        .btn-group-hero {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn-large {
            padding: 1rem 2.5rem;
            font-size: 1.1rem;
            font-weight: bold;
            border-radius: 50px;
            transition: all 0.3s ease;
        }
        .btn-primary-custom {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            border: none;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(17, 153, 142, 0.4);
            color: white;
        }
        .btn-secondary-custom {
            background: white;
            color: #667eea;
            border: none;
            text-decoration: none;
            display: inline-block;
        }
        .btn-secondary-custom:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(255, 255, 255, 0.4);
            color: #667eea;
        }
        .features {
            background: white;
            padding: 5rem 2rem;
        }
        .feature-card {
            text-align: center;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            margin-bottom: 2rem;
        }
        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .feature-card i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #667eea;
        }
        .footer {
            background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%);
            color: white;
            text-align: center;
            padding: 3rem 2rem;
        }
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }
            .hero p {
                font-size: 1rem;
            }
            .btn-group-hero {
                flex-direction: column;
            }
            .btn-large {
                width: 100%;
            }
        }
    </style>
</head>
<body>
<nav class="navbar navbar-expand-lg">
    <div class="container-fluid px-4">
        <a class="navbar-brand" href="/"><i class="fas fa-bus"></i> Sewa Bus</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item"><a class="nav-link" href="#features"><i class="fas fa-star"></i> Fitur</a></li>
                <li class="nav-item"><a class="nav-link" href="{{ route('login') }}"><i class="fas fa-sign-in-alt"></i> Login</a></li>
                <li class="nav-item"><a class="nav-link" href="{{ route('register') }}"><i class="fas fa-user-plus"></i> Daftar</a></li>
            </ul>
        </div>
    </div>
</nav>

<div class="hero">
    <div>
        <h1><i class="fas fa-bus" style="margin-right: 1rem;"></i>Sewa Bus</h1>
        <p>Layanan Penyewaan Bus Terpercaya & Terjangkau</p>
        <p style="font-size: 1.1rem; margin-bottom: 3rem;">Pesan bus Anda sekarang dan nikmati perjalanan yang nyaman</p>
        <div class="btn-group-hero">
            <a href="{{ route('register') }}" class="btn btn-large btn-primary-custom">
                <i class="fas fa-user-plus"></i> Daftar Sekarang
            </a>
            <a href="{{ route('login') }}" class="btn btn-large btn-secondary-custom">
                <i class="fas fa-sign-in-alt"></i> Masuk
            </a>
        </div>
    </div>
</div>

<section class="features" id="features">
    <div class="container">
        <h2 style="text-align: center; color: #2c3e50; margin-bottom: 4rem; font-weight: bold;">
            <i class="fas fa-check-circle" style="color: #667eea; margin-right: 0.5rem;"></i>Keunggulan Kami
        </h2>
        <div class="row">
            <div class="col-md-4">
                <div class="feature-card">
                    <i class="fas fa-money-bill-wave"></i>
                    <h5>Harga Terjangkau</h5>
                    <p>Kami menawarkan harga yang kompetitif dan terjangkau untuk semua kalangan</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <i class="fas fa-clock"></i>
                    <h5>Layanan 24/7</h5>
                    <p>Tim customer service kami siap melayani Anda kapan saja</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <i class="fas fa-check"></i>
                    <h5>Armada Lengkap</h5>
                    <p>Berbagai pilihan bus sesuai dengan kebutuhan perjalanan Anda</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <i class="fas fa-shield-alt"></i>
                    <h5>Aman & Terpercaya</h5>
                    <p>Sopir berpengalaman dan bus dalam kondisi prima untuk keselamatan Anda</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <i class="fas fa-map-location-dot"></i>
                    <h5>Jangkauan Luas</h5>
                    <p>Melayani perjalanan ke berbagai kota dan daerah di seluruh Indonesia</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="feature-card">
                    <i class="fas fa-star"></i>
                    <h5>Kenyamanan Maksimal</h5>
                    <p>Bus dilengkapi AC, kursi empuk, dan fasilitas modern untuk kenyamanan Anda</p>
                </div>
            </div>
        </div>
    </div>
</section>

<footer class="footer">
    <p>&copy; 2025 Sewa Bus. Layanan Terbaik Untuk Anda. All Rights Reserved.</p>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
