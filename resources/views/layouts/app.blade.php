<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sewa Bus</title>
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
            padding: 1rem 0;
        }
        .navbar-brand {
            font-size: 1.8rem;
            font-weight: bold;
            color: #fff !important;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .navbar-brand i {
            font-size: 2rem;
        }
        .nav-link {
            color: #ecf0f1 !important;
            margin: 0 0.5rem;
            transition: all 0.3s ease;
            position: relative;
        }
        .nav-link:hover {
            color: #3498db !important;
            transform: translateY(-2px);
        }
        .nav-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -5px;
            left: 0;
            background: #3498db;
            transition: width 0.3s ease;
        }
        .nav-link:hover::after {
            width: 100%;
        }
        .container {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            margin-top: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .alert {
            border-radius: 10px;
            border: none;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .card {
            border: none;
            border-radius: 12px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .btn {
            border-radius: 8px;
            padding: 0.6rem 1.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            color: white;
        }
        .btn-success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
        }
        .btn-success:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
            color: white;
        }
        .btn-info {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
        }
        .btn-info:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
            color: white;
        }
        .btn-danger {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
        }
        .btn-danger:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(250, 112, 154, 0.4);
            color: white;
        }
        h3, h2, h1 {
            color: #2c3e50;
            font-weight: bold;
            margin-bottom: 1.5rem;
        }
        .table {
            border-collapse: collapse;
        }
        .table thead {
            background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%);
            color: white;
        }
        .table tbody tr {
            transition: all 0.2s ease;
            border-bottom: 1px solid #ecf0f1;
        }
        .table tbody tr:hover {
            background: #f8f9fa;
            transform: scale(1.01);
        }
        footer {
            text-align: center;
            padding: 2rem;
            color: #ecf0f1;
            margin-top: 3rem;
        }

        #map {
            height: 250px;
            width: 100%;
        }
        #info {
            margin-top: 10px;
            font-weight: bold;
        }
        #controls {
            margin-top: 10px;
        }
        button {
            padding: 8px 12px;
            font-size: 14px;
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
        @auth
          <li class="nav-item"><a class="nav-link" href="{{ url('/') }}"><i class="fas fa-home"></i> Home</a></li>
          @if(auth()->user()->isAdmin())
            <li class="nav-item"><a class="nav-link" href="{{ route('admin.dashboard') }}"><i class="fas fa-chart-line"></i> Admin</a></li>
          @else
            <li class="nav-item"><a class="nav-link" href="{{ route('bookings.create') }}"><i class="fas fa-calendar-check"></i> Booking</a></li>
            <li class="nav-item"><a class="nav-link" href="{{ route('bookings.index') }}"><i class="fas fa-file-invoice"></i> Transaksi</a></li>
          @endif
          <li class="nav-item"><a class="nav-link" href="{{ route('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
          <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display:none">@csrf</form>
        @else
          <li class="nav-item"><a class="nav-link" href="{{ route('login') }}"><i class="fas fa-sign-in-alt"></i> Login</a></li>
          <li class="nav-item"><a class="nav-link" href="{{ route('register') }}"><i class="fas fa-user-plus"></i> Register</a></li>
        @endauth
      </ul>
    </div>
  </div>
 </nav>

<div class="container">
    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="fas fa-check-circle"></i> {{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif
    @if(session('error'))
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-circle"></i> {{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif
    @if($errors->any())
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <i class="fas fa-exclamation-triangle"></i> Validation errors:
            <ul class="mb-0 mt-2">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    @endif

    @yield('content')
</div>

<footer>
    <p>&copy; 2025 Sewa Bus. Layanan Terbaik Untuk Anda.</p>
</footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
