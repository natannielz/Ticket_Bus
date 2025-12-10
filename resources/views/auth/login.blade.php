@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
  <div class="col-md-5">
    <div class="card" style="border-top: 4px solid #667eea;">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <i class="fas fa-sign-in-alt" style="font-size: 3rem; color: #667eea;"></i>
          <h3 class="mt-3">Login</h3>
          <p class="text-muted">Masuk ke akun Anda</p>
        </div>

        <form method="POST" action="{{ route('login.post') }}">
          @csrf
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-envelope"></i> Email</label>
            <input type="email" name="email" class="form-control form-control-lg" value="{{ old('email') }}" required placeholder="admin@sewa.test">
            @error('email')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-lock"></i> Password</label>
            <input type="password" name="password" class="form-control form-control-lg" required placeholder="Masukkan password">
            @error('password')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3 form-check">
            <input type="checkbox" name="remember" class="form-check-input" id="remember">
            <label class="form-check-label" for="remember">Ingat saya</label>
          </div>
          <button class="btn btn-primary btn-lg w-100 mb-3">
            <i class="fas fa-arrow-right"></i> Login
          </button>
        </form>

        <hr>
        <p class="text-center text-muted">Belum punya akun? <a href="{{ route('register') }}" class="btn-link" style="text-decoration: none; color: #667eea;">Daftar sekarang</a></p>
      </div>
    </div>

    <div class="alert alert-info mt-3">
      <strong><i class="fas fa-info-circle"></i> Demo Admin</strong>
      <br>Email: admin@sewa.test
      <br>Password: password
    </div>
  </div>
</div>
@endsection
