@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
  <div class="col-md-6">
    <div class="card" style="border-top: 4px solid #667eea;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-plus-circle"></i> Tambah Armada Baru</h5>
      </div>
      <div class="card-body">
        <form method="POST" action="{{ route('admin.armadas.store') }}">
          @csrf
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-bus"></i> Nama Bus</label>
            <input name="name" class="form-control form-control-lg" placeholder="Contoh: Bus Executive A" required>
            @error('name')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-chair"></i> Kapasitas Kursi</label>
            <input type="number" name="capacity" class="form-control form-control-lg" placeholder="Contoh: 45" min="1" required>
            @error('capacity')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-money-bill-alt"></i> Harga per km (Rp)</label>
            <input type="number" step="0.01" name="price_per_km" class="form-control form-control-lg" placeholder="Contoh: 50000" min="0" required>
            @error('price_per_km')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-toggle-on"></i> Status</label>
            <select name="status" class="form-control form-control-lg">
              <option value="available">Tersedia</option>
              <option value="maintenance">Maintenance</option>
            </select>
            @error('status')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <button class="btn btn-primary btn-lg w-100">
            <i class="fas fa-save"></i> Simpan Armada
          </button>
          <a href="{{ route('admin.armadas.index') }}" class="btn btn-secondary btn-lg w-100 mt-2">
            <i class="fas fa-arrow-left"></i> Kembali
          </a>
        </form>
      </div>
    </div>
  </div>
</div>
@endsection
