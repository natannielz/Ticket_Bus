@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
  <div class="col-md-5">
    <div class="card" style="border-top: 4px solid #11998e;">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <i class="fas fa-user-plus" style="font-size: 3rem; color: #11998e;"></i>
          <h3 class="mt-3">Daftar</h3>
          <p class="text-muted">Buat akun baru Anda</p>
        </div>

        <form method="POST" action="{{ route('register.post') }}">
          @csrf
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-user"></i> Nama Lengkap</label>
            <input type="text" name="name" class="form-control form-control-lg" value="{{ old('name') }}" required placeholder="Nama lengkap Anda">
            @error('name')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-envelope"></i> Email</label>
            <input type="email" name="email" class="form-control form-control-lg" value="{{ old('email') }}" required placeholder="Alamat email Anda">
            @error('email')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-lock"></i> Password</label>
            <input type="password" name="password" class="form-control form-control-lg" required placeholder="Minimal 6 karakter">
            @error('password')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-lock"></i> Konfirmasi Password</label>
            <input type="password" name="password_confirmation" class="form-control form-control-lg" required placeholder="Ulangi password Anda">
          </div>
          <button class="btn btn-success btn-lg w-100 mb-3">
            <i class="fas fa-check"></i> Daftar
          </button>
        </form>

        <hr>
        <p class="text-center text-muted">Sudah punya akun? <a href="{{ route('login') }}" class="btn-link" style="text-decoration: none; color: #11998e;">Login di sini</a></p>
      </div>
    </div>
  </div>
</div>
@endsection
