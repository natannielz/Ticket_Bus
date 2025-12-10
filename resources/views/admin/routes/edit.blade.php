@extends('layouts.app')

@section('content')
<div class="row justify-content-center">
  <div class="col-md-6">
    <div class="card" style="border-top: 4px solid #667eea;">
      <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
        <h5 class="mb-0"><i class="fas fa-edit"></i> Edit Rute</h5>
      </div>
      <div class="card-body">
        <form method="POST" action="{{ route('admin.routes.update', $route) }}">
          @csrf
          @method('PUT')
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-route"></i> Nama Rute</label>
            <input name="name" class="form-control form-control-lg" value="{{ $route->name }}" required>
            @error('name')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-file-alt"></i> Deskripsi</label>
            <textarea name="description" class="form-control form-control-lg" rows="3">{{ $route->description }}</textarea>
            @error('description')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-road"></i> Jarak (km)</label>
            <input type="number" name="distance" class="form-control form-control-lg" placeholder="Contoh: 120" min="1" step="0.01" value="{{ $route->distance }}" required>
            @error('distance')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <div class="mb-3">
            <label class="form-label"><i class="fas fa-toggle-on"></i> Status</label>
            <select name="status" class="form-control form-control-lg">
              <option value="active" {{ $route->status === 'active' ? 'selected' : '' }}>Aktif</option>
              <option value="inactive" {{ $route->status === 'inactive' ? 'selected' : '' }}>Nonaktif</option>
            </select>
            @error('status')<span class="text-danger small">{{ $message }}</span>@enderror
          </div>
          <button class="btn btn-primary btn-lg w-100">
            <i class="fas fa-save"></i> Perbarui Rute
          </button>
          <a href="{{ route('admin.routes.index') }}" class="btn btn-secondary btn-lg w-100 mt-2">
            <i class="fas fa-arrow-left"></i> Kembali
          </a>
        </form>
      </div>
    </div>
  </div>
</div>
@endsection
