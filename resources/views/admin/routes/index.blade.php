@extends('layouts.app')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
  <div>
    <h2><i class="fas fa-map-marker-alt"></i> Kelola Rute</h2>
    <p class="text-muted">Daftar semua rute perjalanan yang tersedia</p>
  </div>
  <a href="{{ route('admin.routes.create') }}" class="btn btn-success btn-lg">
    <i class="fas fa-plus"></i> Tambah Rute
  </a>
</div>

<div class="card">
  <div class="card-header" style="background: linear-gradient(90deg, #2c3e50 0%, #34495e 100%); color: white;">
    <h5 class="mb-0"><i class="fas fa-list"></i> Data Rute</h5>
  </div>
  <div class="card-body">
    @if($routes->count() > 0)
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Rute</th>
              <th>Deskripsi</th>
              <th>Jarak (km)</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            @foreach($routes as $route)
              <tr>
                <td><strong>#{{ $route->id }}</strong></td>
                <td>
                  <i class="fas fa-route" style="color: #667eea; margin-right: 0.5rem;"></i>
                  <strong>{{ $route->name }}</strong>
                </td>
                <td>{{ $route->description ?? '-' }}</td>
                <td><span class="badge bg-info">{{ $route->distance }} km</span></td>
                <td>
                  @if($route->status == 'active')
                    <span class="badge bg-success">Aktif</span>
                  @else
                    <span class="badge bg-warning">Nonaktif</span>
                  @endif
                </td>
                <td>
                  <a href="{{ route('admin.routes.edit', $route) }}" class="btn btn-sm btn-primary" title="Edit">
                    <i class="fas fa-edit"></i>
                  </a>
                  <form action="{{ route('admin.routes.destroy', $route) }}" method="POST" style="display:inline">
                    @csrf @method('DELETE')
                    <button class="btn btn-sm btn-danger" onclick="return confirm('Yakin ingin menghapus?')" title="Hapus">
                      <i class="fas fa-trash"></i>
                    </button>
                  </form>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>
      </div>
    @else
      <div class="alert alert-info text-center">
        <i class="fas fa-info-circle"></i> Belum ada rute. <a href="{{ route('admin.routes.create') }}" class="alert-link">Tambahkan rute baru sekarang!</a>
      </div>
    @endif
  </div>
</div>

@endsection
